from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.core.config import settings
from app.api import yield_trend, wafer_map
from app.views.pages import router as pages_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes (keep existing for compatibility)
app.include_router(yield_trend.router, prefix=f"{settings.API_V1_STR}/yield", tags=["yield"])
app.include_router(wafer_map.router, prefix=f"{settings.API_V1_STR}/wafer", tags=["wafer"])

# HTML page routes
app.include_router(pages_router)

# Health check endpoint to verify database connection
@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    """Check database connection status"""
    from app.api.deps import get_db_service
    from app.services.mock_db import MockDBService
    
    db_service = get_db_service()
    is_mock = isinstance(db_service, MockDBService)
    
    result = {
        "status": "ok",
        "database_mode": "mock" if is_mock else "oracle",
        "use_mock_db_setting": settings.USE_MOCK_DB,
    }
    
    # If using Oracle, test the connection
    if not is_mock:
        try:
            from app.services.oracle_db import oracle_db_service
            with oracle_db_service.engine.connect() as conn:
                conn.execute(text("SELECT 1 FROM DUAL"))
            result["oracle_connection"] = "success"
            result["oracle_dsn"] = settings.ORACLE_DSN
        except Exception as e:
            result["oracle_connection"] = "failed"
            result["oracle_error"] = str(e)
    
    return result

# Debug endpoint to check Oracle data
@app.get(f"{settings.API_V1_STR}/debug/oracle")
def debug_oracle(product_id: str = None):
    """Debug Oracle connection and data"""
    from app.api.deps import get_db_service
    from app.services.mock_db import MockDBService
    from datetime import date, timedelta
    
    db_service = get_db_service()
    is_mock = isinstance(db_service, MockDBService)
    
    if is_mock:
        return {"error": "Currently using MockDB, set USE_MOCK_DB=False"}
    
    result = {"mode": "oracle"}
    
    try:
        from app.services.oracle_db import oracle_db_service
        with oracle_db_service.engine.connect() as conn:
            # Check if table exists
            try:
                count_result = conn.execute(text("SELECT COUNT(*) FROM SEMI_CP_HEADER"))
                result["table_exists"] = True
                result["total_rows"] = count_result.scalar()
            except Exception as e:
                result["table_exists"] = False
                result["table_error"] = str(e)
                return result
            
            # Get sample product IDs
            try:
                products = conn.execute(text("SELECT DISTINCT PRODUCT_ID FROM SEMI_CP_HEADER WHERE ROWNUM <= 10"))
                result["sample_products"] = [row[0] for row in products]
            except Exception as e:
                result["products_error"] = str(e)
            
            # Get date range
            try:
                date_range = conn.execute(text("SELECT MIN(REGIST_DATE), MAX(REGIST_DATE) FROM SEMI_CP_HEADER"))
                row = date_range.fetchone()
                if row:
                    result["date_range"] = {"min": str(row[0]), "max": str(row[1])}
            except Exception as e:
                result["date_error"] = str(e)
            
            # If product_id provided, check specific data
            if product_id:
                try:
                    specific = conn.execute(
                        text("SELECT COUNT(*) FROM SEMI_CP_HEADER WHERE PRODUCT_ID = :pid"),
                        {"pid": product_id}
                    )
                    result[f"rows_for_{product_id}"] = specific.scalar()
                except Exception as e:
                    result["product_query_error"] = str(e)
                    
    except Exception as e:
        result["error"] = str(e)
    
    return result


from app.services.mock_db import mock_settings_service
from pydantic import BaseModel
from typing import List
from fastapi import Request
from fastapi.responses import HTMLResponse

class ProductToggleRequest(BaseModel):
    active: bool

class TargetSetRequest(BaseModel):
    product_id: str
    month: str
    target: float

@app.get(f"{settings.API_V1_STR}/settings/products")
def get_products():
    return mock_settings_service.get_products()

@app.post(f"{settings.API_V1_STR}/settings/products/{{product_id}}")
def toggle_product(product_id: str, request: ProductToggleRequest):
    result = mock_settings_service.toggle_product(product_id, request.active)
    # Return updated product list HTML for HTMX
    return result

@app.get(f"{settings.API_V1_STR}/settings/targets")
def get_target(product_id: str, month: str = None):
    return {"target": mock_settings_service.get_target(product_id, month)}

@app.post(f"{settings.API_V1_STR}/settings/targets")
def set_target(request: TargetSetRequest):
    mock_settings_service.set_target(request.product_id, request.month, request.target)
    return {"status": "success"}

@app.post(f"{settings.API_V1_STR}/settings/targets/bulk")
async def set_targets_bulk(request: Request):
    """Bulk save targets for a product/year from HTMX form"""
    form_data = await request.form()
    product_id = form_data.get("product_id")
    year = form_data.get("year")
    
    for key, value in form_data.items():
        if key.startswith(f"target_{product_id}"):
            # Extract month from key like target_PRODUCT-A_2024-01
            parts = key.split("_")
            if len(parts) >= 3:
                month = parts[-1]
                if value:
                    mock_settings_service.set_target(product_id, month, float(value))
    
    return {"status": "success"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import yield_trend, wafer_map

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(yield_trend.router, prefix=f"{settings.API_V1_STR}/yield", tags=["yield"])
app.include_router(wafer_map.router, prefix=f"{settings.API_V1_STR}/wafer", tags=["wafer"])

from app.services.mock_db import mock_settings_service
from pydantic import BaseModel
from typing import List

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
    return mock_settings_service.toggle_product(product_id, request.active)

@app.get(f"{settings.API_V1_STR}/settings/targets")
def get_target(product_id: str, month: str = None):
    return {"target": mock_settings_service.get_target(product_id, month)}

@app.post(f"{settings.API_V1_STR}/settings/targets")
def set_target(request: TargetSetRequest):
    mock_settings_service.set_target(request.product_id, request.month, request.target)
    return {"status": "success"}

@app.get("/")
def root():
    return {"message": "Welcome to Semiconductor Yield Platform API"}

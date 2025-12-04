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

@app.get("/")
def root():
    return {"message": "Welcome to Semiconductor Yield Platform API"}

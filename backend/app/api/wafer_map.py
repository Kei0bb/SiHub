from fastapi import APIRouter, Depends
from app.models.wafer_map import WaferMapResponse
from app.api.deps import get_db_service

router = APIRouter()

@router.get("/map", response_model=WaferMapResponse)
def get_wafer_map(
    lot_id: str,
    wafer_id: int,
    db_service = Depends(get_db_service)
):
    return db_service.get_wafer_map(lot_id, wafer_id)

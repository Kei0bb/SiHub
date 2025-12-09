from fastapi import APIRouter, Depends
from app.models.wafer_map import WaferMapResponse
from app.api.deps import get_db_service
from typing import List

router = APIRouter()

@router.get("/map", response_model=WaferMapResponse)
def get_wafer_map(
    lot_id: str,
    wafer_id: int,
    db_service = Depends(get_db_service)
):
    return db_service.get_wafer_map(lot_id, wafer_id)

@router.get("/lots", response_model=List[str])
def get_lots(
    product_id: str,
    db_service = Depends(get_db_service)
):
    return db_service.get_lots(product_id)

@router.get("/lot_maps", response_model=List[WaferMapResponse])
def get_lot_wafer_maps(
    lot_id: str,
    db_service = Depends(get_db_service)
):
    return db_service.get_lot_wafer_maps(lot_id)

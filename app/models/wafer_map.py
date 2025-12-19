from pydantic import BaseModel
from typing import List

class WaferMapResponse(BaseModel):
    lot_id: str
    wafer_id: int
    product_id: str
    x: List[int]
    y: List[int]
    bin: List[int]

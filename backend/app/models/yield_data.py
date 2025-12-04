from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional

class YieldDataPoint(BaseModel):
    lot_id: str
    product_id: str
    step_name: Optional[str] = None
    process_date: date
    yield_value: float
    wafer_count: int

class YieldTrendResponse(BaseModel):
    product_id: str
    start_date: date
    end_date: date
    data: List[YieldDataPoint]
    statistics: dict

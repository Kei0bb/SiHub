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

class DailyYieldStats(BaseModel):
    date: date
    lot_id: Optional[str] = None
    mean_yield: float
    wafer_count: int
    bin_stats: dict[str, float]  # "Bincode_Binname": fail_rate_percentage

class YieldTrendResponse(BaseModel):
    product_id: str
    start_date: date
    end_date: date
    daily_trends: List[DailyYieldStats]
    statistics: dict

from fastapi import APIRouter, Query, Depends
from datetime import date, timedelta
from typing import Optional, List, Any
from pydantic import BaseModel
from app.models.yield_data import YieldTrendResponse
from app.api.deps import get_db_service
from app.services.analytics import analytics_service

router = APIRouter()

@router.get("/trend", response_model=YieldTrendResponse)
def get_yield_trend(
    product_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db_service = Depends(get_db_service)
):
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
        
    # Get data using injected service
    data = db_service.get_cp_yield_trend(product_id, start_date, end_date)
    
    # Calculate statistics using Analytics Service
    stats = analytics_service.calculate_yield_stats(data)
    
    return YieldTrendResponse(
        product_id=product_id,
        start_date=start_date,
        end_date=end_date,
        daily_trends=stats.get('daily_trends', []),
        statistics=stats
    )

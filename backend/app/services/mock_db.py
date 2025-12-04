import random
from datetime import date, timedelta, datetime
import pandas as pd
import numpy as np
from typing import List
from app.models.sonar_schema import SemiCpHeader
from app.models.wafer_map import WaferMapResponse
import math

class MockDBService:
    def __init__(self):
        pass

    def get_cp_yield_trend(self, product_id: str, start_date: date, end_date: date) -> List[SemiCpHeader]:
        # Generate mock data using SEMI_CP_HEADER schema
        data = []
        current_date = start_date
        
        # Base yield depends on product_id hash
        base_yield = 90.0 + (hash(product_id) % 10) / 2.0
        
        while current_date <= end_date:
            # Generate 1-5 wafers per day (simulating a lot or partial lot)
            num_wafers = random.randint(1, 5)
            lot_id = f"LOT-{current_date.strftime('%Y%m%d')}"
            
            for i in range(num_wafers):
                wafer_id = i + 1
                substrate_id = f"{lot_id}-{wafer_id:02d}"
                
                # Add some random variation
                variation = np.random.normal(0, 1.5)
                if random.random() < 0.05: # 5% chance of outlier
                    variation -= random.uniform(5, 15)
                
                yield_val = max(0.0, min(100.0, base_yield + variation))
                
                # Calculate chip counts based on yield
                total_chips = 1000
                pass_chips = int(total_chips * (yield_val / 100.0))
                
                data.append(SemiCpHeader(
                    SUBSTRATE_ID=substrate_id,
                    LOT_ID=lot_id,
                    WAFER_ID=wafer_id,
                    PRODUCT_ID=product_id,
                    PROCESS="CP_FINAL",
                    PASS_CHIP=pass_chips,
                    PASS_CHIP_RATE=round(yield_val, 2),
                    EFFECTIVE_NUM=total_chips,
                    REGIST_DATE=datetime.combine(current_date, datetime.min.time()),
                    REWORK_NEW=0
                ))
            
            current_date += timedelta(days=1)
            
        return data

    def get_wafer_map(self, lot_id: str, wafer_id: int) -> WaferMapResponse:
        # Generate synthetic wafer map
        # Assume 300mm wafer, die size ~10mm -> ~30x30 grid
        radius = 15
        x_coords = []
        y_coords = []
        bins = []
        
        product_id = "TEST-PRODUCT" # Mock product
        
        for x in range(-radius, radius + 1):
            for y in range(-radius, radius + 1):
                # Check if inside wafer circle
                if x*x + y*y <= radius*radius:
                    x_coords.append(x)
                    y_coords.append(y)
                    
                    # Generate bin
                    # 90% Pass (Bin 1), 10% Fail (Bin 99)
                    # Add some edge failure pattern
                    dist = math.sqrt(x*x + y*y)
                    prob_fail = 0.05
                    if dist > radius - 2: # Edge
                        prob_fail = 0.3
                        
                    if random.random() < prob_fail:
                        bins.append(99) # Fail
                    else:
                        bins.append(1) # Pass
                        
        return WaferMapResponse(
            lot_id=lot_id,
            wafer_id=wafer_id,
            product_id=product_id,
            x=x_coords,
            y=y_coords,
            bin=bins
        )

mock_db_service = MockDBService()

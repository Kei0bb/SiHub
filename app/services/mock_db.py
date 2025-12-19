import random
from datetime import date, timedelta, datetime
import pandas as pd
import numpy as np
from typing import List
from app.models.sonar_schema import SemiCpHeader
from app.models.wafer_map import WaferMapResponse
import math

class MockSettingsService:
    def __init__(self):
        # Mock In-Memory Persistence
        self.products = [
            {"id": "PRODUCT-A", "name": "Product A", "active": True},
            {"id": "PRODUCT-B", "name": "Product B", "active": False},
            {"id": "PRODUCT-C", "name": "Product C", "active": False},
        ]
        self.yield_targets = {
            # Format: 'YYYY-MM': { 'PRODUCT-ID': target_val }
            "2023-10": {"PRODUCT-A": 98.0, "PRODUCT-B": 95.0},
            "2023-11": {"PRODUCT-A": 98.5, "PRODUCT-B": 96.0},
            "2023-12": {"PRODUCT-A": 99.0, "PRODUCT-B": 97.0},
        }

    def get_products(self):
        return self.products

    def toggle_product(self, product_id: str, active: bool):
        for p in self.products:
            if p["id"] == product_id:
                p["active"] = active
                return p
        return None

    def get_target(self, product_id: str, month: str = None) -> float:
        if not month:
            month = datetime.now().strftime("%Y-%m")
        
        month_targets = self.yield_targets.get(month, {})
        return month_targets.get(product_id, 95.0) # Default 95.0

    def set_target(self, product_id: str, month: str, target: float):
        if month not in self.yield_targets:
            self.yield_targets[month] = {}
        self.yield_targets[month][product_id] = target
        return self.yield_targets[month]

mock_settings_service = MockSettingsService()

class MockDBService:
    def __init__(self):
        pass

    def get_cp_yield_trend(self, product_id: str, start_date: date, end_date: date) -> List[dict]:
        # Generate mock data using SEMI_CP_HEADER schema
        data = []
        current_date = start_date
        
        # Base yield depends on product_id hash
        base_yield = 90.0 + (hash(product_id) % 10) / 2.0
        
        # Get target from settings for simplistic comparison in trend (optional, handled in frontend mostly)
        
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
                fail_chips = total_chips - pass_chips
                
                # Distribute fail chips into bins
                # Mock bins: 3 (Open), 7 (Short), 99 (Other)
                open_fails = int(fail_chips * 0.45)
                short_fails = int(fail_chips * 0.35)
                other_fails = fail_chips - open_fails - short_fails
                
                header = SemiCpHeader(
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
                )
                
                # Combine header and bin counts
                row = header.model_dump()
                row['bins'] = {
                    "1_Pass": pass_chips,
                    "3_Open": open_fails,
                    "7_Short": short_fails,
                    "99_Other": other_fails
                }
                data.append(row)
            
            current_date += timedelta(days=1)
            
        return data

    def get_lots(self, product_id: str) -> List[str]:
        # Generate deterministic lots for a product
        seed = int(hash(product_id)) % 1000
        random.seed(seed)
        lots = []
        for i in range(5):
            date_part = (datetime.now() - timedelta(days=i*5)).strftime('%Y%m%d')
            lots.append(f"LOT-{date_part}-{product_id[-1]}")
        return lots
    
    def get_lots_for_product(self, product_id: str) -> List[str]:
        """Alias for get_lots to match views API"""
        return self.get_lots(product_id)
    
    def get_wafer_maps(self, lot_id: str) -> List[dict]:
        """Get all wafer maps for a lot as dicts"""
        maps = self.get_lot_wafer_maps(lot_id)
        return [m.model_dump() for m in maps]

    def get_wafer_map(self, lot_id: str, wafer_id: int) -> WaferMapResponse:
        # Generate synthetic wafer map
        # Deterministic generation based on lot_id + wafer_id
        seed = hash(f"{lot_id}-{wafer_id}")
        random.seed(seed)
        
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
                    
                    # Generate bin
                    dist = math.sqrt(x*x + y*y)
                    prob_fail = 0.05
                    
                    # Edge failure signature -> Soft Bin 3 (Open)
                    # Use deterministic random checks
                    is_edge_fail = False
                    if dist > radius - 2: 
                        if random.random() < 0.4:
                            is_edge_fail = True

                    if is_edge_fail:
                        x_coords.append(x)
                        y_coords.append(y)
                        bins.append(3) # Open
                    elif random.random() < prob_fail:
                        # Random defects -> Mix of 7 (Short) and 99 (Other)
                        if random.random() < 0.6:
                            bins.append(7) # Short
                        else:
                            bins.append(99) # Other
                        x_coords.append(x)
                        y_coords.append(y)
                    else:
                        bins.append(1) # Pass
                        x_coords.append(x)
                        y_coords.append(y)
                        
        return WaferMapResponse(
            lot_id=lot_id,
            wafer_id=wafer_id,
            product_id=product_id,
            x=x_coords,
            y=y_coords,
            bin=bins
        )

    def get_lot_wafer_maps(self, lot_id: str) -> List[WaferMapResponse]:
        maps = []
        for i in range(1, 26): # 25 wafers
            maps.append(self.get_wafer_map(lot_id, i))
        return maps

mock_db_service = MockDBService()

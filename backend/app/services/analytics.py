import numpy as np
from typing import List, Dict, Any
from app.models.sonar_schema import SemiCpHeader

class AnalyticsService:
    def calculate_yield_stats(self, data: List[SemiCpHeader]) -> Dict[str, Any]:
        if not data:
            return {}
            
        yields = [d.PASS_CHIP_RATE for d in data if d.PASS_CHIP_RATE is not None]
        
        if not yields:
            return {}
            
        mean = np.mean(yields)
        std_dev = np.std(yields)
        
        # Control Limits (3-sigma)
        ucl = mean + 3 * std_dev
        lcl = mean - 3 * std_dev
        
        # Histogram
        hist, bin_edges = np.histogram(yields, bins=10, range=(0, 100))
        
        return {
            "average": round(mean, 2),
            "std_dev": round(std_dev, 2),
            "min": round(np.min(yields), 2),
            "max": round(np.max(yields), 2),
            "ucl": round(ucl, 2),
            "lcl": round(max(0, lcl), 2), # LCL cannot be negative
            "target": 95.0, # Hardcoded target for now
            "histogram": {
                "counts": hist.tolist(),
                "bins": [round(b, 2) for b in bin_edges.tolist()]
            },
            "count": len(yields)
        }

analytics_service = AnalyticsService()

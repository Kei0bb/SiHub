import numpy as np
from typing import List, Dict, Any
from app.models.sonar_schema import SemiCpHeader

class AnalyticsService:
    def calculate_yield_stats(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not data:
            return {}
            
        # Extract yields for overall stats
        yields = [d['PASS_CHIP_RATE'] for d in data if d.get('PASS_CHIP_RATE') is not None]
        
        if not yields:
            return {}
            
        mean = np.mean(yields)
        std_dev = np.std(yields)
        
        # Control Limits (3-sigma)
        ucl = mean + 3 * std_dev
        lcl = mean - 3 * std_dev
        
        # Histogram
        hist, bin_edges = np.histogram(yields, bins=10, range=(0, 100))
        
        # Daily Aggregation for Trend
        daily_map = {}
        for row in data:
            date_key = row['REGIST_DATE'].date()
            if date_key not in daily_map:
                daily_map[date_key] = {
                    'yields': [],
                    'total_chips': 0,
                    'bin_sums': {},
                    'lot_ids': set()
                }
            
            daily_map[date_key]['yields'].append(row['PASS_CHIP_RATE'])
            daily_map[date_key]['total_chips'] += row.get('EFFECTIVE_NUM', 0)
            if 'LOT_ID' in row:
                daily_map[date_key]['lot_ids'].add(row['LOT_ID'])
            
            bins = row.get('bins', {})
            for bin_name, count in bins.items():
                if bin_name not in daily_map[date_key]['bin_sums']:
                    daily_map[date_key]['bin_sums'][bin_name] = 0
                daily_map[date_key]['bin_sums'][bin_name] += count
        
        daily_trends = []
        sorted_dates = sorted(daily_map.keys())
        
        for d in sorted_dates:
            d_stats = daily_map[d]
            day_mean = float(np.mean(d_stats['yields']))
            total_chips_day = d_stats['total_chips']
            
            # Use the first lot found for the day as the representative lot ID
            # In a real scenario with multiple lots per day, we might need a different strategy
            # or return a list. For now, we take one to satisfy the requirement.
            lot_id = list(d_stats['lot_ids'])[0] if d_stats['lot_ids'] else None
            
            bin_percentages = {}
            for bin_name, count in d_stats['bin_sums'].items():
                if total_chips_day > 0:
                    bin_percentages[bin_name] = round((count / total_chips_day) * 100.0, 2)
                else:
                    bin_percentages[bin_name] = 0.0
            
            daily_trends.append({
                "date": d,
                "lot_id": lot_id,
                "mean_yield": round(day_mean, 2),
                "wafer_count": len(d_stats['yields']),
                "bin_stats": bin_percentages
            })

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
            "count": len(yields),
            "daily_trends": daily_trends
        }

analytics_service = AnalyticsService()

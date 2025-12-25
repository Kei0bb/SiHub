import numpy as np
from typing import List, Dict, Any
from app.models.sonar_schema import SemiCpHeader
from datetime import datetime

class AnalyticsService:
    def calculate_yield_stats(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not data:
            return {}
        
        # Convert and extract yields for overall stats (handle Oracle type issues)
        # Oracle may return lowercase column names
        yields = []
        for d in data:
            rate = d.get('PASS_CHIP_RATE') or d.get('pass_chip_rate')
            if rate is not None:
                try:
                    yields.append(float(rate))
                except (ValueError, TypeError):
                    pass
        
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
            # Handle case-insensitive column names (Oracle may return lowercase)
            regist_date = row.get('REGIST_DATE') or row.get('regist_date')
            if regist_date is None:
                continue
            if hasattr(regist_date, 'date'):
                date_key = regist_date.date()
            elif isinstance(regist_date, str):
                date_key = datetime.strptime(regist_date[:10], '%Y-%m-%d').date()
            else:
                date_key = regist_date
                
            if date_key not in daily_map:
                daily_map[date_key] = {
                    'yields': [],
                    'total_chips': 0,
                    'bin_sums': {},
                    'lot_ids': set()
                }
            
            # Convert values safely (handle case-insensitive keys)
            pass_chip_rate = row.get('PASS_CHIP_RATE') or row.get('pass_chip_rate')
            try:
                yield_val = float(pass_chip_rate) if pass_chip_rate is not None else 0
            except (ValueError, TypeError):
                yield_val = 0
            
            effective_num = row.get('EFFECTIVE_NUM') or row.get('effective_num')
            try:
                effective_num = int(effective_num or 0)
            except (ValueError, TypeError):
                effective_num = 0
            
            lot_id = row.get('LOT_ID') or row.get('lot_id')
                
            daily_map[date_key]['yields'].append(yield_val)
            daily_map[date_key]['total_chips'] += effective_num
            if lot_id:
                daily_map[date_key]['lot_ids'].add(lot_id)
            
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

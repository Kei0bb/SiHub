from sqlalchemy import create_engine, text
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.core.config import settings
from app.models.sonar_schema import SemiCpHeader
from app.models.wafer_map import WaferMapResponse

class OracleDBService:
    def __init__(self):
        # Lazy initialization - don't create engine until first use
        self._engine = None
        self._database_url = None
        # In-memory cache for product active states and targets
        self._product_active_states = {}  # product_id -> bool
        self._yield_targets = {}  # "product_id-YYYY-MM" -> float
    
    @property
    def engine(self):
        """Lazy engine creation - only connects when actually used"""
        if self._engine is None:
            import oracledb
            
            dsn = settings.ORACLE_DSN
            
            # Check if DSN is in SID format (host:port:SID) vs Service Name format (host:port/service)
            if ':' in dsn and '/' not in dsn:
                # SID format: host:port:SID
                parts = dsn.split(':')
                if len(parts) == 3:
                    host, port, sid = parts
                    # Use oracledb.makedsn to create proper DSN for SID
                    dsn = oracledb.makedsn(host, int(port), sid=sid)
            
            # Construct SQLAlchemy connection string
            # Format: oracle+oracledb://user:password@dsn
            self._database_url = f"oracle+oracledb://{settings.ORACLE_USER}:{settings.ORACLE_PASSWORD}@{dsn}"
            
            # Create engine with thick mode for better compatibility
            self._engine = create_engine(
                self._database_url,
                pool_size=5,
                max_overflow=10,
                pool_recycle=3600
            )
        return self._engine

    def get_cp_yield_trend(self, product_id: str, start_date: date, end_date: date) -> List[dict]:
        # Calculate days from today for SYSDATE-based query
        from datetime import date as date_type
        today = date_type.today()
        days_back = (today - start_date).days
        days_forward = (end_date - today).days
        
        # Use SYSDATE arithmetic which we know works
        # Note: PERFECT_PASS_CHIP is aliased to PASS_CHIP_RATE for compatibility with analytics
        # Filter by PROCESS = 'CP' to get only CP process data
        query_str = f"""
            SELECT 
                SUBSTRATE_ID, LOT_ID, WAFER_ID, PRODUCT_ID, PROCESS, 
                PASS_CHIP, PERFECT_PASS_CHIP AS PASS_CHIP_RATE, REGIST_DATE, REWORK_NEW, EFFECTIVE_NUM
            FROM SEMI_CP_HEADER
            WHERE PRODUCT_ID = :product_id
            AND PROCESS = 'CP'
            AND REGIST_DATE >= SYSDATE - {days_back}
            AND REGIST_DATE <= SYSDATE + {days_forward}
            ORDER BY REGIST_DATE ASC
        """
        
        query = text(query_str)
        
        data = []
        try:
            with self.engine.connect() as conn:
                result = conn.execute(query, {
                    "product_id": product_id
                })
                
                for row in result:
                    # Normalize keys to uppercase for analytics compatibility
                    row_dict = {k.upper(): v for k, v in row._mapping.items()}
                    row_dict['bins'] = {}
                    data.append(row_dict)
        except Exception as e:
            print(f"Oracle DB Error: {e}")
            return []
                
        return data

    def get_wafer_map(self, lot_id: str, wafer_id: int) -> WaferMapResponse:
        # Placeholder for now as per plan (Mock is primary for Map)
        return WaferMapResponse(
            lot_id=lot_id,
            wafer_id=wafer_id,
            product_id="UNKNOWN",
            x=[],
            y=[],
            bin=[]
        )
    
    def get_products(self) -> List[dict]:
        """Get distinct products from Oracle DB"""
        query = text("""
            SELECT DISTINCT PRODUCT_ID 
            FROM SEMI_CP_HEADER 
            WHERE PRODUCT_ID IS NOT NULL
            ORDER BY PRODUCT_ID
        """)
        
        products = []
        try:
            with self.engine.connect() as conn:
                result = conn.execute(query)
                for row in result:
                    product_id = row[0]
                    # Use cached active state, default to False
                    is_active = self._product_active_states.get(product_id, False)
                    products.append({
                        "id": product_id,
                        "name": product_id,
                        "active": is_active
                    })
        except Exception as e:
            print(f"Oracle DB Error getting products: {e}")
            return []
        
        return products
    
    def toggle_product(self, product_id: str, active: bool) -> dict:
        """Toggle product active state (stored in memory cache)"""
        self._product_active_states[product_id] = active
        return {"id": product_id, "name": product_id, "active": active}
    
    def get_target(self, product_id: str, month: str = None) -> float:
        """Get yield target for a product/month (returns None if not set)"""
        if not month:
            month = datetime.now().strftime("%Y-%m")
        key = f"{product_id}-{month}"
        return self._yield_targets.get(key)  # Return None if not set
    
    def set_target(self, product_id: str, month: str, target: float):
        """Set yield target for a product/month"""
        key = f"{product_id}-{month}"
        self._yield_targets[key] = target
        return self._yield_targets

oracle_db_service = OracleDBService()

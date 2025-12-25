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
        query = text(f"""
            SELECT 
                SUBSTRATE_ID, LOT_ID, WAFER_ID, PRODUCT_ID, PROCESS, 
                PASS_CHIP, PASS_CHIP_RATE, REGIST_DATE, REWORK_NEW, EFFECTIVE_NUM
            FROM SEMI_CP_HEADER
            WHERE PRODUCT_ID = :product_id
            AND REGIST_DATE >= SYSDATE - {days_back}
            AND REGIST_DATE <= SYSDATE + {days_forward}
            ORDER BY REGIST_DATE ASC
        """)
        
        data = []
        # Don't catch exceptions - let them propagate so we can see the error
        with self.engine.connect() as conn:
            result = conn.execute(query, {
                "product_id": product_id
            })
            
            # SQLAlchemy returns Row objects - convert to dict for analytics service
            for row in result:
                row_dict = dict(row._mapping)
                # Add empty bins dict (Oracle doesn't have bin breakdown in SEMI_CP_HEADER)
                row_dict['bins'] = {}
                data.append(row_dict)
                
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
                    products.append({
                        "id": product_id,
                        "name": product_id,  # Use ID as name for Oracle data
                        "active": True  # All Oracle products are active by default
                    })
        except Exception as e:
            print(f"Oracle DB Error getting products: {e}")
            return []
        
        return products

oracle_db_service = OracleDBService()

from sqlalchemy import create_engine, text
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.core.config import settings
from app.models.sonar_schema import SemiCpHeader
from app.models.wafer_map import WaferMapResponse
from app.services.settings_store import settings_store

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
        substrate_ids = []
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
                    substrate_ids.append(row_dict['SUBSTRATE_ID'])
                
                # Fetch bin data from SEMI_CP_BIN_SUM if we have data
                if substrate_ids:
                    bin_query = text("""
                        SELECT SUBSTRATE_ID, BIN_CODE, BIN_NAME, BIN_COUNT
                        FROM SEMI_CP_BIN_SUM
                        WHERE SUBSTRATE_ID IN :substrate_ids
                        AND PROCESS = 'CP'
                    """)
                    
                    try:
                        bin_result = conn.execute(bin_query, {
                            "substrate_ids": tuple(substrate_ids)
                        })
                        
                        # Build lookup: substrate_id -> {bin_key: count}
                        bin_lookup = {}
                        for bin_row in bin_result:
                            sub_id = bin_row[0]
                            bin_code = bin_row[1]
                            bin_name = bin_row[2] or ""
                            bin_count = bin_row[3] or 0
                            
                            if sub_id not in bin_lookup:
                                bin_lookup[sub_id] = {}
                            
                            # Format: "BIN_CODE_BIN_NAME" like "1_Pass", "3_Open"
                            bin_key = f"{bin_code}_{bin_name}" if bin_name else str(bin_code)
                            bin_lookup[sub_id][bin_key] = bin_count
                        
                        # Merge bin data into results
                        for row_dict in data:
                            sub_id = row_dict['SUBSTRATE_ID']
                            if sub_id in bin_lookup:
                                row_dict['bins'] = bin_lookup[sub_id]
                    except Exception as bin_e:
                        print(f"Oracle DB Error fetching bin data: {bin_e}")
                        # Continue without bin data
                        
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
        """Get distinct products from Oracle DB (only products with data in last 365 days)"""
        # Optimized query: only get products with recent data
        query = text("""
            SELECT PRODUCT_ID
            FROM SEMI_CP_HEADER 
            WHERE PRODUCT_ID IS NOT NULL
            AND REGIST_DATE >= SYSDATE - 365
            GROUP BY PRODUCT_ID
            ORDER BY PRODUCT_ID
        """)
        
        products = []
        try:
            with self.engine.connect() as conn:
                result = conn.execute(query)
                for row in result:
                    product_id = row[0]
                    # Use settings_store for persistent active state
                    is_active = settings_store.get_product_active(product_id)
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
        """Toggle product active state (persisted to JSON)"""
        settings_store.set_product_active(product_id, active)
        return {"id": product_id, "name": product_id, "active": active}
    
    def get_target(self, product_id: str, month: str = None) -> float:
        """Get yield target for a product/month (returns None if not set)"""
        return settings_store.get_target(product_id, month)
    
    def set_target(self, product_id: str, month: str, target: float):
        """Set yield target for a product/month"""
        settings_store.set_target(product_id, month, target)
        return {"status": "success"}

oracle_db_service = OracleDBService()

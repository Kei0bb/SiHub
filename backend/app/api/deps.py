from app.core.config import settings
from app.services.mock_db import mock_db_service

# Lazy import to avoid import errors if oracledb is not installed or configured
# In a real app, we might handle this differently.
try:
    from app.services.oracle_db import oracle_db_service
except ImportError:
    oracle_db_service = None

def get_db_service():
    if settings.USE_MOCK_DB:
        return mock_db_service
    
    if oracle_db_service:
        return oracle_db_service
    else:
        # Fallback to mock if oracle service failed to load (e.g. missing lib)
        print("Warning: OracleDBService not available, falling back to MockDBService")
        return mock_db_service

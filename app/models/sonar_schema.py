from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional

# --- SEMI_CP Tables ---

class SemiCpHeader(BaseModel):
    SUBSTRATE_ID: str = Field(..., max_length=32)
    LOT_ID: Optional[str] = Field(None, max_length=24)
    WAFER_ID: int
    FRAME_ID: Optional[str] = Field(None, max_length=32)
    PRODUCT_ID: str = Field(..., max_length=32)
    SUPPLIER_NAME: Optional[str] = Field(None, max_length=32)
    MAX_ROW: Optional[int] = None
    MAX_COL: Optional[int] = None
    CREATE_DATE: Optional[datetime] = None
    MODIFY_DATE: Optional[datetime] = None
    PROCESS: str = Field(..., max_length=16)
    WAFER_X: Optional[int] = None
    WAFER_Y: Optional[int] = None
    TESTER_NAME: Optional[str] = Field(None, max_length=32)
    MAIN_PROGRAM_NAME: Optional[str] = Field(None, max_length=64)
    REV01: Optional[str] = Field(None, max_length=32)
    REV02: Optional[str] = Field(None, max_length=32)
    FAB_PRODUCT_ID: Optional[str] = Field(None, max_length=32)
    FACILITY: Optional[str] = Field(None, max_length=32)
    PASS_CHIP: Optional[int] = None
    PERFECT_PASS_CHIP: Optional[int] = None
    PASS_CHIP_RATE: Optional[float] = None  # Yield
    REGIST_DATE: Optional[datetime] = None
    DEL_FLAG: Optional[int] = None
    REWORK_NEW: int
    REWORK_CNT: Optional[int] = None
    EFFECTIVE_NUM: Optional[int] = None

class SemiCpBinSum(BaseModel):
    SUBSTRATE_ID: str = Field(..., max_length=32)
    LOT_ID: Optional[str] = Field(None, max_length=24)
    WAFER_ID: int
    PRODUCT_ID: str = Field(..., max_length=32)
    PROCESS: str = Field(..., max_length=16)
    BIN_CODE: int
    BIN_QUALITY: Optional[str] = Field(None, max_length=32)
    BIN_NAME: Optional[str] = Field(None, max_length=32)
    BIN_COUNT: Optional[int] = None
    CREATE_DATE: Optional[datetime] = None
    REGIST_DATE: Optional[datetime] = None
    DEL_FLAG: Optional[int] = None
    REWORK_NEW: int
    REWORK_CNT: Optional[int] = None

# --- SEMI_FT Tables ---

class SemiFtHeader(BaseModel):
    SUBSTRATE_ID: Optional[str] = Field(None, max_length=32)
    ASSY_LOT_ID: str = Field(..., max_length=32)
    WAFER_ID: Optional[int] = None
    FRAME_ID: Optional[str] = Field(None, max_length=32)
    PRODUCT_ID: str = Field(..., max_length=32)
    SUPPLIER_NAME: Optional[str] = Field(None, max_length=32)
    MAX_ROW: Optional[int] = None
    MAX_COL: Optional[int] = None
    CREATE_DATE: Optional[datetime] = None
    MODIFIED_DATE: Optional[datetime] = None
    PROCESS: str = Field(..., max_length=16)
    WAFER_X: Optional[int] = None
    WAFER_Y: Optional[int] = None
    TESTER_NAME: Optional[str] = Field(None, max_length=32)
    MAIN_PROGRAM_NAME: Optional[str] = Field(None, max_length=64)
    REV01: Optional[str] = Field(None, max_length=64)
    REV02: Optional[str] = Field(None, max_length=32)
    FAB_PRODUCT_ID: Optional[str] = Field(None, max_length=32)
    FACILITY: Optional[str] = Field(None, max_length=32)
    EFFECTIVE_NUM: Optional[int] = None
    PERFECT_PASS_CHIP: Optional[int] = None
    PASS_CHIP: Optional[int] = None
    REGIST_DATE: Optional[datetime] = None
    DEL_FLAG: Optional[int] = None
    REWORK_NEW: int
    REWORK_CNT: Optional[int] = None

class SemiFtBinSum(BaseModel):
    SUBSTRATE_ID: Optional[str] = Field(None, max_length=32)
    ASSY_LOT_ID: str = Field(..., max_length=32)
    WAFER_ID: int
    PRODUCT_ID: str = Field(..., max_length=32)
    PROCESS: str = Field(..., max_length=16)
    BIN_CODE: int
    BIN_QUALITY: Optional[str] = Field(None, max_length=32)
    BIN_NAME: Optional[str] = Field(None, max_length=64)
    BIN_COUNT: Optional[int] = None
    CREATE_DATE: Optional[datetime] = None
    REGIST_DATE: Optional[datetime] = None
    DEL_FLAG: Optional[int] = None
    REWORK_NEW: int
    REWORK_CNT: Optional[int] = None

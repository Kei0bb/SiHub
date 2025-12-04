from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Semiconductor Analytics Platform"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    USE_MOCK_DB: bool = True
    ORACLE_USER: str = "user"
    ORACLE_PASSWORD: str = "password"
    ORACLE_DSN: str = "localhost:1521/xe"

    class Config:
        env_file = ".env"

settings = Settings()

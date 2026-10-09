import os
from typing import List
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "QuickSync"
    TAGLINE: str = "Reliable Real-Time Quick-Commerce Data Infrastructure"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "quicksync_super_secret_jwt_key_998877665544332211")
    JWT_REFRESH_SECRET: str = os.getenv("JWT_REFRESH_SECRET", "quicksync_super_secret_refresh_jwt_key_1122334455")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./quicksync.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # QuickCommerce Live API
    QUICKCOMMERCE_BASE_URL: str = os.getenv("QUICKCOMMERCE_BASE_URL", "https://api.quickcommerceapi.com")
    QUICKCOMMERCE_API_KEY: str = os.getenv("QUICKCOMMERCE_API_KEY", "")
    
    # Default Coordinates (Bangalore default)
    DEFAULT_CITY: str = os.getenv("DEFAULT_CITY", "Bangalore")
    DEFAULT_AREA: str = os.getenv("DEFAULT_AREA", "Indiranagar")
    DEFAULT_LATITUDE: float = float(os.getenv("DEFAULT_LATITUDE", "12.9716"))
    DEFAULT_LONGITUDE: float = float(os.getenv("DEFAULT_LONGITUDE", "77.5946"))
    DEFAULT_PINCODE: str = os.getenv("DEFAULT_PINCODE", "560001")
    
    # Polling & Syncing Defaults
    SYNC_INTERVAL_SECONDS: int = int(os.getenv("SYNC_INTERVAL_SECONDS", "60"))
    API_TIMEOUT_SECONDS: int = int(os.getenv("API_TIMEOUT_SECONDS", "15"))
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

settings = Settings()

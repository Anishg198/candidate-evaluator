from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/hcl_module3"

    # LiveKit
    livekit_api_url: str = "http://localhost:7880"
    livekit_api_key: str = "devkey"
    livekit_api_secret: str = "secret"
    livekit_public_ws_url: str = "ws://localhost:7880"

    # App
    app_name: str = "HCL Module 3 - Technical Interview"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Frame analysis
    frame_analysis_interval_seconds: int = 3
    max_frame_size_bytes: int = 5 * 1024 * 1024  # 5 MB

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

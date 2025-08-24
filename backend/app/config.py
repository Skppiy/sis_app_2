from pydantic import BaseSettings, validator
from functools import lru_cache
from typing import List

US_TZS = [
    'America/New_York','America/Chicago','America/Denver','America/Phoenix',
    'America/Los_Angeles','America/Anchorage','Pacific/Honolulu'
]

class Settings(BaseSettings):
    app_name: str = "SIS API"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"
    secret_key: str = "change_me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    default_timezone: str = "America/Chicago"

    @validator('default_timezone')
    def tz_us_only(cls, v):
        if v not in US_TZS:
            raise ValueError(f"Default timezone '{v}' is not in allowed U.S. timezones: {US_TZS}")
        return v

    class Config:
        env_prefix = ""
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()

ALLOWED_TZS_US: List[str] = US_TZS

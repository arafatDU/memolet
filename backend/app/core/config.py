import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Memolet Backend"
    DATABASE_URL: str
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_USERNAME: Optional[str] = None
    REDIS_PASSWORD: Optional[str] = None
    NEO4J_URI: str
    NEO4J_USERNAME: str
    NEO4J_PASSWORD: str
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    JWT_SECRET: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    class Config:
        env_file = ".env"
        # Optional: default to case sensitive, etc


settings = Settings()

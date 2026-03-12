import os
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    LOG_LEVEL: str
    DEBUG: bool
    DATABASE_URL: str
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_UPLOAD_PRESET: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    class Config:
        env = os.environ.get("APP_CONFIG_FILE", "dev")
        env_file = Path(__file__).parent / f"config/{env}.env"
        case_sensitive = True

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from dotenv import load_dotenv

# Resolve the absolute path to the project root directory
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"

# Explicitly load .env from the project root if it exists
if ENV_FILE_PATH.exists():
    load_dotenv(dotenv_path=ENV_FILE_PATH)

# Detect if running in Vercel serverless environment
IS_VERCEL = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
DEFAULT_DB_URL = "sqlite:////tmp/app.db" if IS_VERCEL else f"sqlite:///{BASE_DIR}/app.db"

# Force /tmp/app.db on Vercel if DATABASE_URL in env points to a local read-only file
raw_db_url = os.getenv("DATABASE_URL")
if IS_VERCEL and raw_db_url and raw_db_url.startswith("sqlite") and "/tmp/" not in raw_db_url and ":memory:" not in raw_db_url:
    os.environ["DATABASE_URL"] = "sqlite:////tmp/app.db"

class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # Use /tmp/app.db when deployed on Vercel read-only filesystem
    DATABASE_URL: str = DEFAULT_DB_URL
    
    JWT_SECRET_KEY: str = "dev_secret_key_1234567890_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    GOOGLE_CLIENT_ID: str = ""
    GITHUB_TOKEN: Optional[str] = None

    # Groq AI configuration
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    ADMIN_PASSWORD: str = "admin123"
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

if IS_VERCEL and settings.DATABASE_URL.startswith("sqlite") and "/tmp/" not in settings.DATABASE_URL and ":memory:" not in settings.DATABASE_URL:
    settings.DATABASE_URL = "sqlite:////tmp/app.db"

# Debug print to verify loading during startup
print("Configuration Loaded successfully. IS_VERCEL:", IS_VERCEL, "DATABASE_URL:", settings.DATABASE_URL, "GROQ_API_KEY Configured:", bool(settings.GROQ_API_KEY))



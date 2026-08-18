from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from the backend .env file."""

    database_url: str = "postgresql+asyncpg://mps:mps@localhost:5432/mps"
    redis_url: str = "redis://localhost:6379/3"
    jwt_secret: str = ""
    bot_token: str = ""
    managers_chat_id: str = ""
    lawyer_tg_id: str = ""
    bot_bridge_secret: str = ""
    unisender_go_api_key: str = ""
    minimax_api_key: str = ""
    minimax_model: str = ""
    base_url: str = "https://mps-platform.local"
    cors_origins: str = "https://mps-platform.local"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

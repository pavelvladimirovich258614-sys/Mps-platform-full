from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from the backend .env file."""

    database_url: str = "postgresql+asyncpg://mps:mps@localhost:5432/mps"
    pg_dump_url: str = ""
    redis_url: str = "redis://localhost:6379/3"
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30
    refresh_token_days: int = 30
    auth_bot_token: str = ""
    relay_bot_token: str = ""
    telegram_webhook_secret: str = ""
    admin_tg_id: str = ""
    managers_chat_id: str = ""
    lawyer_tg_id: str = ""
    bot_bridge_secret: str = ""
    unisender_go_api_key: str = ""
    unisender_go_base_url: str = "https://goapi.unisender.ru/ru/transactional/api/v1"
    unisender_from_email: str = "noreply@example.com"
    minimax_api_key: str = ""
    minimax_model: str = ""
    minimax_base_url: str = "https://api.minimax.io/v1"
    base_url: str = "https://mps-platform.local"
    cors_origins: str = "https://mps-platform.local"
    media_dir: str = "media"
    frontend_dist_dir: str = "frontend/app/dist"
    forum_topic_limit: int = 3

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

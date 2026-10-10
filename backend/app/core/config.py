from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="Gyanoday School")
    app_env: Literal["development", "production"] = Field(default="development")
    database_url: str = Field(default="sqlite:///./school.db")
    secret_key: str = Field(default="change-me")
    jwt_algorithm: str = Field(default="HS256")
    admin_username: str = Field(default="admin")
    admin_password: str = Field(default="change-me")
    csrf_secret: str = Field(default="change-me")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

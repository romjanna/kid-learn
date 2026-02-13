from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://kidlearn:kidlearn_local@localhost:5432/kidlearn"
    redis_url: str = "redis://localhost:6379"
    openai_api_key: str = ""
    log_level: str = "INFO"
    channel: str = "learning-events"

    class Config:
        env_file = ".env"


settings = Settings()

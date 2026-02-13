from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://kidlearn:kidlearn_local@localhost:5432/kidlearn"
    redis_url: str = "redis://localhost:6379"
    opentdb_base_url: str = "https://opentdb.com/api.php"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()

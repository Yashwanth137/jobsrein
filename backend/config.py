from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str
    postgres_url: str
    api: str        # Primary Groq API key
    api1: str       # Backup key 1
    api2: str       # Backup key 2

    # LLM settings
    groq_model: str = "openai/gpt-oss-120b"
    llm_temperature: float = 0.0

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
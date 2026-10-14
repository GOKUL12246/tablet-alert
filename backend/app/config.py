from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./medisakhi.db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    OPENAI_API_KEY: Optional[str] = ""
    GEMINI_API_KEY: Optional[str] = "AQ.Ab8RN6I3C8Fqc7vjhdl4MH4en9iv8Gn5xEk2b4RcPW7tsh1dEQ"
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"

    SMS_PROVIDER: str = "demo"  # demo | twilio | msg91
    SMS_API_KEY: Optional[str] = ""
    SMS_SENDER_ID: str = "MEDISK"
    SMS_WEBHOOK_SECRET: Optional[str] = ""

    # Twilio Integration
    TWILIO_SID: Optional[str] = "ACf93bf342b2329038428531fc5433950a"
    TWILIO_AUTH_TOKEN: Optional[str] = "b82ed646f75d652e60ffbb2e2dcae601"
    TWILIO_NUMBER: Optional[str] = "+19787966432"
    RECEIVER_NUMBER: Optional[str] = "+916369067138"
    CARETAKER_PHONE: Optional[str] = "+916369067138"

    # Gmail SMTP Integration
    EMAIL_PROVIDER: str = "gmail"  # demo | gmail | smtp
    GMAIL_SENDER: Optional[str] = "g17670714@gmail.com"
    GMAIL_APP_PASSWORD: Optional[str] = "hexe syjd dfyv wbal"
    GMAIL_RECEIVER: Optional[str] = "g17670714@gmail.com"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465

    OCR_PROVIDER: str = "demo"  # demo | google | tesseract

    APP_NAME: str = "MEDISAKHI AI"
    DEMO_MODE: bool = True
    DEFAULT_LANGUAGE: str = "en"

    ESCALATION_DELAY_FIRST: int = 10  # minutes
    ESCALATION_DELAY_SECOND: int = 20
    ESCALATION_DELAY_CAREGIVER: int = 30

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

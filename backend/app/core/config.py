"""
Centralized Configuration management using Pydantic Settings.
Loads configuration cleanly from environment variables or .env file.
No hardcoded sensitive values or configuration parameters exist in application code.
"""

from functools import lru_cache
from typing import Any, List
from pydantic import Field, AliasChoices, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application core configurations. Shared across all services and modules.
    """
    # LLM & Providers
    GROQ_API_KEY: str = Field(
        default="gsk_placeholder_key", 
        description="API key for Groq LLM service"
    )
    LLM_MODEL: str = Field(
        default="llama-3.3-70b-versatile", 
        validation_alias=AliasChoices("LLM_MODEL", "DEFAULT_CHAT_MODEL"),
        description="Default LLM model identifier"
    )

    # Vector DB (Qdrant)
    QDRANT_URL: str = Field(
        default="http://localhost:6333",
        description="URL for Qdrant server"
    )
    QDRANT_COLLECTION: str = Field(
        default="shared_knowledge_vectors",
        description="Qdrant vector storage collection name"
    )

    # Relational & Real-Time DB (Supabase)
    SUPABASE_URL: str = Field(
        default="https://placeholder.supabase.co",
        description="Supabase instance URL"
    )
    SUPABASE_KEY: str = Field(
        default="placeholder-supabase-service-key",
        description="Supabase authentication key"
    )

    # Embeddings
    EMBEDDING_MODEL: str = Field(
        default="all-MiniLM-L6-v2",
        description="Sentence Transformers model for local embeddings"
    )

    # RAG Ingestion & Chunking
    CHUNK_SIZE: int = Field(
        default=1000,
        description="Maximum characters per chunk"
    )
    CHUNK_OVERLAP: int = Field(
        default=200,
        description="Character overlap between consecutive chunks"
    )
    TOP_K: int = Field(
        default=30,
        description="Number of vector search matches to return by default"
    )

    # Memory & File Limitations
    MAX_HISTORY: int = Field(
        default=20,
        description="Maximum conversational messages retained in active memory"
    )
    MAX_FILE_SIZE: int = Field(
        default=10485760, # 10MB
        description="Maximum upload file size in bytes"
    )
    SUPPORTED_FILE_TYPES: List[str] = Field(
        default=["pdf", "ppt", "pptx"],
        description="Allowed uploaded file extensions"
    )

    # Retrieval Configuration
    MAX_CONTEXT_TOKENS: int = Field(
        default=10000,
        description="Maximum token budget for retrieved context injected into prompts"
    )
    SIMILARITY_THRESHOLD: float = Field(
        default=0.01,
        description="Minimum cosine similarity score for retrieval results"
    )

    # Server Configuration
    BACKEND_HOST: str = Field(default="0.0.0.0", description="FastAPI host binding")
    BACKEND_PORT: int = Field(default=8000, description="FastAPI port binding")
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="Comma-separated allowed CORS origins"
    )
    LOG_LEVEL: str = Field(default="INFO", description="Logging sensitivity level")

    @field_validator("SUPPORTED_FILE_TYPES", mode="before")
    @classmethod
    def parse_supported_types(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [t.strip().lower() for t in v.split(",") if t.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Returns the singleton Settings instance.
    Cached via lru_cache to avoid redundant environment reads.
    """
    return Settings()

"""
Health verification API endpoints.
Provides comprehensive diagnostic reports for Groq LLM, Qdrant Vector Store, Sentence Transformers Embedding,
Supabase Database, and document extraction parser engines.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends
from app.models.api import HealthStatus, ComponentHealth
from app.llm.client import LLMClient
from app.embeddings.service import EmbeddingService
from app.vectordb.service import VectorStoreService
from app.db.supabase import SupabaseClient
from app.core.dependencies import (
    get_llm_client,
    get_embedding_service,
    get_vectordb_service,
    get_supabase_client,
)

router = APIRouter(prefix="/health", tags=["System Health"])


def _check_parsers_health() -> Dict[str, Any]:
    """Verify presence of parser libraries."""
    try:
        import fitz
        import pptx
        import bs4
        import youtube_transcript_api
        return {
            "component": "Parser Engines (PDF, PPT, Web, YouTube)",
            "status": "healthy",
            "message": "All required parsing libraries (PyMuPDF, python-pptx, BeautifulSoup4, youtube-transcript-api) are operational.",
        }
    except ImportError as e:
        return {
            "component": "Parser Engines",
            "status": "degraded",
            "message": f"Missing parser dependency: {str(e)}",
        }


@router.get("", response_model=HealthStatus, status_code=200)
async def overall_health(
    llm: LLMClient = Depends(get_llm_client),
    emb: EmbeddingService = Depends(get_embedding_service),
    vectordb: VectorStoreService = Depends(get_vectordb_service),
    supabase: SupabaseClient = Depends(get_supabase_client),
):
    """
    Perform deep diagnostic evaluation across all reusable AI backend services and infrastructure connections.
    """
    llm_h = llm.health()
    emb_h = emb.health()
    vdb_h = vectordb.health()
    sub_h = supabase.health()
    par_h = _check_parsers_health()

    components = {
        "llm": ComponentHealth(**llm_h),
        "embedding": ComponentHealth(**emb_h),
        "qdrant": ComponentHealth(**vdb_h),
        "supabase": ComponentHealth(**sub_h),
        "parsers": ComponentHealth(**par_h),
    }

    # Derive collective status
    statuses = [c.status for c in components.values()]
    if "unhealthy" in statuses and all(s == "unhealthy" for s in statuses):
        overall = "unhealthy"
    elif any(s in ["degraded", "unhealthy"] for s in statuses):
        overall = "degraded"
    else:
        overall = "healthy"

    return HealthStatus(status=overall, version="0.2.0", components=components)


@router.get("/llm", response_model=ComponentHealth, status_code=200)
async def health_llm(llm: LLMClient = Depends(get_llm_client)):
    """Diagnose network connectivity and API responsiveness of Groq LLM client."""
    return ComponentHealth(**llm.health())


@router.get("/qdrant", response_model=ComponentHealth, status_code=200)
async def health_qdrant(vectordb: VectorStoreService = Depends(get_vectordb_service)):
    """Diagnose Qdrant vector database storage connection and target collection readiness."""
    return ComponentHealth(**vectordb.health())


@router.get("/embedding", response_model=ComponentHealth, status_code=200)
async def health_embedding(emb: EmbeddingService = Depends(get_embedding_service)):
    """Diagnose Sentence-Transformers local embedding model weights and vector execution latency."""
    return ComponentHealth(**emb.health())


@router.get("/supabase", response_model=ComponentHealth, status_code=200)
async def health_supabase(supabase: SupabaseClient = Depends(get_supabase_client)):
    """Diagnose reusable Supabase client initial configuration status."""
    return ComponentHealth(**supabase.health())


@router.get("/parsers", response_model=ComponentHealth, status_code=200)
async def health_parsers():
    """Verify installation and readiness of PDF, PPT, Web, and YouTube content parser engines."""
    return ComponentHealth(**_check_parsers_health())

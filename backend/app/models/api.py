"""
API Request and Response schemas for standardized endpoints.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.document import SourceType, SourceMetadata


class UrlUploadRequest(BaseModel):
    """Request payload for web page ingestion."""
    url: str = Field(..., description="Target web URL to fetch and parse")
    session_id: Optional[str] = Field(None, description="Optional session scope")


class YoutubeUploadRequest(BaseModel):
    """Request payload for YouTube video transcript ingestion."""
    url_or_video_id: str = Field(..., description="YouTube URL or video ID")
    session_id: Optional[str] = Field(None, description="Optional session scope")
    language: str = Field("en", description="Preferred transcript language code")


class SourceResponse(BaseModel):
    """Response representing an indexed knowledge source in the registry."""
    source_id: str
    session_id: Optional[str] = None
    name: str
    type: SourceType
    status: str
    uploaded_at: str
    processing_time_ms: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DocumentDetailResponse(BaseModel):
    """Detailed document structure including chunk count and summary."""
    document_id: str
    metadata: SourceMetadata
    summary: Optional[str] = None
    chunks_count: int
    indexed_in_vectordb: bool


class ErrorResponse(BaseModel):
    """Standardized structured API error format."""
    error: str
    message: str
    status_code: int = 500
    details: Optional[Dict[str, Any]] = None


class ComponentHealth(BaseModel):
    """Individual service health diagnostic report."""
    component: str
    status: str  # "healthy", "degraded", "unhealthy", "not_initialized", "placeholder"
    message: str
    details: Optional[Dict[str, Any]] = None


class HealthStatus(BaseModel):
    """Overall API system health diagnosis."""
    status: str
    version: str = "0.1.0"
    components: Dict[str, ComponentHealth]

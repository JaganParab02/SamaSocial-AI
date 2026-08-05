"""
Domain models for Document ingestion, parsing, chunking, and metadata management.
These models are shared across Module 1 (Learning Assistant) and Module 2 (Course Planner).
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class SourceType(str, Enum):
    """Supported content source types across the platform."""
    PDF = "pdf"
    PPT = "ppt"
    WEB = "web"
    YOUTUBE = "youtube"


class SourceMetadata(BaseModel):
    """
    Metadata describing an uploaded knowledge source.
    Fully reusable by both Learning Assistant and Course Planner modules.
    """
    source_id: str = Field(..., description="Unique identifier for the source")
    session_id: Optional[str] = Field(None, description="Session ID that owns this source")
    source_name: str = Field(..., description="Original filename, URL, or video title")
    source_type: SourceType = Field(..., description="Type of source (pdf, ppt, web, youtube)")
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO timestamp of when source was processed"
    )
    additional_info: Dict[str, Any] = Field(
        default_factory=dict,
        description="Extensible metadata (e.g. video_id, author, slide_count, total_pages)"
    )

    model_config = ConfigDict(extra="allow")


class DocumentChunk(BaseModel):
    """
    Represents a single text chunk extracted from a source, enriched with vector indexing metadata.
    Designed for Qdrant payload embedding.
    """
    chunk_id: str = Field(..., description="Unique identifier for this specific chunk")
    session_id: Optional[str] = Field(None, description="Associated session ID")
    source_id: str = Field(..., description="ID of the source document this chunk belongs to")
    source_name: str = Field(..., description="Name of the source document")
    source_type: SourceType = Field(..., description="Type of source document")
    page_number: Optional[int] = Field(None, description="Page number if from PDF")
    slide_number: Optional[int] = Field(None, description="Slide number if from PPT")
    timestamp: Optional[str] = Field(None, description="Video timestamp or section marker if applicable")
    chunk_number: int = Field(..., description="Sequential index of this chunk within the document")
    chunk_text: str = Field(..., description="Actual text content of the chunk")
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Creation timestamp"
    )

    model_config = ConfigDict(from_attributes=True)


class ParserResult(BaseModel):
    """
    Standardized return object from any BaseParser subclass.
    """
    source_name: str
    source_type: SourceType
    text_content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    structured_items: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Page-level or slide-level structural data (e.g. [{'page': 1, 'text': '...'}]"
    )
    summary_placeholder: Optional[str] = None


class ChunkResult(BaseModel):
    """
    Standardized return object from ChunkService.
    """
    source_id: str
    chunks: List[DocumentChunk]
    total_chunks: int
    processing_time_ms: float


class ParsedDocument(BaseModel):
    """
    Represents a full document after extraction and metadata enrichment before vector storage.
    """
    metadata: SourceMetadata
    content: str
    structured_items: List[Dict[str, Any]] = Field(default_factory=list)
    summary: Optional[str] = None


class Document(BaseModel):
    """
    Complete aggregate model representing a fully ingested and indexed document.
    """
    document_id: str
    metadata: SourceMetadata
    chunks: List[DocumentChunk]
    summary: Optional[str] = None
    indexed_in_vectordb: bool = True
    processing_duration_ms: float


class UploadResult(BaseModel):
    """
    Standardized result returned by the DocumentPipeline after processing and indexing.
    """
    success: bool
    document_id: str
    source_name: str
    source_type: SourceType
    chunks_count: int
    vectors_stored: int
    summary: Optional[str] = None
    message: str = "Document processed and indexed successfully."

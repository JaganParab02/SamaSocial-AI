"""
Chat-specific API request/response models for the conversational AI engine.
Covers chat requests, streaming chunks, citations, retrieved context, and conversation history.
Shared by Module 1 (Learning Assistant) and reusable by Module 2 (Course Planner).
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.document import SourceType


class SourceFilter(str, Enum):
    """Filtering options for retrieval source type scoping."""
    ALL = "all"
    PDF = "pdf"
    PPT = "ppt"
    WEB = "web"
    YOUTUBE = "youtube"


class ChatRequest(BaseModel):
    """Incoming user chat message payload."""
    session_id: Optional[str] = Field(None, description="Session ID; auto-created if omitted")
    question: str = Field(..., min_length=1, description="User's question text")
    source_filter: SourceFilter = Field(SourceFilter.ALL, description="Filter retrieval to specific source type")
    top_k: Optional[int] = Field(None, ge=1, le=20, description="Override default number of retrieved chunks")


class Citation(BaseModel):
    """A single source citation extracted from retrieval metadata."""
    source_name: str = Field(..., description="Original filename, URL, or video title")
    source_type: SourceType = Field(..., description="Type of source")
    source_id: str = Field("", description="Source document UUID")
    page_number: Optional[int] = Field(None, description="PDF page number")
    slide_number: Optional[int] = Field(None, description="PPT slide number")
    timestamp: Optional[str] = Field(None, description="YouTube video timestamp (MM:SS or HH:MM:SS)")
    url: Optional[str] = Field(None, description="Web page URL")
    chunk_text_preview: str = Field("", description="Short preview of the cited chunk text")

    @property
    def formatted(self) -> str:
        """Human-readable citation string for inline references."""
        if self.source_type == SourceType.PDF and self.page_number is not None:
            return f"[Source: {self.source_name}, Page {self.page_number}]"
        elif self.source_type == SourceType.PPT and self.slide_number is not None:
            return f"[Source: {self.source_name}, Slide {self.slide_number}]"
        elif self.source_type == SourceType.YOUTUBE and self.timestamp:
            return f"[Source: {self.source_name}, Timestamp {self.timestamp}]"
        elif self.source_type == SourceType.WEB:
            url_display = self.url or self.source_name
            return f"[Source: {self.source_name}, URL: {url_display}]"
        return f"[Source: {self.source_name}]"


class RetrievedChunk(BaseModel):
    """A single retrieved vector search result with similarity score."""
    chunk_id: str
    chunk_text: str
    source_id: str
    source_name: str
    source_type: SourceType
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    page_number: Optional[int] = None
    slide_number: Optional[int] = None
    timestamp: Optional[str] = None
    chunk_number: Optional[int] = None


class ChatResponse(BaseModel):
    """Complete chat response with answer, citations, and metadata."""
    session_id: str
    answer: str = Field(..., description="LLM-generated answer grounded in retrieved context")
    citations: List[Citation] = Field(default_factory=list, description="Source citations for the answer")
    retrieved_chunks: List[RetrievedChunk] = Field(default_factory=list, description="Raw retrieved chunks for transparency")
    is_out_of_scope: bool = Field(False, description="True if context was insufficient to answer")
    follow_up_possible: bool = Field(True, description="Whether follow-up questions are supported")
    model: str = Field("", description="LLM model used for generation")
    tokens_used: Optional[int] = Field(None, description="Estimated tokens consumed")


class StreamingChunk(BaseModel):
    """Individual SSE streaming token event."""
    event: str = Field("token", description="Event type: 'token', 'citation', 'done', 'error'")
    data: str = Field("", description="Token text or JSON payload")
    session_id: str = Field("")
    chunk_index: int = Field(0, description="Sequential index of this streaming chunk")


class ChatResetRequest(BaseModel):
    """Request to reset a chat session."""
    session_id: str = Field(..., description="Session ID to reset")


class ConversationHistory(BaseModel):
    """Full conversation history for a session."""
    session_id: str
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    message_count: int = 0
    sources: List[str] = Field(default_factory=list, description="Source IDs attached to this session")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

"""
Session model for conversational state, course planner tracking, and memory management.
Extensible without modifying core schemas to support future Module 1 and Module 2 additions.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class SessionMessage(BaseModel):
    """
    Represents a conversational message or interaction in the session memory.
    """
    role: str = Field(..., description="Role of speaker: 'user', 'assistant', 'system'")
    content: str = Field(..., description="Text content of the message")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Optional citations, token estimates, or prompt identifiers"
    )


class Session(BaseModel):
    """
    Reusable session object supporting both Multi-Source Learning Assistant and Course Planner.
    Future modules can attach custom metadata, state, or course plans cleanly.
    """
    session_id: str = Field(..., description="Unique UUID identifying the session")
    messages: List[SessionMessage] = Field(default_factory=list, description="Conversation history")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Extensible metadata storage for arbitrary module preferences or tags"
    )
    uploaded_sources: List[str] = Field(
        default_factory=list,
        description="List of document/source IDs attached to this session"
    )
    planner_state: Dict[str, Any] = Field(
        default_factory=dict,
        description="State machine tracking for Module 2 course planning workflows"
    )
    course_plan: Optional[Dict[str, Any]] = Field(
        None,
        description="Generated course plan structure (reserved for Module 2)"
    )
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    model_config = ConfigDict(extra="allow")

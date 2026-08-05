from typing import Optional
from pydantic import BaseModel, Field
from app.planner.models import CoursePlan

class PlannerRequest(BaseModel):
    session_id: str = Field(..., description="The chat session ID")
    question: str = Field(..., description="The mentor's input or refinement request")
    source_filter: str = Field("all", description="Source filter for Qdrant context retrieval")

class PlannerSyncResponse(BaseModel):
    """Used for the synchronous JSON generation step."""
    course_plan: CoursePlan

class PlannerChatResponse(BaseModel):
    """
    Since we are using SSE streaming for chat, this model represents the final return value 
    of the chat generation pipeline if run synchronously.
    """
    session_id: str
    message: str
    course_plan: Optional[CoursePlan] = None

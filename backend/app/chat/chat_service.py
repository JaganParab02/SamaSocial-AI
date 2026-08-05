"""
ChatService: Business-layer service delegating to ChatPipeline.
Handles session creation, message persistence, error mapping.
Does NOT contain retrieval or prompt logic — delegates everything to ChatPipeline.
"""

import uuid
from typing import Any, Dict, Generator, Optional
from fastapi import HTTPException
from app.chat.chat_pipeline import ChatPipeline
from app.chat.session_manager import SessionManager
from app.chat.memory_service import MemoryService
from app.models.chat import ChatRequest, ChatResponse, ConversationHistory, SourceFilter
from app.core.logger import get_logger

logger = get_logger(__name__)


class ChatService:
    """
    Thin business service for chat operations.
    Validates requests and delegates to ChatPipeline.
    Reusable by Module 2 (Course Planner) by passing different template names.
    """

    def __init__(
        self,
        chat_pipeline: ChatPipeline,
        session_manager: SessionManager,
        memory_service: MemoryService,
    ):
        self.pipeline = chat_pipeline
        self.session_manager = session_manager
        self.memory = memory_service

    def handle_message(
        self,
        request: ChatRequest,
        system_template: str = "system",
        user_template: str = "learning_assistant",
    ) -> ChatResponse:
        """
        Process a non-streaming chat message.

        Args:
            request: Validated ChatRequest from the API layer.
            system_template: Override system prompt template.
            user_template: Override user prompt template.

        Returns:
            ChatResponse with answer, citations, and metadata.
        """
        session_id = request.session_id or str(uuid.uuid4())

        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty.")

        try:
            return self.pipeline.run(
                session_id=session_id,
                question=request.question,
                source_filter=request.source_filter,
                top_k=request.top_k,
                system_template=system_template,
                user_template=user_template,
            )
        except RuntimeError as e:
            logger.error("Chat pipeline error: %s", str(e))
            raise HTTPException(status_code=503, detail=f"AI service temporarily unavailable: {str(e)}")
        except Exception as e:
            logger.error("Unexpected chat error: %s", str(e))
            raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")

    def handle_stream(
        self,
        request: ChatRequest,
        system_template: str = "system",
        user_template: str = "learning_assistant",
    ) -> Generator[str, None, None]:
        """
        Process a streaming chat message. Returns SSE event generator.

        Args:
            request: Validated ChatRequest from the API layer.

        Yields:
            SSE-formatted event strings.
        """
        session_id = request.session_id or str(uuid.uuid4())

        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty.")

        try:
            yield from self.pipeline.run_stream(
                session_id=session_id,
                question=request.question,
                source_filter=request.source_filter,
                top_k=request.top_k,
                system_template=system_template,
                user_template=user_template,
            )
        except RuntimeError as e:
            logger.error("Stream pipeline error: %s", str(e))
            import json
            yield f'data: {json.dumps({"event": "error", "data": str(e)})}\n\n'
        except Exception as e:
            logger.error("Unexpected stream error: %s", str(e))
            import json
            yield f'data: {json.dumps({"event": "error", "data": str(e)})}\n\n'

    def get_history(self, session_id: str) -> ConversationHistory:
        """Retrieve conversation history for a session."""
        session = self.session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

        messages = [
            {"role": m.role, "content": m.content, "timestamp": m.timestamp, "metadata": m.metadata}
            for m in session.messages
        ]

        return ConversationHistory(
            session_id=session_id,
            messages=messages,
            message_count=len(messages),
            sources=session.uploaded_sources,
            created_at=session.created_at,
            updated_at=session.updated_at,
        )

    def clear_history(self, session_id: str) -> Dict[str, Any]:
        """Clear conversation history for a session."""
        session = self.session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

        self.memory.clear(session)
        return {
            "session_id": session_id,
            "status": "cleared",
            "message": "Conversation history has been cleared.",
        }

    def reset_session(self, session_id: str) -> Dict[str, Any]:
        """
        Reset a session: clear messages but preserve uploaded sources.
        """
        session = self.session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

        self.memory.clear(session)
        session.planner_state = {}
        session.course_plan = None

        return {
            "session_id": session_id,
            "status": "reset",
            "message": "Session has been reset. Uploaded sources are preserved.",
            "preserved_sources": session.uploaded_sources,
        }

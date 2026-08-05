"""
Chat API Router for Milestone 3 Conversational AI Engine.
Handles synchronous chat, streaming chat, and conversation history management.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.models.chat import (
    ChatRequest,
    ChatResponse,
    ChatResetRequest,
    ConversationHistory,
)
from app.chat.chat_service import ChatService
from app.core.dependencies import get_chat_service
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["Conversational AI"])


@router.post("", response_model=ChatResponse)
async def chat_sync(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatResponse:
    """
    Submit a synchronous chat query and receive the full response with citations.
    Useful for clients that do not support SSE streaming.
    """
    logger.info("Sync chat request received for session: %s", request.session_id)
    return chat_service.handle_message(request)


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service),
) -> Any:
    """
    Submit a chat query and receive an SSE (Server-Sent Events) stream of token deltas.
    Ends with citation arrays and usage metrics.
    """
    logger.info("Stream chat request received for session: %s", request.session_id)
    event_generator = chat_service.handle_stream(request)
    return StreamingResponse(event_generator, media_type="text/event-stream")


@router.get("/history/{session_id}", response_model=ConversationHistory)
async def get_conversation_history(
    session_id: str,
    chat_service: ChatService = Depends(get_chat_service),
) -> ConversationHistory:
    """
    Retrieve the full conversation history for a given session ID.
    """
    logger.info("Fetching history for session: %s", session_id)
    return chat_service.get_history(session_id)


@router.delete("/history/{session_id}")
async def clear_conversation_history(
    session_id: str,
    chat_service: ChatService = Depends(get_chat_service),
) -> Dict[str, Any]:
    """
    Clear all messages from a specific conversation session.
    """
    logger.info("Clearing history for session: %s", session_id)
    return chat_service.clear_history(session_id)


@router.post("/reset")
async def reset_session(
    request: ChatResetRequest,
    chat_service: ChatService = Depends(get_chat_service),
) -> Dict[str, Any]:
    """
    Reset a session state and memory completely, but maintain uploaded source associations.
    """
    logger.info("Resetting session: %s", request.session_id)
    return chat_service.reset_session(request.session_id)


class NewSessionRequest(BaseModel):
    """Request to start a new session by cleaning up an old one."""
    old_session_id: str = Field(..., description="The previous session ID to clean up")


@router.post("/new-session")
async def new_session(
    request: NewSessionRequest,
    chat_service: ChatService = Depends(get_chat_service),
) -> Dict[str, Any]:
    """
    Clean up an old session completely (vectors, sources, history)
    before the frontend switches to a new session ID.
    """
    logger.info("New session requested, cleaning up old session: %s", request.old_session_id)
    return chat_service.cleanup_old_session(request.old_session_id)

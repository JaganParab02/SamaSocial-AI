"""
ConversationManager: Higher-level conversation lifecycle management.
Provides create, load, continue, delete, and summary placeholder operations.
"""

from typing import Any, Dict, List, Optional
from app.chat.session_manager import SessionManager
from app.chat.memory_service import MemoryService
from app.models.session import Session
from app.core.logger import get_logger

logger = get_logger(__name__)


class ConversationManager:
    """
    Manages conversation lifecycle above the session level.
    Provides clean API for creating, loading, continuing, and deleting conversations.
    """

    def __init__(self, session_manager: SessionManager, memory_service: MemoryService):
        self.session_manager = session_manager
        self.memory = memory_service

    def create_conversation(
        self,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a new conversation session.

        Returns:
            Dict with session_id and creation metadata.
        """
        session = self.session_manager.create_session(
            session_id=session_id,
            initial_metadata=metadata,
        )
        logger.info("Created new conversation: %s", session.session_id)
        return {
            "session_id": session.session_id,
            "status": "created",
            "created_at": session.created_at,
        }

    def load_conversation(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Load an existing conversation with full history.

        Returns:
            Dict with session data or None if not found.
        """
        session = self.session_manager.get_session(session_id)
        if not session:
            return None

        messages = [
            {"role": m.role, "content": m.content, "timestamp": m.timestamp}
            for m in session.messages
        ]

        return {
            "session_id": session.session_id,
            "messages": messages,
            "message_count": len(messages),
            "sources": session.uploaded_sources,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "metadata": session.metadata,
        }

    def continue_conversation(self, session_id: str, message: str) -> Optional[Session]:
        """
        Ensure a conversation exists and prepare it for a new message.
        Returns the session for pipeline processing.
        """
        session = self.session_manager.get_or_create(session_id)
        return session

    def delete_conversation(self, session_id: str) -> bool:
        """Delete a conversation and all its history."""
        result = self.session_manager.delete_session(session_id)
        if result:
            logger.info("Deleted conversation: %s", session_id)
        return result

    def list_conversations(self) -> List[Dict[str, Any]]:
        """List all active conversations with summary metadata."""
        sessions = self.session_manager.list_sessions()
        return [
            {
                "session_id": s.session_id,
                "message_count": len(s.messages),
                "sources_count": len(s.uploaded_sources),
                "created_at": s.created_at,
                "updated_at": s.updated_at,
            }
            for s in sessions
        ]

    def get_summary_placeholder(self, session_id: str) -> Optional[str]:
        """
        Placeholder for future conversation summarization.
        Reserved for Module 2 and advanced memory management.
        """
        session = self.session_manager.get_session(session_id)
        if not session:
            return None

        msg_count = len(session.messages)
        if msg_count == 0:
            return "Empty conversation."

        # Simple placeholder summary from first and last messages
        first_msg = session.messages[0].content[:100]
        return f"Conversation with {msg_count} messages. Started with: \"{first_msg}...\""

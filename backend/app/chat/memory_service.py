"""
MemoryService providing general conversational buffer storage and token estimation.
Strictly decoupled from vector DB retrieval or prompt engineering executions.
"""

from typing import Any, Dict, List, Optional
from app.models.session import Session, SessionMessage
from app.core.logger import get_logger

logger = get_logger(__name__)


class MemoryService:
    """
    Generic short-term conversation memory manager.
    Enforces message truncation bounds and token estimation without executing retrieval queries.
    """

    def __init__(self, max_history: int = 20):
        """
        Initialize memory buffer parameters from centralized configuration.
        
        Args:
            max_history: Maximum message count retained before sliding window truncation.
        """
        self.max_history = max_history

    def append(
        self,
        session: Session,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SessionMessage:
        """
        Append a conversation interaction to the session memory buffer.
        
        Args:
            session: Target Session model instance.
            role: Speaker designation ('user', 'assistant', 'system').
            content: Raw utterance text string.
            metadata: Optional attachment data (such as source citation links).
            
        Returns:
            The created SessionMessage object.
        """
        msg = SessionMessage(
            role=role,
            content=content,
            metadata=metadata or {}
        )
        session.messages.append(msg)
        self.truncate(session)
        logger.debug("Appended '%s' message to session '%s'", role, session.session_id)
        return msg

    def history(self, session: Session, include_system: bool = True) -> List[SessionMessage]:
        """
        Retrieve historical messages from session memory.
        
        Args:
            session: Target Session model instance.
            include_system: Whether to return initial 'system' context prompt messages.
            
        Returns:
            Chronological array of conversation messages.
        """
        if not include_system:
            return [m for m in session.messages if m.role != "system"]
        return list(session.messages)

    def clear(self, session: Session) -> None:
        """Wipes active conversational dialogue history from the session."""
        session.messages.clear()
        logger.info("Cleared memory history for session ID: %s", session.session_id)

    def truncate(self, session: Session, limit: Optional[int] = None) -> None:
        """
        Enforce maximum conversation history size using sliding window.
        Preserves leading system message if present while discarding oldest dialogue turns.
        """
        threshold = limit if limit is not None else self.max_history
        if len(session.messages) <= threshold:
            return

        # Keep system messages if at index 0
        if session.messages and session.messages[0].role == "system":
            system_msg = session.messages[0]
            retained = session.messages[-(threshold - 1):]
            session.messages = [system_msg] + retained
        else:
            session.messages = session.messages[-threshold:]
            
        logger.debug("Truncated session '%s' memory to %d items.", session.session_id, threshold)

    def estimate_tokens(self, text: str) -> int:
        """
        Estimate LLM token quantity for text strings using robust character heuristics (~4 chars/token).
        
        Args:
            text: Input text string.
            
        Returns:
            Estimated integer token count.
        """
        if not text:
            return 0
        # Standard heuristic across Llama/OpenAI type tokenizers: 4 chars approx equals 1 token
        return max(1, len(text) // 4)

    def serialize_for_prompt(
        self, session: Session, max_turns: int = 10, include_system: bool = False
    ) -> str:
        """
        Serialize conversation history into a formatted string for prompt injection.

        Args:
            session: Target Session model instance.
            max_turns: Maximum number of recent turns to include.
            include_system: Whether to include system messages.

        Returns:
            Formatted string like "User: ...\nAssistant: ...\n..."
        """
        messages = self.history(session, include_system=include_system)
        # Take only the most recent turns
        recent = messages[-max_turns:] if len(messages) > max_turns else messages

        lines = []
        for msg in recent:
            role_label = msg.role.capitalize()
            lines.append(f"{role_label}: {msg.content}")

        serialized = "\n".join(lines)
        logger.debug(
            "Serialized %d messages (%d chars) for session '%s'.",
            len(recent), len(serialized), session.session_id,
        )
        return serialized

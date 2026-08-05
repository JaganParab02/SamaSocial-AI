"""
Reusable SessionManager for stateful user interaction lifecycle.
Supports session persistence and metadata attachment across Learning Assistant and Course Planner modules.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.models.session import Session, SessionMessage
from app.core.logger import get_logger

logger = get_logger(__name__)


class SessionManager:
    """
    Manages interactive user sessions, state tracking, and source associations.
    Designed explicitly with extensible metadata structures so future milestones can add fields cleanly.
    """

    def __init__(self):
        """Initialize in-memory session repository store."""
        self._sessions: Dict[str, Session] = {}
        logger.info("SessionManager store initialized.")

    def create_session(self, session_id: Optional[str] = None, initial_metadata: Optional[Dict[str, Any]] = None) -> Session:
        """
        Create and register a new conversational session.
        
        Args:
            session_id: Optional UUID; automatically generated if unsupplied.
            initial_metadata: Optional initial configuration dictionary.
            
        Returns:
            New Session object instance.
        """
        sid = session_id or str(uuid.uuid4())
        new_session = Session(
            session_id=sid,
            messages=[],
            metadata=initial_metadata or {},
            uploaded_sources=[],
            planner_state={},
            course_plan=None,
        )
        self._sessions[sid] = new_session
        logger.info("Created session ID: %s", sid)
        return new_session

    def get_session(self, session_id: str) -> Optional[Session]:
        """Retrieve active session by ID or None if nonexistent."""
        return self._sessions.get(session_id)

    def get_or_create(self, session_id: str) -> Session:
        """Fetch existing session or generate new one cleanly if missing."""
        sess = self.get_session(session_id)
        if not sess:
            sess = self.create_session(session_id=session_id)
        return sess

    def list_sessions(self) -> List[Session]:
        """Return all tracked user sessions."""
        return list(self._sessions.values())

    def delete_session(self, session_id: str) -> bool:
        """Remove session record from system storage."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            logger.info("Deleted session ID: %s", session_id)
            return True
        return False

    def attach_source(self, session_id: str, source_id: str) -> Optional[Session]:
        """
        Link an ingested document source ID to a user session.
        """
        sess = self.get_session(session_id)
        if sess and source_id not in sess.uploaded_sources:
            sess.uploaded_sources.append(source_id)
            sess.updated_at = datetime.now(timezone.utc).isoformat()
            logger.debug("Attached source '%s' to session '%s'", source_id, session_id)
        return sess

    def update_metadata(self, session_id: str, metadata_updates: Dict[str, Any]) -> Optional[Session]:
        """
        Extensible mechanism allowing future modules to merge arbitrary workflow properties into session metadata.
        """
        sess = self.get_session(session_id)
        if sess:
            sess.metadata.update(metadata_updates)
            sess.updated_at = datetime.now(timezone.utc).isoformat()
        return sess

    def update_planner_state(self, session_id: str, new_state: Dict[str, Any], course_plan: Optional[Dict[str, Any]] = None) -> Optional[Session]:
        """
        Reserved state updater specifically structured for Module 2 (AI Course Planning Assistant).
        """
        sess = self.get_session(session_id)
        if sess:
            sess.planner_state.update(new_state)
            if course_plan is not None:
                sess.course_plan = course_plan
            sess.updated_at = datetime.now(timezone.utc).isoformat()
        return sess

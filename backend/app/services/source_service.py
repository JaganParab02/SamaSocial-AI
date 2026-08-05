"""
SourceService registry tracking uploaded knowledge sources across the platform.
Maintains session scoping, operational statuses, processing durations, and document metadata.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.models.document import SourceType
from app.core.logger import get_logger

logger = get_logger(__name__)


class SourceService:
    """
    In-memory registry managing metadata lifecycle for all uploaded knowledge sources.
    Shared across Learning Assistant and Course Planner to prevent redundant file indexing.
    """

    def __init__(self):
        """Initialize registry dictionary."""
        # Map source_id -> Dict of source properties
        self._sources: Dict[str, Dict[str, Any]] = {}
        logger.info("SourceService registry initialized.")

    def register_source(
        self,
        source_id: str,
        name: str,
        source_type: SourceType,
        session_id: Optional[str] = None,
        status: str = "processing",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Record a newly initiated source document in the registry.
        """
        record = {
            "source_id": source_id,
            "session_id": session_id,
            "name": name,
            "type": source_type,
            "status": status,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "processing_time_ms": 0.0,
            "metadata": metadata or {},
        }
        self._sources[source_id] = record
        logger.debug("Registered source '%s' (ID: %s, Status: %s)", name, source_id, status)
        return record

    def update_status(
        self,
        source_id: str,
        status: str,
        processing_time_ms: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Update completion or failure status and attach processing metrics.
        """
        record = self._sources.get(source_id)
        if record:
            record["status"] = status
            if processing_time_ms > 0:
                record["processing_time_ms"] = processing_time_ms
            if metadata:
                record["metadata"].update(metadata)
            logger.debug("Updated source '%s' status to '%s' (duration: %.2f ms)", source_id, status, processing_time_ms)
        return record

    def get_source(self, source_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve registry record by unique source ID."""
        return self._sources.get(source_id)

    def list_sources(self, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List indexed sources, optionally filtering by specific user session ID.
        """
        if session_id:
            return [s for s in self._sources.values() if s.get("session_id") == session_id]
        return list(self._sources.values())

    def delete_source(self, source_id: str) -> bool:
        """Remove a source document record from the active registry."""
        if source_id in self._sources:
            name = self._sources[source_id].get("name", source_id)
            del self._sources[source_id]
            logger.info("Removed source '%s' (ID: %s) from source registry.", name, source_id)
            return True
        return False

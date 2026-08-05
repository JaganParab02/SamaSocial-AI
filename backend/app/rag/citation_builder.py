"""
CitationBuilder automatically generating structured citations from retrieval metadata.
Maps PDF pages, PPT slides, web URLs, and YouTube timestamps into Citation objects.
"""

from typing import Dict, List, Set, Tuple
from app.models.chat import Citation, RetrievedChunk
from app.models.document import SourceType
from app.core.logger import get_logger

logger = get_logger(__name__)


class CitationBuilder:
    """
    Transforms raw retrieval chunk metadata into structured Citation objects
    for attaching to chat responses. Works automatically without LLM involvement.
    """

    def build_citations(self, chunks: List[RetrievedChunk]) -> List[Citation]:
        """
        Generate deduplicated Citation objects from retrieved chunks.
        Groups by (source_id, page/slide/timestamp) to avoid redundant citations.

        Args:
            chunks: List of RetrievedChunk objects from retrieval pipeline.

        Returns:
            Deduplicated list of Citation objects.
        """
        if not chunks:
            return []

        seen: Set[Tuple] = set()
        citations: List[Citation] = []

        for chunk in chunks:
            # Build dedup key based on source + location specifics
            key = (
                chunk.source_id,
                chunk.source_type.value,
                chunk.page_number,
                chunk.slide_number,
                chunk.timestamp,
            )
            if key in seen:
                continue
            seen.add(key)

            citation = self._chunk_to_citation(chunk)
            citations.append(citation)

        logger.debug("Built %d unique citations from %d retrieved chunks.", len(citations), len(chunks))
        return citations

    def _chunk_to_citation(self, chunk: RetrievedChunk) -> Citation:
        """Map a single RetrievedChunk to a Citation based on source type."""
        preview = chunk.chunk_text[:120].strip() + "..." if len(chunk.chunk_text) > 120 else chunk.chunk_text.strip()

        url = None
        if chunk.source_type == SourceType.WEB:
            url = chunk.source_name  # source_name is the URL for web sources

        if chunk.source_type == SourceType.YOUTUBE:
            video_id = self._extract_video_id(chunk.source_name)
            if video_id and chunk.timestamp:
                url = f"https://www.youtube.com/watch?v={video_id}&t={self._timestamp_to_seconds(chunk.timestamp)}s"
            elif video_id:
                url = f"https://www.youtube.com/watch?v={video_id}"

        return Citation(
            source_name=chunk.source_name,
            source_type=chunk.source_type,
            source_id=chunk.source_id,
            page_number=chunk.page_number if chunk.source_type == SourceType.PDF else None,
            slide_number=chunk.slide_number if chunk.source_type == SourceType.PPT else None,
            timestamp=chunk.timestamp if chunk.source_type == SourceType.YOUTUBE else None,
            url=url,
            chunk_text_preview=preview,
        )

    def format_citations_block(self, citations: List[Citation]) -> str:
        """Generate a markdown-formatted citations block for appending to responses."""
        if not citations:
            return ""
        lines = ["\n\n---\n**Sources:**"]
        for i, c in enumerate(citations, 1):
            lines.append(f"{i}. {c.formatted}")
        return "\n".join(lines)

    @staticmethod
    def _extract_video_id(source_name: str) -> str:
        """Extract YouTube video ID from source name if present."""
        import re
        match = re.search(r"\(([a-zA-Z0-9_-]{11})\)", source_name)
        if match:
            return match.group(1)
        if len(source_name) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", source_name):
            return source_name
        return ""

    @staticmethod
    def _timestamp_to_seconds(timestamp: str) -> int:
        """Convert MM:SS or HH:MM:SS to total seconds."""
        parts = timestamp.split(":")
        try:
            if len(parts) == 3:
                return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            elif len(parts) == 2:
                return int(parts[0]) * 60 + int(parts[1])
        except (ValueError, IndexError):
            pass
        return 0

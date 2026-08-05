"""
ContextBuilder merging retrieved chunks into optimized LLM context.
Handles deduplication, source ordering, token budgeting, and metadata preservation.
Reusable by both Module 1 and Module 2.
"""

from typing import List, Optional, Set
from app.models.chat import RetrievedChunk
from app.core.logger import get_logger

logger = get_logger(__name__)


class ContextBuilder:
    """
    Transforms ranked RetrievedChunk arrays into a single optimized context string
    suitable for LLM prompt injection while preserving source attribution metadata.
    """

    def __init__(self, max_context_tokens: int = 3000):
        """
        Args:
            max_context_tokens: Approximate token budget for context window.
                                Uses ~4 chars/token heuristic.
        """
        self.max_context_tokens = max_context_tokens
        self.max_context_chars = max_context_tokens * 4  # heuristic

    def build_context(self, chunks: List[RetrievedChunk]) -> str:
        """
        Merge retrieved chunks into a unified context string.

        Steps:
            1. Deduplicate by chunk_id
            2. Order by source_name then chunk_number for coherent reading
            3. Truncate to token budget
            4. Format with source attribution markers

        Args:
            chunks: Ranked list of RetrievedChunk objects from Retriever.

        Returns:
            Formatted context string ready for prompt injection.
        """
        if not chunks:
            return ""

        # 1. Deduplicate
        seen_ids: Set[str] = set()
        unique_chunks: List[RetrievedChunk] = []
        for chunk in chunks:
            if chunk.chunk_id not in seen_ids:
                seen_ids.add(chunk.chunk_id)
                unique_chunks.append(chunk)

        # 2. Sort by source then chunk_number for readability
        unique_chunks.sort(key=lambda c: (c.source_name, c.chunk_number or 0))

        # 3. Build formatted blocks with source markers
        context_blocks: List[str] = []
        total_chars = 0

        for chunk in unique_chunks:
            # Build source marker
            marker = self._source_marker(chunk)
            block = f"{marker}\n{chunk.chunk_text.strip()}"

            block_chars = len(block)
            if total_chars + block_chars > self.max_context_chars:
                # Truncate last block to fit budget
                remaining = self.max_context_chars - total_chars
                if remaining > 100:  # only include if meaningful
                    context_blocks.append(block[:remaining] + "...")
                break

            context_blocks.append(block)
            total_chars += block_chars

        result = "\n\n".join(context_blocks)
        logger.info(
            "Built context from %d chunks (%d unique, ~%d tokens).",
            len(chunks), len(unique_chunks), len(result) // 4,
        )
        return result

    def _source_marker(self, chunk: RetrievedChunk) -> str:
        """Generate a human-readable source attribution marker for a chunk."""
        parts = [f"[{chunk.source_type.value.upper()}: {chunk.source_name}"]

        if chunk.page_number is not None:
            parts.append(f"Page {chunk.page_number}")
        if chunk.slide_number is not None:
            parts.append(f"Slide {chunk.slide_number}")
        if chunk.timestamp:
            parts.append(f"Timestamp {chunk.timestamp}")
        if chunk.chunk_number is not None:
            parts.append(f"Chunk {chunk.chunk_number}")

        return ", ".join(parts) + "]"

    def get_unique_chunks(self, chunks: List[RetrievedChunk]) -> List[RetrievedChunk]:
        """Return deduplicated chunks preserving order."""
        seen: Set[str] = set()
        result: List[RetrievedChunk] = []
        for c in chunks:
            if c.chunk_id not in seen:
                seen.add(c.chunk_id)
                result.append(c)
        return result

"""
ChunkService using Langchain RecursiveCharacterTextSplitter.
Divides extracted text into overlapping semantic segments enriched with granular source metadata.
"""

import time
import uuid
from typing import List, Optional
from app.models.document import DocumentChunk, ParsedDocument, ChunkResult, SourceType
from app.core.logger import get_logger

logger = get_logger(__name__)

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    HAS_SPLITTER = True
except ImportError:
    HAS_SPLITTER = False
    logger.error("langchain-text-splitters is not installed.")


class ChunkService:
    """
    Reusable text chunker applying configurable sizes and overlaps.
    Ensures every resulting DocumentChunk contains full schema metadata required for vector indexing.
    """

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize chunker with size constraints from centralized configuration.
        
        Args:
            chunk_size: Maximum character count per segment.
            chunk_overlap: Overlap characters between successive chunks to maintain semantic continuity.
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self._splitter = None
        self._setup_splitter()

    def _setup_splitter(self) -> None:
        if HAS_SPLITTER:
            self._splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
        else:
            logger.warning("RecursiveCharacterTextSplitter unavailable; fallback whitespace splitter will be used.")

    def chunk_document(self, parsed_doc: ParsedDocument) -> ChunkResult:
        """
        Split a parsed document into structured DocumentChunk objects with granular structural tagging.
        
        Args:
            parsed_doc: The ParsedDocument extracted by a content parser.
            
        Returns:
            ChunkResult containing enriched DocumentChunk array ready for embedding.
        """
        start_time = time.time()
        meta = parsed_doc.metadata
        source_id = meta.source_id
        session_id = meta.session_id
        source_name = meta.source_name
        source_type = meta.source_type
        structured_items = parsed_doc.structured_items or []

        chunks: List[DocumentChunk] = []
        chunk_number = 1

        # If document has structural page/slide/timestamp hierarchy, chunk by item to maintain precise citation markers
        if structured_items and source_type in [SourceType.PDF, SourceType.PPT, SourceType.YOUTUBE]:
            for item in structured_items:
                item_text = item.get("text", "").strip()
                if not item_text:
                    continue

                page_num = item.get("page_number")
                slide_num = item.get("slide_number")
                timestamp = item.get("timestamp")

                text_fragments = self._split_string(item_text)
                for frag in text_fragments:
                    chunks.append(
                        DocumentChunk(
                            chunk_id=str(uuid.uuid4()),
                            session_id=session_id,
                            source_id=source_id,
                            source_name=source_name,
                            source_type=source_type,
                            page_number=page_num,
                            slide_number=slide_num,
                            timestamp=timestamp,
                            chunk_number=chunk_number,
                            chunk_text=frag,
                        )
                    )
                    chunk_number += 1
        else:
            # General document chunking without individual sub-page boundaries (e.g., Web pages)
            raw_text = parsed_doc.content or ""
            text_fragments = self._split_string(raw_text)
            for frag in text_fragments:
                chunks.append(
                    DocumentChunk(
                        chunk_id=str(uuid.uuid4()),
                        session_id=session_id,
                        source_id=source_id,
                        source_name=source_name,
                        source_type=source_type,
                        page_number=None,
                        slide_number=None,
                        timestamp=None,
                        chunk_number=chunk_number,
                        chunk_text=frag,
                    )
                )
                chunk_number += 1

        duration_ms = round((time.time() - start_time) * 1000.0, 2)
        logger.info("Chunked document '%s' into %d chunks in %d ms.", source_id, len(chunks), duration_ms)

        return ChunkResult(
            source_id=source_id,
            chunks=chunks,
            total_chunks=len(chunks),
            processing_time_ms=duration_ms,
        )

    def _split_string(self, text: str) -> List[str]:
        """Internal helper dividing string into segments using LangChain or fallback."""
        if not text:
            return []
        if self._splitter:
            return self._splitter.split_text(text)
        
        # Fallback slicing if library is uninstalled
        step = max(1, self.chunk_size - self.chunk_overlap)
        return [text[i:i + self.chunk_size] for i in range(0, len(text), step)]

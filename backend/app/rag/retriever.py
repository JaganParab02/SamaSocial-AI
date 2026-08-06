"""
Reusable Retriever wrapping EmbeddingService and VectorStoreService.
Provides high-level query methods for RAG retrieval with session, source, and type filtering.
Shared across Module 1 (Learning Assistant) and Module 2 (Course Planner).
"""

from typing import Any, Dict, List, Optional
from app.embeddings.service import EmbeddingService
from app.vectordb.service import VectorStoreService
from app.models.chat import RetrievedChunk, SourceFilter
from app.models.document import SourceType
from app.core.logger import get_logger

logger = get_logger(__name__)


class Retriever:
    """
    High-level retrieval interface translating natural language queries into
    ranked vector search results with full metadata preservation.
    """

    def __init__(
        self,
        embedding_service: EmbeddingService,
        vectordb_service: VectorStoreService,
        default_top_k: int = 5,
        similarity_threshold: float = 0.3,
    ):
        self.embedding_service = embedding_service
        self.vectordb = vectordb_service
        self.default_top_k = default_top_k
        self.similarity_threshold = similarity_threshold

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        source_filter: SourceFilter = SourceFilter.ALL,
        session_id: Optional[str] = None,
        source_id: Optional[str] = None,
    ) -> List[RetrievedChunk]:
        """
        Core retrieval method: embed query → search Qdrant → return ranked chunks.

        Args:
            query: User's natural language question.
            top_k: Number of results (overrides default if provided).
            source_filter: Filter by source type (pdf, ppt, web, youtube, or all).
            session_id: Optional session scope filter.
            source_id: Optional single-source scope filter.

        Returns:
            Ranked list of RetrievedChunk objects with similarity scores.
        """
        k = top_k or self.default_top_k
        logger.info("Retrieving top-%d chunks for query (len=%d chars).", k, len(query))

        # 1. Generate query embedding
        query_vector = self.embedding_service.embed_text(query)

        # 2. Build filter conditions
        filters: Dict[str, Any] = {}
        if source_filter != SourceFilter.ALL and source_filter != "all":
            filters["source_type"] = source_filter.value if hasattr(source_filter, "value") else str(source_filter)
        if session_id:
            filters["session_id"] = session_id
        if source_id:
            filters["source_id"] = source_id

        # 3. Execute similarity search
        raw_results = self.vectordb.similarity_search(
            query_vector=query_vector,
            top_k=k,
            score_threshold=self.similarity_threshold,
            filter_conditions=filters if filters else None,
        )
        if not raw_results and self.similarity_threshold > 0.0:
            logger.info("No chunks matched threshold %.2f; falling back to score_threshold=0.0 to recover closest embeddings.", self.similarity_threshold)
            raw_results = self.vectordb.similarity_search(
                query_vector=query_vector,
                top_k=k,
                score_threshold=0.0,
                filter_conditions=filters if filters else None,
            )

        # 4. Map to RetrievedChunk models
        chunks = []
        for result in raw_results:
            payload = result.get("payload", {})
            source_type_str = payload.get("source_type", "pdf")
            try:
                st = SourceType(source_type_str)
            except ValueError:
                st = SourceType.PDF

            chunks.append(RetrievedChunk(
                chunk_id=result.get("chunk_id", ""),
                chunk_text=payload.get("chunk_text", ""),
                source_id=payload.get("source_id", ""),
                source_name=payload.get("source_name", ""),
                source_type=st,
                similarity_score=result.get("score", 0.0),
                page_number=payload.get("page_number"),
                slide_number=payload.get("slide_number"),
                timestamp=payload.get("timestamp"),
                chunk_number=payload.get("chunk_number"),
            ))

        logger.info("Retrieved %d chunks above threshold %.2f.", len(chunks), self.similarity_threshold)
        return chunks

    def retrieve_by_source(
        self, query: str, source_id: str, top_k: Optional[int] = None
    ) -> List[RetrievedChunk]:
        """Retrieve chunks filtered to a specific uploaded source document."""
        return self.retrieve(query=query, top_k=top_k, source_id=source_id)

    def retrieve_by_session(
        self, query: str, session_id: str, top_k: Optional[int] = None
    ) -> List[RetrievedChunk]:
        """Retrieve chunks scoped to a specific user session."""
        return self.retrieve(query=query, top_k=top_k, session_id=session_id)

    def retrieve_top_k(
        self, query: str, top_k: Optional[int] = None
    ) -> List[RetrievedChunk]:
        """Retrieve top-K chunks with no filtering."""
        return self.retrieve(query=query, top_k=top_k)

"""
VectorStoreService utilizing Qdrant vector database.
Responsible strictly for storage lifecycle, indexing, upserts, deletion, and health monitoring.
Vector retrieval for Q&A chatbot belongs to Milestone 3 and is represented as a placeholder.
"""

import time
from typing import Any, Dict, List, Optional
from app.core.logger import get_logger
from app.models.document import DocumentChunk

logger = get_logger(__name__)

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import (
        Distance,
        VectorParams,
        PointStruct,
        Filter,
        FieldCondition,
        MatchValue,
    )
    HAS_QDRANT = True
except ImportError:
    HAS_QDRANT = False
    logger.error("qdrant-client package is not installed.")


class VectorStoreService:
    """
    Generic Qdrant Vector Store Adapter shared by Learning Assistant (Module 1) and Course Planner (Module 2).
    Manages vector lifecycle, schema payload enrichment, and session/source cleanup.
    """

    def __init__(self, url: str, collection_name: str, embedding_dim: int = 384):
        """
        Initialize Qdrant Vector Store client connection and verify target collection.
        
        Args:
            url: HTTP address of Qdrant instance (e.g. http://localhost:6333)
            collection_name: Target collection identifier
            embedding_dim: Vector size dimensionality (384 for all-MiniLM-L6-v2)
        """
        self.url = url
        self.collection_name = collection_name
        self.embedding_dim = embedding_dim
        self.client: Optional[QdrantClient] = None
        self.connect()

    def connect(self) -> None:
        """Establishes connection to Qdrant server or memory-fallback in test environments."""
        if not HAS_QDRANT:
            logger.error("Cannot initialize QdrantClient without library installed.")
            return

        try:
            self.client = QdrantClient(url=self.url, timeout=15.0)
            self.ensure_collection()
            logger.info("Connected to Qdrant vector DB at %s", self.url)
        except Exception as e:
            logger.warning(
                "Could not connect to external Qdrant at '%s': %s. "
                "Falling back to in-memory Qdrant instance for development resiliency.",
                self.url, str(e)
            )
            self.client = QdrantClient(location=":memory:")
            try:
                self.ensure_collection()
            except Exception as inner_e:
                logger.error("Failed to initialize in-memory Qdrant collection: %s", str(inner_e))

    def ensure_collection(self) -> None:
        """Creates target vector collection if it does not already exist."""
        if not self.client or not HAS_QDRANT:
            return

        collections_res = self.client.get_collections()
        existing_names = [col.name for col in collections_res.collections]
        if self.collection_name not in existing_names:
            logger.info(
                "Creating Qdrant collection '%s' with dimension %d...",
                self.collection_name, self.embedding_dim
            )
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dim,
                    distance=Distance.COSINE
                )
            )
            logger.info("Collection '%s' created successfully.", self.collection_name)

    def delete_collection(self) -> bool:
        """Deletes the entire vector collection from Qdrant storage."""
        if not self.client:
            return False
        try:
            self.client.delete_collection(collection_name=self.collection_name)
            logger.warning("Deleted Qdrant collection '%s'", self.collection_name)
            return True
        except Exception as e:
            logger.error("Failed to delete collection '%s': %s", self.collection_name, str(e))
            return False

    def upsert_vectors(self, chunks: List[DocumentChunk], embeddings: List[List[float]]) -> int:
        """
        Stores chunk text, vector embeddings, and required metadata into Qdrant collection.
        
        Args:
            chunks: List of DocumentChunk domain models containing rich metadata.
            embeddings: Corresponding list of float vector arrays.
            
        Returns:
            Number of vector points successfully inserted.
        """
        if not self.client or not chunks or len(chunks) != len(embeddings):
            if len(chunks) != len(embeddings):
                logger.error("Mismatch between chunk count (%d) and embedding count (%d).", len(chunks), len(embeddings))
            return 0

        points = []
        for chunk, vector in zip(chunks, embeddings):
            # Enforce support for every metadata field required in Milestone 2 Prompt
            payload = {
                "session_id": chunk.session_id,
                "source_id": chunk.source_id,
                "source_name": chunk.source_name,
                "source_type": chunk.source_type.value if hasattr(chunk.source_type, "value") else str(chunk.source_type),
                "page_number": chunk.page_number,
                "slide_number": chunk.slide_number,
                "timestamp": chunk.timestamp,
                "chunk_number": chunk.chunk_number,
                "chunk_text": chunk.chunk_text,
                "created_at": chunk.created_at,
            }
            # Remove None values to keep Qdrant payload clean and searchable
            clean_payload = {k: v for k, v in payload.items() if v is not None}

            points.append(
                PointStruct(
                    id=chunk.chunk_id,
                    vector=vector,
                    payload=clean_payload
                )
            )

        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points,
                wait=True
            )
            logger.info("Upserted %d vector points into Qdrant collection '%s'.", len(points), self.collection_name)
            return len(points)
        except Exception as e:
            logger.error("Qdrant upsert operation failed: %s", str(e))
            raise RuntimeError(f"Vector storage upsert failure: {str(e)}")

    def delete_vectors(self, source_id: str) -> bool:
        """
        Delete all vectors associated with a specific knowledge source ID.
        
        Args:
            source_id: UUID or identifier of target source document.
            
        Returns:
            Boolean indicating successful deletion.
        """
        if not self.client:
            return False
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="source_id",
                            match=MatchValue(value=source_id)
                        )
                    ]
                ),
                wait=True
            )
            logger.info("Deleted vectors associated with source_id='%s' from Qdrant.", source_id)
            return True
        except Exception as e:
            logger.error("Failed deleting vectors for source_id='%s': %s", source_id, str(e))
            return False

    def delete_session_vectors(self, session_id: str) -> bool:
        """
        Delete all vectors associated with a user conversation session ID.
        
        Args:
            session_id: UUID representing user session.
            
        Returns:
            Boolean indicating successful removal.
        """
        if not self.client:
            return False
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="session_id",
                            match=MatchValue(value=session_id)
                        )
                    ]
                ),
                wait=True
            )
            logger.info("Deleted all vectors linked to session_id='%s'.", session_id)
            return True
        except Exception as e:
            logger.error("Failed deleting session vectors for session_id='%s': %s", session_id, str(e))
            return False

    def similarity_search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        score_threshold: float = 0.0,
        filter_conditions: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Perform cosine similarity search against Qdrant collection.

        Args:
            query_vector: Dense embedding vector for the user query.
            top_k: Maximum number of results to return.
            score_threshold: Minimum similarity score to include in results.
            filter_conditions: Optional Qdrant filter dict with keys like
                               'session_id', 'source_id', 'source_type'.

        Returns:
            List of dicts with keys: chunk_id, score, payload (containing chunk_text, metadata).
        """
        if not self.client or not HAS_QDRANT:
            logger.error("Qdrant client unavailable for similarity search.")
            return []

        # Guarantee collection exists before searching
        self.ensure_collection()

        # Build Qdrant Filter from conditions
        qdrant_filter = None
        if filter_conditions:
            must_conditions = []
            for key, value in filter_conditions.items():
                if value is not None:
                    must_conditions.append(
                        FieldCondition(key=key, match=MatchValue(value=value))
                    )
            if must_conditions:
                qdrant_filter = Filter(must=must_conditions)

        try:
            results = None
            # Prefer client.search() first as it is universally supported across Qdrant server versions
            if hasattr(self.client, "search"):
                try:
                    results = self.client.search(
                        collection_name=self.collection_name,
                        query_vector=query_vector,
                        query_filter=qdrant_filter,
                        limit=top_k,
                        score_threshold=score_threshold,
                        with_payload=True,
                    )
                except Exception as e_search:
                    if hasattr(self.client, "query_points"):
                        res = self.client.query_points(
                            collection_name=self.collection_name,
                            query=query_vector,
                            query_filter=qdrant_filter,
                            limit=top_k,
                            score_threshold=score_threshold,
                            with_payload=True,
                        )
                        results = res.points if hasattr(res, "points") else res
                    else:
                        raise e_search
            elif hasattr(self.client, "query_points"):
                res = self.client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    query_filter=qdrant_filter,
                    limit=top_k,
                    score_threshold=score_threshold,
                    with_payload=True,
                )
                results = res.points if hasattr(res, "points") else res
            else:
                results = []
            if results is None:
                results = []

            search_results = []
            for hit in results:
                search_results.append({
                    "chunk_id": str(hit.id),
                    "score": round(float(hit.score), 4),
                    "payload": hit.payload or {},
                })

            logger.info(
                "Qdrant similarity search returned %d results (top_k=%d, threshold=%.2f).",
                len(search_results), top_k, score_threshold,
            )
            return search_results

        except Exception as e:
            err_msg = str(e)
            if "404" in err_msg or "doesn't exist" in err_msg.lower() or "not found" in err_msg.lower():
                logger.info("Qdrant collection '%s' empty or uninitialized. Returning 0 context chunks.", self.collection_name)
                return []
            logger.error("Qdrant similarity search failed: %s", err_msg)
            raise RuntimeError(f"Vector similarity search error: {err_msg}")

    def search_by_metadata(self, filter_conditions: Dict[str, Any], limit: int = 10) -> List[Dict[str, Any]]:
        """
        Backward-compatible metadata search wrapper.
        Delegates to similarity_search with a zero-vector query when no embedding is available.
        """
        logger.warning("search_by_metadata called without query vector; use similarity_search for RAG retrieval.")
        zero_vector = [0.0] * self.embedding_dim
        return self.similarity_search(
            query_vector=zero_vector,
            top_k=limit,
            filter_conditions=filter_conditions,
        )

    def health(self) -> Dict[str, Any]:
        """
        Diagnostic readiness check of Qdrant connection and target collection availability.
        """
        if not HAS_QDRANT or not self.client:
            return {
                "component": "VectorStoreService (Qdrant)",
                "status": "unhealthy",
                "message": "Qdrant client library uninstalled or connection disconnected.",
            }

        try:
            start_time = time.time()
            info = self.client.get_collection(self.collection_name)
            latency_ms = round((time.time() - start_time) * 1000.0, 2)
            vector_count = info.vectors_count if hasattr(info, "vectors_count") else "unknown"
            points_count = info.points_count if hasattr(info, "points_count") else "unknown"
            
            return {
                "component": "VectorStoreService (Qdrant)",
                "status": "healthy",
                "message": f"Connected to collection '{self.collection_name}'.",
                "details": {
                    "url": self.url,
                    "collection": self.collection_name,
                    "points_count": points_count,
                    "latency_ms": latency_ms,
                },
            }
        except Exception as e:
            return {
                "component": "VectorStoreService (Qdrant)",
                "status": "degraded",
                "message": f"Qdrant collection check error: {str(e)}",
            }

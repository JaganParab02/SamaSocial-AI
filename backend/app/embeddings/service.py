"""
EmbeddingService using local sentence-transformers model (all-MiniLM-L6-v2).
Singleton pattern loading model strictly once into memory to prevent resource overhead.
"""

import time
from typing import Any, Dict, List
from app.core.logger import get_logger

logger = get_logger(__name__)

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False
    logger.error("sentence-transformers library not installed.")


class EmbeddingService:
    """
    Singleton embedding generator used across ingestion pipelines and future retrieval searches.
    Generates consistent 384-dimensional dense vectors using all-MiniLM-L6-v2.
    """
    _instance = None
    _model = None
    _model_name = "all-MiniLM-L6-v2"
    _dimension = 384

    def __new__(cls, *args, **kwargs):
        """Enforces Singleton pattern so weights are loaded into memory exactly once."""
        if not cls._instance:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding service. Does not reload model if already cached.
        
        Args:
            model_name: HuggingFace model string identifier.
        """
        if self._model is not None:
            return

        self._model_name = model_name
        self._load_model()

    def _load_model(self) -> None:
        """Loads SentenceTransformer model weights into RAM/GPU synchronously."""
        if not HAS_SENTENCE_TRANSFORMERS:
            logger.error("Cannot load embedding model without sentence-transformers installed.")
            return

        logger.info("Loading sentence-transformers model '%s'...", self._model_name)
        start_time = time.time()
        try:
            self._model = SentenceTransformer(self._model_name)
            self._dimension = self._model.get_sentence_embedding_dimension() or 384
            duration = round((time.time() - start_time) * 1000.0, 2)
            logger.info(
                "Successfully loaded embedding model '%s' (dim=%d) in %d ms.",
                self._model_name, self._dimension, duration
            )
        except Exception as e:
            logger.error("Failed to load SentenceTransformer model '%s': %s", self._model_name, str(e))
            self._model = None

    @property
    def dimension(self) -> int:
        """Returns vector dimensionality size (e.g. 384)."""
        return self._dimension

    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding vector for a single string input.
        
        Args:
            text: Text string to vectorize.
            
        Returns:
            List of floats representing the dense vector embedding.
        """
        if not text:
            return [0.0] * self._dimension
        if self._model is None:
            logger.warning("Embedding model unloaded; returning zero-vector placeholder.")
            return [0.0] * self._dimension

        try:
            vector = self._model.encode(text, normalize_embeddings=True, show_progress_bar=False)
            return vector.tolist()
        except Exception as e:
            logger.error("Failed during embed_text generation: %s", str(e))
            raise RuntimeError(f"Embedding computation error: {str(e)}")

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embedding vectors for a batch of strings concurrently.
        
        Args:
            texts: List of text strings to vectorize.
            
        Returns:
            List of dense embedding vectors corresponding to inputs.
        """
        if not texts:
            return []
        if self._model is None:
            logger.warning("Embedding model unloaded; returning zero-vectors for batch.")
            return [[0.0] * self._dimension for _ in texts]

        try:
            vectors = self._model.encode(
                texts,
                batch_size=32,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            return [v.tolist() for v in vectors]
        except Exception as e:
            logger.error("Failed during embed_batch generation: %s", str(e))
            raise RuntimeError(f"Batch embedding computation error: {str(e)}")

    def health(self) -> Dict[str, Any]:
        """
        Diagnostic test validating model availability and embedding execution readiness.
        """
        if not HAS_SENTENCE_TRANSFORMERS or self._model is None:
            return {
                "component": "EmbeddingService",
                "status": "unhealthy",
                "message": f"SentenceTransformer model '{self._model_name}' is not loaded.",
            }

        try:
            # Test encoding latency
            start_time = time.time()
            test_vec = self.embed_text("health verification check")
            latency_ms = round((time.time() - start_time) * 1000.0, 2)
            is_valid = len(test_vec) == self._dimension

            return {
                "component": "EmbeddingService",
                "status": "healthy" if is_valid else "degraded",
                "message": "Embedding service operational and weights cached in RAM.",
                "details": {
                    "model_name": self._model_name,
                    "dimension": self._dimension,
                    "test_latency_ms": latency_ms,
                },
            }
        except Exception as e:
            return {
                "component": "EmbeddingService",
                "status": "unhealthy",
                "message": f"Embedding health evaluation failure: {str(e)}",
            }

"""
RAG ingestion package initialization.
Exposes ChunkService and DocumentPipeline for extracting and indexing content into Qdrant.
Contains no retrieval or chatbot query execution logic.
"""
from app.rag.chunk_service import ChunkService
from app.rag.document_pipeline import DocumentPipeline

__all__ = ["ChunkService", "DocumentPipeline"]

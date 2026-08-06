"""
FastAPI Dependency Injection factories.
Ensures separation of concerns, DRY code, and testable design by exposing modular singleton instances.
"""
from functools import lru_cache
from app.core.config import Settings, get_settings
from app.llm.client import LLMClient
from app.embeddings.service import EmbeddingService
from app.vectordb.service import VectorStoreService
from app.db.supabase import SupabaseClient
from app.rag.chunk_service import ChunkService
from app.rag.document_pipeline import DocumentPipeline
from app.chat.session_manager import SessionManager
from app.chat.memory_service import MemoryService
from app.prompts.loader import PromptLoader
from app.services.source_service import SourceService
from app.services.document_service import DocumentService
from app.rag.retriever import Retriever
from app.rag.context_builder import ContextBuilder
from app.rag.citation_builder import CitationBuilder
from app.llm.prompt_builder import PromptBuilder
from app.llm.streaming_service import StreamingService
from app.chat.chat_pipeline import ChatPipeline
from app.chat.chat_service import ChatService
from app.planner.service import CoursePlannerService
from app.chat.conversation_manager import ConversationManager


@lru_cache()
def get_llm_client() -> LLMClient:
    """Singleton provider for Groq LLM Client."""
    settings = get_settings()
    return LLMClient(api_key=settings.GROQ_API_KEY, model=settings.LLM_MODEL)


@lru_cache()
def get_embedding_service() -> EmbeddingService:
    """Singleton provider for local Sentence Transformers embedding model."""
    settings = get_settings()
    return EmbeddingService(model_name=settings.EMBEDDING_MODEL)


@lru_cache()
def get_vectordb_service() -> VectorStoreService:
    """Singleton provider for Qdrant Vector Store connection and indexing."""
    settings = get_settings()
    return VectorStoreService(
        url=settings.QDRANT_URL,
        collection_name=settings.QDRANT_COLLECTION,
        embedding_dim=get_embedding_service().dimension,
    )


@lru_cache()
def get_supabase_client() -> SupabaseClient:
    """Singleton provider for Supabase DB client."""
    settings = get_settings()
    return SupabaseClient(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)


@lru_cache()
def get_chunk_service() -> ChunkService:
    """Provider for document text splitter and metadata chunk enricher."""
    settings = get_settings()
    return ChunkService(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP
    )


@lru_cache()
def get_source_service() -> SourceService:
    """Singleton in-memory registry tracking all uploaded knowledge sources."""
    return SourceService()


@lru_cache()
def get_session_manager() -> SessionManager:
    """Singleton Session lifecycle and extensible state manager."""
    return SessionManager()


@lru_cache()
def get_memory_service() -> MemoryService:
    """Singleton Conversation memory buffer service."""
    settings = get_settings()
    return MemoryService(max_history=settings.MAX_HISTORY)


@lru_cache()
def get_prompt_loader() -> PromptLoader:
    """Singleton Prompt template loader and caching facility."""
    return PromptLoader()


@lru_cache()
def get_document_pipeline() -> DocumentPipeline:
    """
    Constructs the end-to-end multi-source Document Pipeline connecting:
    Parsers -> Chunker -> Embedder -> Vector DB Storage -> Registry.
    """
    return DocumentPipeline(
        chunk_service=get_chunk_service(),
        embedding_service=get_embedding_service(),
        vectordb_service=get_vectordb_service(),
        source_service=get_source_service(),
        llm_client=get_llm_client(),
    )


@lru_cache()
def get_document_service() -> DocumentService:
    """High-level document operational orchestrator for route layer injection."""
    return DocumentService(
        pipeline=get_document_pipeline(),
        source_service=get_source_service(),
        vectordb=get_vectordb_service()
    )


@lru_cache()
def get_retriever() -> Retriever:
    """Singleton RAG Retriever factory."""
    settings = get_settings()
    return Retriever(
        embedding_service=get_embedding_service(),
        vectordb_service=get_vectordb_service(),
        default_top_k=settings.TOP_K,
        similarity_threshold=settings.SIMILARITY_THRESHOLD,
    )


@lru_cache()
def get_context_builder() -> ContextBuilder:
    """Singleton ContextBuilder factory."""
    settings = get_settings()
    return ContextBuilder(max_context_tokens=settings.MAX_CONTEXT_TOKENS)


@lru_cache()
def get_citation_builder() -> CitationBuilder:
    """Singleton CitationBuilder factory."""
    return CitationBuilder()


@lru_cache()
def get_prompt_builder() -> PromptBuilder:
    """Singleton PromptBuilder factory."""
    return PromptBuilder(prompt_loader=get_prompt_loader())


@lru_cache()
def get_streaming_service() -> StreamingService:
    """Singleton StreamingService factory."""
    return StreamingService(llm_client=get_llm_client())


@lru_cache()
def get_chat_pipeline() -> ChatPipeline:
    """Singleton ChatPipeline orchestrator factory."""
    return ChatPipeline(
        session_manager=get_session_manager(),
        memory_service=get_memory_service(),
        retriever=get_retriever(),
        context_builder=get_context_builder(),
        citation_builder=get_citation_builder(),
        prompt_builder=get_prompt_builder(),
        llm_client=get_llm_client(),
        streaming_service=get_streaming_service(),
    )


@lru_cache()
def get_chat_service() -> ChatService:
    """Singleton ChatService business layer factory."""
    return ChatService(
        chat_pipeline=get_chat_pipeline(),
        session_manager=get_session_manager(),
        memory_service=get_memory_service(),
        doc_service=get_document_service(),
    )


@lru_cache()
def get_planner_service() -> CoursePlannerService:
    """Provides a singleton instance of the CoursePlannerService."""
    # We resolve dependencies manually for the singleton
    sm = get_session_manager()
    memory = get_memory_service()
    retriever = get_retriever()
    llm = get_llm_client()
    loader = get_prompt_loader()
    return CoursePlannerService(sm, memory, retriever, llm, loader)


@lru_cache()
def get_conversation_manager() -> ConversationManager:
    """Singleton ConversationManager factory."""
    return ConversationManager(
        session_manager=get_session_manager(),
        memory_service=get_memory_service(),
    )

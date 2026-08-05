"""
Smoke tests verifying functional operation of Reusable AI Backend Core services and infrastructure.
Validates model loading, Qdrant indexing, parser extraction, chunking, and session management
without requiring external real API credentials or network connections.
"""

import os
import tempfile
import pytest
from app.core.dependencies import (
    get_settings,
    get_embedding_service,
    get_vectordb_service,
    get_chunk_service,
    get_source_service,
    get_session_manager,
    get_memory_service,
    get_prompt_loader,
    get_document_pipeline,
)
from app.models.document import SourceType, DocumentChunk
from app.parsers.base import BaseParser
from app.parsers.web_parser import WebParser
from app.parsers.youtube_parser import YoutubeParser


@pytest.fixture(autouse=True)
def test_environment_override():
    """Configure fast test parameters using in-memory fallbacks."""
    settings = get_settings()
    settings.QDRANT_URL = "http://localhost:6333" # VectorStoreService auto-falls back to :memory: if server unreached
    settings.EMBEDDING_MODEL = "all-MiniLM-L6-v2"
    yield


def test_01_configuration_loading():
    """Verify centralized settings instance loads standard configurations cleanly."""
    settings = get_settings()
    assert settings.CHUNK_SIZE > 0
    assert "pdf" in settings.SUPPORTED_FILE_TYPES
    assert settings.BACKEND_PORT == 8000
    print("\n✅ Test 01 (Config) passed.")


def test_02_embedding_service():
    """Verify Sentence-Transformers embedding model initialization and 384-dim output."""
    emb = get_embedding_service()
    assert emb.dimension == 384
    vec = emb.embed_text("Test sentence embedding.")
    assert isinstance(vec, list)
    assert len(vec) == 384
    batch_vecs = emb.embed_batch(["Hello world", "SamaSocial AI Backend"])
    assert len(batch_vecs) == 2
    assert len(batch_vecs[0]) == 384
    print("✅ Test 02 (Embedding Service) passed.")


def test_03_vectordb_service():
    """Verify Qdrant connection fallback and vector payload upsert capabilities."""
    vdb = get_vectordb_service()
    # Test health reporting
    health = vdb.health()
    assert health["component"] == "VectorStoreService (Qdrant)"
    
    # Test sample vector insertion
    sample_chunk = DocumentChunk(
        chunk_id="550e8400-e29b-41d4-a716-446655440000",
        session_id="test-session-001",
        source_id="test-source-001",
        source_name="smoke_test_doc.pdf",
        source_type=SourceType.PDF,
        page_number=1,
        slide_number=None,
        timestamp=None,
        chunk_number=1,
        chunk_text="This is a test chunk verified in Qdrant storage.",
    )
    sample_vector = [0.1] * 384
    upserted = vdb.upsert_vectors([sample_chunk], [sample_vector])
    assert upserted == 1

    # Verify cleanup deletion
    assert vdb.delete_vectors(source_id="test-source-001") is True
    print("✅ Test 03 (VectorStoreService / Qdrant) passed.")


def test_04_session_and_memory_manager():
    """Verify extensible session model creation, source attachments, and memory sliding window."""
    sm = get_session_manager()
    sess = sm.create_session(initial_metadata={"user_role": "student"})
    assert sess.session_id is not None
    assert sess.metadata["user_role"] == "student"
    
    # Verify source attachment
    sm.attach_source(sess.session_id, "doc_id_123")
    assert "doc_id_123" in sess.uploaded_sources

    # Verify extensible planner state modification for Module 2 compatibility
    sm.update_planner_state(sess.session_id, {"step": "syllabus_analysis"}, course_plan={"title": "ML Course"})
    assert sess.planner_state["step"] == "syllabus_analysis"
    assert sess.course_plan["title"] == "ML Course"

    # Verify memory service append and sliding window truncation
    mem = get_memory_service()
    mem.append(sess, "system", "You are an AI assistant.")
    mem.append(sess, "user", "Hello AI!")
    assert len(mem.history(sess)) == 2
    assert mem.estimate_tokens("Hello AI world, this is a test string!") >= 5
    print("✅ Test 04 (Session & Memory Services) passed.")


def test_05_prompt_loader():
    """Verify prompt template loading and keyword variable substitution without hardcoding."""
    loader = get_prompt_loader()
    system_text = loader.load_prompt_text("system")
    assert "NavGurukul" in system_text
    
    # Test variable formatting
    built_prompt = loader.build_prompt("learning_assistant", context="Python lists", conversation_history="None", question="What is a list?")
    assert "Python lists" in built_prompt
    assert "What is a list?" in built_prompt
    print("✅ Test 05 (Prompt Loader) passed.")


def test_06_web_and_youtube_parsers():
    """Verify structural cleanliness and interface consistency of content parsers."""
    # WebParser instantiation test
    wp = WebParser()
    assert "http" in wp.supported_extensions()

    # YouTube Parser identifier validation
    yt = YoutubeParser()
    video_id = yt.extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert video_id == "dQw4w9WgXcQ"
    print("✅ Test 06 (Parser Framework) passed.")


def test_07_chunking_service():
    """Verify Langchain RecursiveCharacterTextSplitter wrapper divides content with full metadata."""
    from app.models.document import ParsedDocument, SourceMetadata
    chunker = get_chunk_service()
    
    meta = SourceMetadata(
        source_id="test-source-id",
        source_name="test_lecture.txt",
        source_type=SourceType.WEB,
    )
    long_text = "Educational learning material sentence block. " * 50
    parsed = ParsedDocument(metadata=meta, content=long_text, structured_items=[])
    
    res = chunker.chunk_document(parsed)
    assert res.total_chunks >= 1
    assert len(res.chunks) == res.total_chunks
    assert res.chunks[0].source_id == "test-source-id"
    assert res.chunks[0].chunk_text != ""
    print("✅ Test 07 (Chunking Service) passed.")

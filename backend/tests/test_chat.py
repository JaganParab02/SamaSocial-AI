import pytest
from unittest.mock import Mock, patch
from app.models.chat import ChatRequest, SourceFilter
from app.models.document import SourceType
from app.chat.memory_service import MemoryService
from app.chat.session_manager import SessionManager
from app.models.session import Session, SessionMessage


def test_memory_service_serialize_for_prompt():
    """Test that conversation history serializes correctly for prompts."""
    memory = MemoryService(max_history=5)
    session = Session(session_id="test_session")
    
    memory.append(session, "user", "What is Python?")
    memory.append(session, "assistant", "A programming language.")
    
    serialized = memory.serialize_for_prompt(session, max_turns=10)
    assert "User: What is Python?" in serialized
    assert "Assistant: A programming language." in serialized


def test_context_builder_deduplication():
    """Test ContextBuilder deduplicates chunks and enforces budget."""
    from app.rag.context_builder import ContextBuilder
    from app.models.chat import RetrievedChunk
    
    builder = ContextBuilder(max_context_tokens=100) # tiny budget
    
    # Create duplicate chunks
    chunks = [
        RetrievedChunk(
            chunk_id="1", chunk_text="Chunk A text", source_id="src1",
            source_name="doc.pdf", source_type=SourceType.PDF, similarity_score=0.9
        ),
        RetrievedChunk(
            chunk_id="1", chunk_text="Chunk A text", source_id="src1",
            source_name="doc.pdf", source_type=SourceType.PDF, similarity_score=0.9
        ),
        RetrievedChunk(
            chunk_id="2", chunk_text="Chunk B text " * 50, source_id="src2",
            source_name="video.mp4", source_type=SourceType.YOUTUBE, similarity_score=0.8
        )
    ]
    
    context = builder.build_context(chunks)
    
    # Should only appear once
    assert context.count("Chunk A text") == 1
    # Should contain source marker
    assert "[PDF: doc.pdf]" in context
    # Should be truncated to fit budget (~400 chars)
    assert len(context) <= 450


def test_citation_builder():
    """Test citation generation from chunks."""
    from app.rag.citation_builder import CitationBuilder
    from app.models.chat import RetrievedChunk
    
    builder = CitationBuilder()
    
    chunks = [
        RetrievedChunk(
            chunk_id="1", chunk_text="PDF text", source_id="src1",
            source_name="book.pdf", source_type=SourceType.PDF, page_number=5, similarity_score=0.9
        ),
        RetrievedChunk(
            chunk_id="2", chunk_text="YouTube text", source_id="src2",
            source_name="video", source_type=SourceType.YOUTUBE, timestamp="12:34", similarity_score=0.8
        )
    ]
    
    citations = builder.build_citations(chunks)
    assert len(citations) == 2
    assert citations[0].formatted == "[Source: book.pdf, Page 5]"
    assert citations[1].formatted == "[Source: video, Timestamp 12:34]"


@patch("app.llm.client.LLMClient")
def test_prompt_builder(mock_client_class):
    """Test message array assembly from PromptBuilder."""
    from app.llm.prompt_builder import PromptBuilder
    from app.prompts.loader import PromptLoader
    
    loader = PromptLoader()
    builder = PromptBuilder(prompt_loader=loader)
    
    messages = builder.build_chat_messages(
        question="How do I loop?",
        context="Use a for loop.",
        conversation_history="User: Hi",
        system_template="system",
        user_template="learning_assistant"
    )
    
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    assert "Use a for loop." in messages[1]["content"]
    assert "How do I loop?" in messages[1]["content"]


@patch("app.rag.retriever.Retriever")
@patch("app.llm.client.LLMClient")
def test_chat_pipeline_sync(mock_llm, mock_retriever):
    """Test full pipeline execution without streaming."""
    from app.chat.chat_pipeline import ChatPipeline
    from app.chat.session_manager import SessionManager
    from app.chat.memory_service import MemoryService
    from app.rag.context_builder import ContextBuilder
    from app.rag.citation_builder import CitationBuilder
    from app.llm.prompt_builder import PromptBuilder
    from app.llm.streaming_service import StreamingService
    from app.prompts.loader import PromptLoader
    
    # Mock LLM return
    mock_client = mock_llm.return_value
    mock_client.generate.return_value = {
        "content": "A test answer.",
        "model": "test-model",
        "usage": {"total_tokens": 50}
    }
    
    # Mock retrieval
    mock_retr = mock_retriever.return_value
    mock_retr.retrieve.return_value = []
    
    pipeline = ChatPipeline(
        session_manager=SessionManager(),
        memory_service=MemoryService(),
        retriever=mock_retr,
        context_builder=ContextBuilder(),
        citation_builder=CitationBuilder(),
        prompt_builder=PromptBuilder(PromptLoader()),
        llm_client=mock_client,
        streaming_service=StreamingService(mock_client)
    )
    
    response = pipeline.run("test_session", "Hello?")
    assert response.answer == "A test answer."
    assert response.is_out_of_scope == True  # Because no chunks were retrieved

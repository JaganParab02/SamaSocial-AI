"""
ChatPipeline: Central orchestration engine for the conversational AI.
Pipeline flow: User Question → Memory → Retrieval → ContextBuilder → PromptBuilder → LLM → CitationBuilder → Response
Reusable by Module 2 by injecting different prompt templates.
"""

from typing import Any, Generator, List, Optional
from app.chat.session_manager import SessionManager
from app.chat.memory_service import MemoryService
from app.rag.retriever import Retriever
from app.rag.context_builder import ContextBuilder
from app.rag.citation_builder import CitationBuilder
from app.llm.prompt_builder import PromptBuilder
from app.llm.client import LLMClient
from app.llm.streaming_service import StreamingService
from app.models.chat import (
    ChatResponse,
    Citation,
    RetrievedChunk,
    SourceFilter,
)
from app.core.logger import get_logger

logger = get_logger(__name__)

# Out-of-scope detection phrases the LLM uses when context is insufficient
OUT_OF_SCOPE_INDICATORS = [
    "not available in the uploaded",
    "don't have enough information",
    "not found in the provided",
    "no information available",
    "cannot find this information",
    "not covered in the learning materials",
    "information is not available",
]


class ChatPipeline:
    """
    Orchestrates the full RAG conversation flow.
    Every chat interaction passes through this pipeline.
    """

    def __init__(
        self,
        session_manager: SessionManager,
        memory_service: MemoryService,
        retriever: Retriever,
        context_builder: ContextBuilder,
        citation_builder: CitationBuilder,
        prompt_builder: PromptBuilder,
        llm_client: LLMClient,
        streaming_service: StreamingService,
    ):
        self.session_manager = session_manager
        self.memory = memory_service
        self.retriever = retriever
        self.context_builder = context_builder
        self.citation_builder = citation_builder
        self.prompt_builder = prompt_builder
        self.llm_client = llm_client
        self.streaming_service = streaming_service

    def run(
        self,
        session_id: str,
        question: str,
        source_filter: SourceFilter = SourceFilter.ALL,
        top_k: Optional[int] = None,
        system_template: str = "system",
        user_template: str = "learning_assistant",
    ) -> ChatResponse:
        """
        Execute the full non-streaming RAG pipeline.

        Args:
            session_id: User session identifier.
            question: The user's question.
            source_filter: Filter retrieval by source type.
            top_k: Override default top-K retrieval count.
            system_template: System prompt template name.
            user_template: User prompt template name.

        Returns:
            Complete ChatResponse with answer, citations, and metadata.
        """
        logger.info("ChatPipeline.run() for session '%s': %s", session_id, question[:80])

        # 1. Get or create session
        session = self.session_manager.get_or_create(session_id)

        # 2. Append user message to memory
        self.memory.append(session, "user", question)

        # 3. Retrieve relevant chunks
        retrieved_chunks = self.retriever.retrieve(
            query=question,
            top_k=top_k,
            source_filter=source_filter,
            session_id=None,  # Search across all indexed sources, not session-scoped
        )

        # 4. Build optimized context
        context = self.context_builder.build_context(retrieved_chunks)

        # 5. Serialize conversation history for follow-up support
        conversation_history = self.memory.serialize_for_prompt(session)

        # 6. Build LLM messages via PromptBuilder
        messages = self.prompt_builder.build_chat_messages(
            question=question,
            context=context if context else "No relevant context was found in the uploaded documents.",
            conversation_history=conversation_history,
            system_template=system_template,
            user_template=user_template,
        )

        # 7. Call LLM for generation
        llm_result = self.llm_client.generate(messages)
        answer = llm_result.get("content", "")
        model = llm_result.get("model", "")
        usage = llm_result.get("usage", {})

        # 8. Build citations from retrieval metadata
        citations = self.citation_builder.build_citations(retrieved_chunks)

        # 9. Detect out-of-scope responses
        is_out_of_scope = self._detect_out_of_scope(answer, retrieved_chunks)

        # 10. Append assistant response to memory
        self.memory.append(
            session, "assistant", answer,
            metadata={"citations_count": len(citations), "model": model},
        )

        logger.info(
            "ChatPipeline completed: %d chunks retrieved, %d citations, out_of_scope=%s.",
            len(retrieved_chunks), len(citations), is_out_of_scope,
        )

        return ChatResponse(
            session_id=session_id,
            answer=answer,
            citations=citations,
            retrieved_chunks=retrieved_chunks,
            is_out_of_scope=is_out_of_scope,
            follow_up_possible=True,
            model=model,
            tokens_used=usage.get("total_tokens"),
        )

    def run_stream(
        self,
        session_id: str,
        question: str,
        source_filter: SourceFilter = SourceFilter.ALL,
        top_k: Optional[int] = None,
        system_template: str = "system",
        user_template: str = "learning_assistant",
    ) -> Generator[str, None, None]:
        """
        Execute the RAG pipeline with SSE streaming response.
        Retrieval and prompt construction happen synchronously, then tokens stream.

        Yields:
            SSE-formatted event strings.
        """
        logger.info("ChatPipeline.run_stream() for session '%s': %s", session_id, question[:80])

        # 1-5. Same pre-processing as non-streaming
        session = self.session_manager.get_or_create(session_id)
        self.memory.append(session, "user", question)

        retrieved_chunks = self.retriever.retrieve(
            query=question, top_k=top_k, source_filter=source_filter,
        )

        context = self.context_builder.build_context(retrieved_chunks)
        conversation_history = self.memory.serialize_for_prompt(session)

        messages = self.prompt_builder.build_chat_messages(
            question=question,
            context=context if context else "No relevant context was found in the uploaded documents.",
            conversation_history=conversation_history,
            system_template=system_template,
            user_template=user_template,
        )

        # Build citations before streaming
        citations = self.citation_builder.build_citations(retrieved_chunks)

        # 6. Stream via StreamingService — yields SSE events
        full_response_parts = []

        for sse_event in self.streaming_service.stream_response(
            messages=messages,
            session_id=session_id,
            citations=citations,
        ):
            # Capture response text for memory storage
            # Parse token events to collect the full answer
            if '"event": "token"' in sse_event or '"event":"token"' in sse_event:
                import json
                try:
                    data_str = sse_event.replace("data: ", "").strip()
                    parsed = json.loads(data_str)
                    if parsed.get("event") == "token":
                        full_response_parts.append(parsed.get("data", ""))
                except (json.JSONDecodeError, ValueError):
                    pass

            yield sse_event

        # Save assistant response to memory after streaming completes
        full_answer = "".join(full_response_parts)
        if full_answer:
            self.memory.append(
                session, "assistant", full_answer,
                metadata={"citations_count": len(citations), "streamed": True},
            )

    def _detect_out_of_scope(
        self, answer: str, chunks: List[RetrievedChunk]
    ) -> bool:
        """
        Detect whether the LLM response indicates insufficient context.
        Checks both the answer text and retrieval results.
        """
        # No chunks retrieved at all
        if not chunks:
            return True

        # LLM explicitly stated lack of information
        answer_lower = answer.lower()
        for indicator in OUT_OF_SCOPE_INDICATORS:
            if indicator in answer_lower:
                return True

        return False

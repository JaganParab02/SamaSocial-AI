"""
StreamingService wrapping LLMClient.stream() into FastAPI-compatible SSE event generators.
Handles token-by-token streaming, completion events, error handling, and citation appending.
"""

import json
from typing import Any, Dict, Generator, List, Optional
from app.llm.client import LLMClient
from app.models.chat import Citation, StreamingChunk
from app.core.logger import get_logger

logger = get_logger(__name__)


class StreamingService:
    """
    Converts raw LLM token streams into Server-Sent Events (SSE) format.
    Appends citation metadata at stream completion.
    """

    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def stream_response(
        self,
        messages: List[Dict[str, str]],
        session_id: str,
        citations: Optional[List[Citation]] = None,
        **llm_kwargs: Any,
    ) -> Generator[str, None, None]:
        """
        Generate SSE-formatted events from LLM streaming response.

        Args:
            messages: LLM message array from PromptBuilder.
            session_id: Current session ID for event tagging.
            citations: Optional citations to append after stream completion.

        Yields:
            SSE-formatted strings: 'data: {"event": "token", "data": "..."}\n\n'
        """
        chunk_index = 0
        full_response = []

        try:
            for token in self.llm_client.stream(messages, **llm_kwargs):
                full_response.append(token)
                event = StreamingChunk(
                    event="token",
                    data=token,
                    session_id=session_id,
                    chunk_index=chunk_index,
                )
                yield f"data: {event.model_dump_json()}\n\n"
                chunk_index += 1

            # Emit citations event if present
            if citations:
                citation_data = [c.model_dump() for c in citations]
                cite_event = StreamingChunk(
                    event="citations",
                    data=json.dumps(citation_data),
                    session_id=session_id,
                    chunk_index=chunk_index,
                )
                yield f"data: {cite_event.model_dump_json()}\n\n"
                chunk_index += 1

            # Emit completion event
            done_data = {
                "full_response_length": len("".join(full_response)),
                "total_chunks": chunk_index,
            }
            done_event = StreamingChunk(
                event="done",
                data=json.dumps(done_data),
                session_id=session_id,
                chunk_index=chunk_index,
            )
            yield f"data: {done_event.model_dump_json()}\n\n"

        except Exception as e:
            logger.error("Streaming error for session '%s': %s", session_id, str(e))
            error_event = StreamingChunk(
                event="error",
                data=json.dumps({"error": str(e)}),
                session_id=session_id,
                chunk_index=chunk_index,
            )
            yield f"data: {error_event.model_dump_json()}\n\n"

    def collect_streamed_text(
        self,
        messages: List[Dict[str, str]],
        **llm_kwargs: Any,
    ) -> str:
        """
        Utility: collect all streaming tokens into a single string.
        Useful for non-streaming code paths that still want to use the stream API.
        """
        parts = []
        try:
            for token in self.llm_client.stream(messages, **llm_kwargs):
                parts.append(token)
        except Exception as e:
            logger.error("Error collecting streamed text: %s", str(e))
            raise
        return "".join(parts)

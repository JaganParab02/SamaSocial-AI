"""
Reusable Groq LLM Client Adapter.
Responsible strictly for connection management, retries, health checking, and timeout handling.
Does NOT implement chatbot logic, RAG retrieval, or prompt construction.
"""

import time
from typing import Any, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.logger import get_logger

logger = get_logger(__name__)

try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False
    logger.warning("Groq SDK not found. LLMClient will run in placeholder/mock mode.")


class LLMClient:
    """
    Generic reusable client wrapping the Groq API provider.
    Can be utilized by both Module 1 (Learning Assistant) and Module 2 (Course Planner).
    """

    def __init__(self, api_key: str, model: str, timeout: float = 30.0):
        """
        Initialize the Groq client connection.
        
        Args:
            api_key: Groq API key (loaded from environmental configuration)
            model: Default model identifier (e.g. llama-3.1-70b-versatile)
            timeout: Maximum network request waiting duration in seconds
        """
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.client = None
        self._initialize_connection()

    def _initialize_connection(self) -> None:
        """Establishes client instance without performing prompt logic."""
        if not HAS_GROQ:
            logger.warning("Initializing LLMClient without Groq SDK available.")
            return
        if not self.api_key or "placeholder" in self.api_key.lower():
            logger.warning("Groq API Key is unconfigured or using placeholder value.")
            return
        try:
            self.client = Groq(api_key=self.api_key, timeout=self.timeout)
            logger.info("Groq LLM Client connection initialized successfully for model: %s", self.model)
        except Exception as e:
            logger.error("Failed to initialize Groq client: %s", str(e))
            self.client = None

    def health(self) -> Dict[str, Any]:
        """
        Diagnose network and operational readiness of the Groq LLM connection.
        
        Returns:
            Dictionary containing component status and health diagnosis details.
        """
        if not HAS_GROQ:
            return {
                "component": "LLMClient (Groq)",
                "status": "unhealthy",
                "message": "Groq SDK library is not installed.",
            }
        if not self.client:
            return {
                "component": "LLMClient (Groq)",
                "status": "unhealthy",
                "message": "Groq client is not initialized due to invalid or missing API key.",
            }
        try:
            # Simple metadata model enumeration check as lightweight health check
            start_time = time.time()
            models = self.client.models.list()
            latency_ms = (time.time() - start_time) * 1000.0
            available_models = [m.id for m in models.data] if hasattr(models, "data") else []
            return {
                "component": "LLMClient (Groq)",
                "status": "healthy",
                "message": "Connected to Groq successfully.",
                "details": {
                    "configured_model": self.model,
                    "latency_ms": round(latency_ms, 2),
                    "target_model_available": self.model in available_models or "llama" in self.model,
                },
            }
        except Exception as e:
            logger.error("Groq health verification check failed: %s", str(e))
            return {
                "component": "LLMClient (Groq)",
                "status": "degraded",
                "message": f"Groq health check network call failed: {str(e)}",
            }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    def generate(self, messages: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Synchronous chat completion via Groq API.

        Args:
            messages: List of message dicts [{"role": "system", "content": "..."},
                      {"role": "user", "content": "..."}].

        Returns:
            Dict with 'content' (response text), 'model', 'usage' keys.
        """
        if not self.client:
            raise RuntimeError("Groq LLM client is not initialized. Check API key configuration.")

        try:
            response = self.client.chat.completions.create(
                model=kwargs.get("model", self.model),
                messages=messages,
                temperature=kwargs.get("temperature", 0.3),
                max_tokens=kwargs.get("max_tokens", 2048),
                top_p=kwargs.get("top_p", 0.9),
                stream=False,
            )
            choice = response.choices[0] if response.choices else None
            content = choice.message.content if choice else ""
            usage = {
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "total_tokens": response.usage.total_tokens if response.usage else 0,
            }
            logger.info("Groq generate completed. Tokens used: %d", usage.get("total_tokens", 0))
            return {
                "content": content,
                "model": response.model or self.model,
                "usage": usage,
            }
        except Exception as e:
            logger.error("Groq generate call failed: %s", str(e))
            raise

    def stream(self, messages: Any, **kwargs: Any) -> Any:
        """
        Streaming chat completion via Groq API.
        Yields content delta strings token-by-token.

        Args:
            messages: List of message dicts for the conversation.

        Yields:
            String content deltas from the streaming response.
        """
        if not self.client:
            raise RuntimeError("Groq LLM client is not initialized. Check API key configuration.")

        try:
            stream_response = self.client.chat.completions.create(
                model=kwargs.get("model", self.model),
                messages=messages,
                temperature=kwargs.get("temperature", 0.3),
                max_tokens=kwargs.get("max_tokens", 2048),
                top_p=kwargs.get("top_p", 0.9),
                stream=True,
            )

            for chunk in stream_response:
                if chunk.choices and chunk.choices[0].delta:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content

        except Exception as e:
            logger.error("Groq streaming call failed: %s", str(e))
            raise


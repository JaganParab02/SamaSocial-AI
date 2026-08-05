"""
LLM Package initialization.
Exposes generic Groq AI adapter without chatbot or prompt engineering assumptions.
"""
from app.llm.client import LLMClient

__all__ = ["LLMClient"]

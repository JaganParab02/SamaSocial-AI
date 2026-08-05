"""
Prompts package initialization.
Exposes PromptLoader for externalized file-based template caching and variable substitution.
"""
from app.prompts.loader import PromptLoader

__all__ = ["PromptLoader"]

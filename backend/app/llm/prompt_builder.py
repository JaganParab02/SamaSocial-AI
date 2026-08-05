"""
PromptBuilder constructing LLM message arrays using externalized PromptLoader templates.
Never hardcodes prompt text. Reusable by Module 1 (Learning Assistant) and Module 2 (Course Planner)
by passing different template names.
"""

from typing import Any, Dict, List, Optional
from app.prompts.loader import PromptLoader
from app.core.logger import get_logger

logger = get_logger(__name__)


class PromptBuilder:
    """
    Assembles structured LLM message arrays (system + context + history + user question)
    using externalized prompt templates loaded via PromptLoader.
    """

    def __init__(self, prompt_loader: PromptLoader):
        self.prompt_loader = prompt_loader

    def build_chat_messages(
        self,
        question: str,
        context: str,
        conversation_history: str = "",
        system_template: str = "system",
        user_template: str = "learning_assistant",
    ) -> List[Dict[str, str]]:
        """
        Build the complete message array for LLM chat completion.

        Args:
            question: The user's current question.
            context: Formatted context string from ContextBuilder.
            conversation_history: Serialized prior conversation turns.
            system_template: Name of the system prompt template file (without .txt).
            user_template: Name of the user-facing prompt template file.

        Returns:
            List of message dicts ready for Groq API: [{"role": "system", ...}, {"role": "user", ...}]
        """
        # 1. Load and format system prompt
        system_text = self.prompt_loader.load_prompt_text(system_template)

        # 2. Load and format the user-facing prompt with context, history, and question
        user_text = self.prompt_loader.build_prompt(
            user_template,
            context=context,
            conversation_history=conversation_history or "No previous conversation.",
            question=question,
        )

        messages = [
            {"role": "system", "content": system_text},
            {"role": "user", "content": user_text},
        ]

        logger.debug(
            "Built chat messages: system=%d chars, user=%d chars.",
            len(system_text), len(user_text),
        )
        return messages

    def build_custom_messages(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> List[Dict[str, str]]:
        """
        Build messages from raw strings (for Module 2 or custom pipeline use).

        Args:
            system_prompt: Direct system instruction text.
            user_prompt: Direct user prompt text.

        Returns:
            Message array for LLM API.
        """
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

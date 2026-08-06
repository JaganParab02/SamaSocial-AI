"""
PromptLoader facility for reading externalized .txt template files.
Supports memory caching, hot reloading, and safe keyword variable substitution.
Never hardcode prompt strings inside application logic or route layers.
"""

import os
from typing import Dict, Any, Optional
from app.core.logger import get_logger

logger = get_logger(__name__)


class PromptLoader:
    """
    Manages externalized LLM prompt templates stored in app/prompts/.
    Allows rapid instructional prompt iteration without code redeployment.
    """

    def __init__(self, prompts_dir: Optional[str] = None):
        """
        Initialize prompt template locator.
        
        Args:
            prompts_dir: Explicit path override; defaults to package local folder.
        """
        if prompts_dir:
            self.prompts_dir = prompts_dir
        else:
            # Locate folder identical to where this loader.py script lives
            self.prompts_dir = os.path.dirname(os.path.abspath(__file__))
            
        self._cache: Dict[str, str] = {}
        logger.info("PromptLoader initialized pointing to directory: %s", self.prompts_dir)

    def load_prompt_text(self, filename: str, reload: bool = False) -> str:
        """
        Read prompt template file content with in-memory caching.
        
        Args:
            filename: Name of file (with or without .txt extension, e.g. 'system' or 'system.txt').
            reload: Force disk read bypassing cached strings.
            
        Returns:
            Raw unformatted template text string.
        """
        clean_name = filename if filename.endswith(".txt") else f"{filename}.txt"
        base_name = os.path.basename(clean_name)
        
        if not reload and clean_name in self._cache:
            return self._cache[clean_name]

        candidate_paths = [
            os.path.join(self.prompts_dir, clean_name),
            os.path.join(self.prompts_dir, base_name),
            os.path.join(os.path.dirname(self.prompts_dir), "planner", "prompts", base_name),
        ]
        
        file_path = None
        for p in candidate_paths:
            if os.path.exists(p):
                file_path = p
                break

        if not file_path:
            logger.error("Prompt template file not found across candidate paths: %s", candidate_paths)
            raise FileNotFoundError(f"Missing prompt template file: {clean_name}")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
            self._cache[clean_name] = content
            logger.debug("Loaded and cached prompt template: %s", clean_name)
            return content
        except Exception as e:
            logger.error("Failed reading prompt file '%s': %s", file_path, str(e))
            raise RuntimeError(f"Prompt file read failure: {str(e)}")

    def build_prompt(self, template_name: str, reload: bool = False, **kwargs: Any) -> str:
        """
        Load template from cache or disk and execute safe keyword substitution.
        
        Args:
            template_name: Filename of target template (e.g., 'learning_assistant').
            reload: Bypass cache check.
            **kwargs: Replacement variables corresponding to {placeholder} markers in text.
            
        Returns:
            Formatted prompt string ready for LLM submission.
        """
        raw_template = self.load_prompt_text(template_name, reload=reload)
        try:
            # Use format_map with safe fallback or standard formatting
            return raw_template.format(**kwargs)
        except KeyError as e:
            logger.warning("Missing prompt parameter %s in template '%s'", str(e), template_name)
            # Return partially formatted string using dict replacement
            result = raw_template
            for k, v in kwargs.items():
                result = result.replace(f"{{{k}}}", str(v))
            return result

    def load(self, filename: str, reload: bool = False) -> str:
        """Alias for load_prompt_text to ensure compatibility across modules."""
        try:
            return self.load_prompt_text(filename, reload=reload)
        except FileNotFoundError:
            return ""

    def clear_cache(self) -> None:
        """Empty the prompt memory cache to force fresh disk reads on next call."""
        self._cache.clear()
        logger.info("PromptLoader cache cleared.")

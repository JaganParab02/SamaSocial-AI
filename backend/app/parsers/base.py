"""
Abstract BaseParser framework.
Enforces consistent polymorphic extraction interface across PDF, PPT, Web, and YouTube content.
No parser knows about vector stores, embeddings, or chat prompts.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from app.models.document import ParserResult


class BaseParser(ABC):
    """
    Abstract contract that all content document source parsers must implement.
    Ensures interoperable handling across Module 1 and Module 2 knowledge sources.
    """

    @abstractmethod
    def extract(self, source: Any, **kwargs: Any) -> ParserResult:
        """
        Extract text content and structural hierarchy (pages, slides, paragraphs, timestamps) from source.
        
        Args:
            source: File path, byte buffer, web URL, or video identifier.
            
        Returns:
            ParserResult domain model containing unified text and structural metadata.
        """
        pass

    @abstractmethod
    def metadata(self, source: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Extract high-level document properties (author, slide count, publication date, video language).
        """
        pass

    @abstractmethod
    def summary(self, text_content: str, **kwargs: Any) -> Optional[str]:
        """
        Produce or extract a quick structural summary or placeholder description.
        """
        pass

    @classmethod
    @abstractmethod
    def supported_extensions(cls) -> List[str]:
        """
        Returns list of supported file extensions or protocols (e.g. ['pdf'] or ['http', 'https']).
        """
        pass

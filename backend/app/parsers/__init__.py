"""
Parsers package initialization.
Exposes modular content extraction parsers inheriting from BaseParser.
"""
from app.parsers.base import BaseParser
from app.parsers.pdf_parser import PDFParser
from app.parsers.ppt_parser import PPTParser
from app.parsers.web_parser import WebParser
from app.parsers.youtube_parser import YoutubeParser

__all__ = [
    "BaseParser",
    "PDFParser",
    "PPTParser",
    "WebParser",
    "YoutubeParser",
]

"""
PDFParser using PyMuPDF (fitz).
Extracts document title, page-by-page text, metadata, and image placeholders.
"""

import os
from typing import Any, Dict, List, Optional
from app.parsers.base import BaseParser
from app.models.document import ParserResult, SourceType
from app.core.logger import get_logger

logger = get_logger(__name__)

try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False
    logger.error("PyMuPDF (fitz) library is not installed.")


class PDFParser(BaseParser):
    """
    Production parser for PDF learning materials and syllabus textbooks.
    """

    def extract(self, source: str, **kwargs: Any) -> ParserResult:
        """
        Extract complete text, page numbering, title, metadata, and image references from PDF file.
        
        Args:
            source: Absolute path to uploaded PDF file on local disk or buffer.
        """
        if not HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF library required for PDF parsing is not installed.")
        if not os.path.exists(source):
            raise FileNotFoundError(f"Target PDF document path does not exist: {source}")

        logger.info("Extracting text and structure from PDF: %s", source)
        try:
            doc = fitz.open(source)
            extracted_pages: List[Dict[str, Any]] = []
            full_text = []

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text("text").strip()
                
                # Image extraction placeholder check
                image_list = page.get_images(full=True)
                images_placeholder = [
                    {"index": img_idx, "xref": img_info[0], "note": "Image extraction placeholder - binary OCR reserved for later milestones"}
                    for img_idx, img_info in enumerate(image_list)
                ]

                if page_text:
                    full_text.append(f"--- Page {page_num + 1} ---\n{page_text}")
                    extracted_pages.append({
                        "page_number": page_num + 1,
                        "text": page_text,
                        "images_placeholder": images_placeholder,
                    })

            meta = self.metadata(doc)
            title = meta.get("title") or os.path.basename(source)
            combined_text = "\n\n".join(full_text)
            doc.close()

            return ParserResult(
                source_name=title,
                source_type=SourceType.PDF,
                text_content=combined_text,
                metadata=meta,
                structured_items=extracted_pages,
                summary_placeholder=self.summary(combined_text, pages=len(extracted_pages))
            )
        except Exception as e:
            logger.error("Error extracting text from PDF '%s': %s", source, str(e))
            raise RuntimeError(f"PDF extraction failed: {str(e)}")

    def metadata(self, source: Any, **kwargs: Any) -> Dict[str, Any]:
        """Extract embedded PDF properties via PyMuPDF document meta attribute."""
        try:
            doc = source if isinstance(source, fitz.Document) else fitz.open(source)
            meta_raw = doc.metadata or {}
            processed_meta = {
                "title": meta_raw.get("title", ""),
                "author": meta_raw.get("author", ""),
                "subject": meta_raw.get("subject", ""),
                "keywords": meta_raw.get("keywords", ""),
                "creator": meta_raw.get("creator", ""),
                "page_count": len(doc),
            }
            if not isinstance(source, fitz.Document):
                doc.close()
            return {k: v for k, v in processed_meta.items() if v}
        except Exception as e:
            logger.warning("Could not parse metadata from PDF: %s", str(e))
            return {"page_count": "unknown"}

    def summary(self, text_content: str, **kwargs: Any) -> Optional[str]:
        """Returns heuristic summary representation."""
        pages = kwargs.get("pages", 1)
        word_count = len(text_content.split())
        return f"PDF Document containing ~{word_count} words across {pages} extracted pages."

    @classmethod
    def supported_extensions(cls) -> List[str]:
        return ["pdf"]

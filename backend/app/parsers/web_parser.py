"""
WebParser using requests and BeautifulSoup4.
Extracts web titles, headings, paragraphs, and main text while strictly discarding
navigation bars, footers, scripts, and styling rules.
"""

import re
from typing import Any, Dict, List, Optional
import requests
from app.parsers.base import BaseParser
from app.models.document import ParserResult, SourceType
from app.core.logger import get_logger

logger = get_logger(__name__)

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False
    logger.error("beautifulsoup4 library is not installed.")


class WebParser(BaseParser):
    """
    Parser for documentation websites and online articles.
    Cleans clutter like navigational menus and JavaScript to deliver pristine educational text.
    """

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SamaAI-Educational-Indexer/1.0"
        }

    def extract(self, source: str, **kwargs: Any) -> ParserResult:
        """
        Fetch HTML content from target URL and parse out clean educational copy.
        
        Args:
            source: HTTP or HTTPS target web URL address.
        """
        if not HAS_BS4:
            raise RuntimeError("beautifulsoup4 library is required for web page parsing.")
        if not source.startswith(("http://", "https://")):
            raise ValueError(f"Invalid web protocol URL provided: {source}")

        logger.info("Fetching web page content from: %s", source)
        try:
            response = requests.get(source, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            html_content = response.text
        except Exception as e:
            logger.error("HTTP request failed for URL '%s': %s", source, str(e))
            raise RuntimeError(f"Web scraping network error: {str(e)}")

        try:
            soup = BeautifulSoup(html_content, "html.parser")

            # 1. Strictly ignore navigation, footers, scripts, styles, forms, and advertisement blocks
            for unwanted_tag in soup(["nav", "footer", "script", "style", "form", "noscript", "iframe", "aside"]):
                unwanted_tag.decompose()

            # Remove tags containing common header/footer menu classnames
            # Collect first, then decompose — avoids invalidating child tags mid-iteration
            divs_to_remove = []
            for div in soup.find_all(["div", "section"]):
                try:
                    # Skip elements already destroyed by a parent's decompose()
                    if getattr(div, "decomposed", False):
                        continue
                    class_val = div.get("class", [])
                    class_str = " ".join(class_val).lower() if isinstance(class_val, list) else str(class_val or "").lower()
                    id_val = div.get("id", "")
                    id_str = str(id_val or "").lower()
                    if any(x in class_str or x in id_str for x in ["nav", "footer", "menu", "sidebar", "banner", "cookie"]):
                        divs_to_remove.append(div)
                except (AttributeError, TypeError):
                    # Tag was already decomposed/invalidated by a prior parent removal
                    continue
            for div in divs_to_remove:
                try:
                    if not getattr(div, "decomposed", False):
                        div.decompose()
                except Exception:
                    pass

            # 2. Extract Title
            title_tag = soup.find("title")
            h1_tag = soup.find("h1")
            doc_title = (title_tag.string.strip() if title_tag and title_tag.string else 
                         (h1_tag.text.strip() if h1_tag else source))

            # 3. Extract Headings and Paragraphs hierarchically
            structured_items = []
            text_paragraphs = []

            for elem in soup.find_all(["h1", "h2", "h3", "h4", "p", "li"]):
                text_val = elem.get_text(separator=" ", strip=True)
                # Clean redundant whitespace blocks
                text_val = re.sub(r"\s+", " ", text_val)
                if len(text_val) < 10:  # Ignore trivial link fragments or single punctuation marks
                    continue

                tag_name = elem.name.lower()
                if tag_name.startswith("h"):
                    formatted = f"\n### {text_val}\n"
                    text_paragraphs.append(formatted)
                    structured_items.append({"type": "heading", "tag": tag_name, "text": text_val})
                elif tag_name == "p":
                    text_paragraphs.append(text_val)
                    structured_items.append({"type": "paragraph", "text": text_val})
                elif tag_name == "li":
                    text_paragraphs.append(f"- {text_val}")
                    structured_items.append({"type": "list_item", "text": text_val})

            combined_text = "\n\n".join(text_paragraphs).strip()
            meta = self.metadata(soup, url=source, title=doc_title)

            return ParserResult(
                source_name=doc_title,
                source_type=SourceType.WEB,
                text_content=combined_text,
                metadata=meta,
                structured_items=structured_items,
                summary_placeholder=self.summary(combined_text, url=source)
            )
        except Exception as e:
            logger.error("Error parsing HTML structure for '%s': %s", source, str(e))
            raise RuntimeError(f"Web HTML parsing error: {str(e)}")

    def metadata(self, source: Any, **kwargs: Any) -> Dict[str, Any]:
        """Extract HTML meta descriptions and canonical properties."""
        meta = {
            "source_url": kwargs.get("url", ""),
            "title": kwargs.get("title", ""),
            "description": "",
            "og_site_name": "",
        }
        if isinstance(source, BeautifulSoup):
            desc_tag = source.find("meta", attrs={"name": "description"}) or source.find("meta", attrs={"property": "og:description"})
            if desc_tag and desc_tag.get("content"):
                meta["description"] = desc_tag["content"].strip()
            site_tag = source.find("meta", attrs={"property": "og:site_name"})
            if site_tag and site_tag.get("content"):
                meta["og_site_name"] = site_tag["content"].strip()

        return {k: v for k, v in meta.items() if v}

    def summary(self, text_content: str, **kwargs: Any) -> Optional[str]:
        word_count = len(text_content.split())
        url = kwargs.get("url", "")
        return f"Web educational article from '{url}' containing ~{word_count} words of parsed primary text."

    @classmethod
    def supported_extensions(cls) -> List[str]:
        return ["http", "https", "html"]

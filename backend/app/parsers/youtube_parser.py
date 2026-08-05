"""
YouTubeParser using youtube-transcript-api.
Extracts video transcripts with accurate timestamp interval markers, video id, and language.
Returns structured diagnostic errors when captions are disabled or private.
"""

import re
from typing import Any, Dict, List, Optional
from app.parsers.base import BaseParser
from app.models.document import ParserResult, SourceType
from app.core.logger import get_logger

logger = get_logger(__name__)

try:
    from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
    HAS_YOUTUBE_API = True
except ImportError:
    HAS_YOUTUBE_API = False
    logger.error("youtube-transcript-api library is not installed.")


class YoutubeParser(BaseParser):
    """
    Parser for YouTube educational lecture videos.
    Extracts timestamped speech transcripts for high-precision citation linking during chat and course sequencing.
    """

    @staticmethod
    def extract_video_id(url_or_id: str) -> str:
        """
        Parses raw video ID from conventional YouTube URL formats or returns raw ID string directly.
        """
        if "youtube.com" in url_or_id or "youtu.be" in url_or_id:
            regex = r"(?:https?://)?(?:www\.)?(?:youtube\.com/(?:watch\?v=|embed/)|youtu\.be/)([a-zA-Z0-9_-]{11})"
            match = re.search(regex, url_or_id)
            if match:
                return match.group(1)
            raise ValueError(f"Could not parse 11-character video ID from YouTube URL: {url_or_id}")
        if len(url_or_id) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", url_or_id):
            return url_or_id
        raise ValueError(f"Invalid YouTube identifier format provided: {url_or_id}")

    @staticmethod
    def format_timestamp(seconds_float: float) -> str:
        """Converts raw seconds to mm:ss or hh:mm:ss string representation."""
        total_sec = int(seconds_float)
        hours = total_sec // 3600
        minutes = (total_sec % 3600) // 60
        seconds = total_sec % 60
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return f"{minutes:02d}:{seconds:02d}"

    def extract(self, source: str, **kwargs: Any) -> ParserResult:
        """
        Fetch transcript with timestamps from target YouTube video ID or URL.
        
        Args:
            source: YouTube video link or 11-character ID.
            language: Preferred language code (default "en").
        """
        if not HAS_YOUTUBE_API:
            raise RuntimeError("youtube-transcript-api library is required for video transcript extraction.")

        video_id = self.extract_video_id(source)
        preferred_lang = kwargs.get("language", "en")
        logger.info("Fetching YouTube transcript for video_id='%s' in language='%s'", video_id, preferred_lang)

        try:
            if hasattr(YouTubeTranscriptApi, "get_transcript"):
                transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=[preferred_lang, "en", "en-US", "hi"])
            else:
                yt_api = YouTubeTranscriptApi()
                if hasattr(yt_api, "get_transcript"):
                    transcript_list = yt_api.get_transcript(video_id, languages=[preferred_lang, "en", "en-US", "hi"])
                elif hasattr(yt_api, "fetch"):
                    transcript_list = yt_api.fetch(video_id)
                else:
                    raise AttributeError("Could not locate get_transcript or fetch on YouTubeTranscriptApi")
        except (TranscriptsDisabled, NoTranscriptFound) as e:
            logger.warning("No accessible transcript found for video_id='%s': %s", video_id, str(e))
            raise RuntimeError(f"YouTube transcript unavailable for video '{video_id}'. Captions may be disabled or uncreated.")
        except Exception as e:
            logger.error("Error communicating with YouTube Transcript API for '%s': %s", video_id, str(e))
            raise RuntimeError(f"YouTube transcript API failure: {str(e)}")

        structured_items: List[Dict[str, Any]] = []
        full_text_lines = []

        for entry in transcript_list:
            if isinstance(entry, dict):
                text = str(entry.get("text", "")).strip()
                start_sec = float(entry.get("start", 0.0))
                duration = float(entry.get("duration", 0.0))
            else:
                text = str(getattr(entry, "text", "")).strip()
                start_sec = float(getattr(entry, "start", 0.0))
                duration = float(getattr(entry, "duration", 0.0))
            timestamp_str = self.format_timestamp(start_sec)

            if text:
                line_str = f"[{timestamp_str}] {text}"
                full_text_lines.append(line_str)
                structured_items.append({
                    "timestamp": timestamp_str,
                    "start_seconds": round(start_sec, 2),
                    "duration": round(duration, 2),
                    "text": text
                })

        combined_text = "\n".join(full_text_lines)
        # Video title placeholder as per prompt instructions (requires official Youtube Data API v3 for exact titles)
        title_placeholder = f"YouTube Video ({video_id}) - Title placeholder until metadata API integration"
        meta = self.metadata(video_id, title=title_placeholder, language=preferred_lang, segments=len(structured_items))

        return ParserResult(
            source_name=title_placeholder,
            source_type=SourceType.YOUTUBE,
            text_content=combined_text,
            metadata=meta,
            structured_items=structured_items,
            summary_placeholder=self.summary(combined_text, video_id=video_id)
        )

    def metadata(self, source: Any, **kwargs: Any) -> Dict[str, Any]:
        """Extract video parameters and transcript segment density."""
        return {
            "video_id": str(source),
            "video_title_placeholder": kwargs.get("title", "YouTube Video Title Placeholder"),
            "language": kwargs.get("language", "en"),
            "transcript_segments_count": kwargs.get("segments", 0),
            "url": f"https://www.youtube.com/watch?v={source}",
        }

    def summary(self, text_content: str, **kwargs: Any) -> Optional[str]:
        video_id = kwargs.get("video_id", "unknown")
        word_count = len(text_content.split())
        return f"YouTube educational lecture transcript (ID: {video_id}) with ~{word_count} transcribed words and timestamp markers."

    @classmethod
    def supported_extensions(cls) -> List[str]:
        return ["youtube", "youtu.be", "yt"]

"""
Reusable Supabase Database Client.
Singleton instance initialized cleanly without executing CRUD operations in Milestone 2.
"""

from typing import Any, Dict, Optional
from app.core.logger import get_logger

logger = get_logger(__name__)

try:
    from supabase import create_client, Client as SupabaseLibraryClient
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    logger.warning("supabase-py SDK not found. SupabaseClient will operate in fallback mode.")


class SupabaseClient:
    """
    Singleton connection manager for Supabase.
    No CRUD logic exists in this milestone; future modules can utilize this connection directly.
    """
    _instance: Optional["SupabaseClient"] = None
    client: Any = None

    def __new__(cls, *args, **kwargs):
        """Enforce singleton initialization across the backend core."""
        if not cls._instance:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
        return cls._instance

    def __init__(self, url: str, key: str):
        """
        Initialize Supabase connection once.
        
        Args:
            url: Supabase project API endpoint URL
            key: Service role or Anon authentication key
        """
        if getattr(self, "initialized", False):
            return

        self.url = url
        self.key = key
        self.initialized = True
        self._setup_client()

    def _setup_client(self) -> None:
        """Constructs underlying Supabase connection client."""
        if not HAS_SUPABASE:
            logger.warning("Supabase SDK uninstalled; skipping network connection initialization.")
            return
        if not self.url or "placeholder" in self.url.lower():
            logger.warning("Supabase URL is unconfigured or using placeholder value.")
            return

        try:
            self.client: Optional[SupabaseLibraryClient] = create_client(self.url, self.key)
            logger.info("Supabase DB client connection initialized successfully.")
        except Exception as e:
            logger.error("Failed initializing Supabase client connection: %s", str(e))
            self.client = None

    def get_client(self) -> Any:
        """Returns active Supabase SDK client instance."""
        return self.client

    def health(self) -> Dict[str, Any]:
        """
        Diagnose health and network readiness of Supabase connection.
        """
        if not HAS_SUPABASE:
            return {
                "component": "SupabaseClient",
                "status": "unhealthy",
                "message": "supabase python library is not installed.",
            }
        if not self.client or "placeholder" in self.url.lower():
            return {
                "component": "SupabaseClient",
                "status": "degraded",
                "message": "Supabase connection initialized in offline placeholder/mock mode.",
            }

        return {
            "component": "SupabaseClient",
            "status": "healthy",
            "message": "Supabase client connection verified.",
            "details": {"url": self.url},
        }

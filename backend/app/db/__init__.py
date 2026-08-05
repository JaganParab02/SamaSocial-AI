"""
Database package initialization.
Exposes reusable Supabase database connection singleton.
"""
from app.db.supabase import SupabaseClient

__all__ = ["SupabaseClient"]

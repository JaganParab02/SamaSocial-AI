"""
API routers initialization.
Exposes modular route handler blueprints for document ingestion and system health.
"""
from app.api.health import router as health_router
from app.api.upload import router as upload_router
from app.api.sources import router as sources_router
from app.api.chat import router as chat_router
from app.api.planner import router as planner_router

__all__ = [
    "health_router",
    "upload_router",
    "sources_router",
    "chat_router",
    "planner_router"
]

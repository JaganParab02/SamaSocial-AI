"""
FastAPI application main entry point for SamaSocial AI Backend Core.
Configures CORS middleware, registers modular API routers, and initializes AI connection singletons.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.logger import get_logger
from app.core.dependencies import (
    get_embedding_service,
    get_vectordb_service,
    get_llm_client,
    get_supabase_client,
)
from app.api import upload_router, sources_router, health_router, chat_router, planner_router
from app.models.api import ErrorResponse

logger = get_logger("SamaAI.Main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown event handler.
    Pre-warms local Sentence-Transformers embedding weights and confirms vector DB connection.
    """
    logger.info("==================================================")
    logger.info("Starting SamaSocial AI Backend Core Initialization")
    logger.info("==================================================")
    
    # Pre-load embedding model once into memory
    emb = get_embedding_service()
    logger.info("Pre-warmed Embedding Service (Dimension: %d)", emb.dimension)
    
    # Initialize Qdrant and verify target collection
    vdb = get_vectordb_service()
    logger.info("Initialized Qdrant Vector Store connection.")

    # Initialize LLM & Supabase adapters
    get_llm_client()
    get_supabase_client()
    
    logger.info("AI Backend Core Initialization complete and ready for request traffic.")
    yield
    logger.info("Shutting down SamaSocial AI Backend Core server...")


def create_app() -> FastAPI:
    """
    Constructs and configures the FastAPI web application instance.
    """
    settings = get_settings()
    app = FastAPI(
        title="SamaSocial AI Platform",
        version="1.1.0",
        description="Unified backend supporting both Task 1 (Learning Assistant) and Task 2 (Course Planner).",
        lifespan=lifespan,
    )

    # Attach comprehensive CORS middleware for frontend UI connectivity
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # In production, restrict to specific domains (e.g. ['https://example.com'])
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Mount modular route handler packages
    app.include_router(upload_router, prefix="/api/v1")
    app.include_router(sources_router, prefix="/api/v1")
    app.include_router(chat_router, prefix="/api/v1")
    app.include_router(planner_router, prefix="/api/v1")
    app.include_router(health_router)

    # Global fallback exception handler to prevent unhandled crashes
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                status_code=500,
                error="Internal Server Error",
                message="An unexpected error occurred. Please try again later."
            ).model_dump()
        )

    # Global validation exception handler for clean Pydantic errors
    from fastapi.exceptions import RequestValidationError
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.warning(f"Payload Validation Error: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(
                status_code=422,
                error="Unprocessable Entity",
                message=f"Validation failed: {str(exc.errors())}"
            ).model_dump()
        )

    return app


app = create_app()

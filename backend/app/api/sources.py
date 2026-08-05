"""
Sources and Documents management API endpoints.
Enables listing indexed knowledge resources and deleting sources along with their Qdrant vectors.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.models.api import SourceResponse
from app.services.document_service import DocumentService
from app.core.dependencies import get_document_service

router = APIRouter(tags=["Source Management"])


@router.get("/sources", response_model=List[SourceResponse], status_code=200)
async def list_sources(
    session_id: Optional[str] = Query(None, description="Filter sources by specific session ID"),
    doc_service: DocumentService = Depends(get_document_service)
):
    """
    Retrieve registry list of all uploaded knowledge sources currently tracked by the AI backend core.
    """
    sources_raw = doc_service.list_sources(session_id=session_id)
    # Convert raw registry dictionaries to validated Pydantic models
    return [SourceResponse(**s) for s in sources_raw]


@router.delete("/sources/{source_id}", status_code=200)
async def delete_source(
    source_id: str,
    doc_service: DocumentService = Depends(get_document_service)
):
    """
    Remove an uploaded source document from the active registry and delete all associated vector embeddings from Qdrant.
    """
    return doc_service.delete_source_and_vectors(source_id=source_id)


@router.get("/documents/{document_id}", status_code=200)
async def get_document(
    document_id: str,
    doc_service: DocumentService = Depends(get_document_service)
):
    """
    Retrieve detailed metadata and processing diagnostics for an indexed document ID.
    """
    return doc_service.get_source_details(source_id=document_id)

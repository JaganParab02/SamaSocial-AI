"""
Upload API endpoints for document and web link ingestion.
Route handlers remain thin — strictly validating schemas and delegating execution to DocumentService.
"""

from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from app.models.document import UploadResult
from app.models.api import UrlUploadRequest, YoutubeUploadRequest
from app.services.document_service import DocumentService
from app.core.dependencies import get_document_service
from app.core.logger import get_logger

logger = get_logger("UploadAPI")

router = APIRouter(prefix="/upload", tags=["Document Ingestion"])


@router.post("/file", response_model=UploadResult, status_code=200)
async def upload_file(
    file: UploadFile = File(..., description="Binary document (.pdf, .ppt, .pptx) to ingest and index"),
    session_id: Optional[str] = Form(None, description="Optional conversational session ID"),
    doc_service: DocumentService = Depends(get_document_service)
):
    """
    Process, parse, chunk, generate embeddings for, and index a PDF or PowerPoint document into Qdrant.
    """
    
    # 1. Input Validation: Check supported MIME types
    allowed_types = [
        "application/pdf", 
        "application/vnd.ms-powerpoint", 
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ]
    if file.content_type not in allowed_types and not file.filename.endswith(('.pdf', '.ppt', '.pptx')):
        logger.warning(f"Unsupported file format attempted: {file.filename}")
        raise HTTPException(status_code=415, detail="Unsupported file format. Only PDF and PPT/PPTX are allowed.")
    
    return await doc_service.process_file_upload(file=file, session_id=session_id)


@router.post("/url", response_model=UploadResult, status_code=200)
async def upload_url(
    request: UrlUploadRequest,
    doc_service: DocumentService = Depends(get_document_service)
):
    """
    Fetch, clean, chunk, embed, and index an educational website article into Qdrant vector storage.
    """
    return doc_service.process_url_upload(url=request.url, session_id=request.session_id)


@router.post("/youtube", response_model=UploadResult, status_code=200)
async def upload_youtube(
    request: YoutubeUploadRequest,
    doc_service: DocumentService = Depends(get_document_service)
):
    """
    Extract timestamped transcripts from a YouTube lecture video and index segments into Qdrant storage.
    """
    if "youtube.com" not in request.url_or_video_id and "youtu.be" not in request.url_or_video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL. Must contain youtube.com or youtu.be")

    return doc_service.process_youtube_upload(
        url_or_id=request.url_or_video_id,
        language=request.language,
        session_id=request.session_id
    )

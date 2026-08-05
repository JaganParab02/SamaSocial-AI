"""
DocumentService containing high-level document processing and source lifecycle logic.
Acts as clean orchestration boundary between thin FastAPI route handlers and underlying pipelines/vector DBs.
"""

import os
import shutil
import tempfile
from typing import Any, Dict, List, Optional
from fastapi import UploadFile, HTTPException
from app.models.document import SourceType, UploadResult
from app.rag.document_pipeline import DocumentPipeline
from app.services.source_service import SourceService
from app.vectordb.service import VectorStoreService
from app.core.config import get_settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class DocumentService:
    """
    Business service layer managing document uploads, validation, indexing pipeline execution, and deletions.
    Routes delegate all logic here without accessing database or parser APIs directly.
    """

    def __init__(
        self,
        pipeline: DocumentPipeline,
        source_service: SourceService,
        vectordb: VectorStoreService,
    ):
        self.pipeline = pipeline
        self.source_service = source_service
        self.vectordb = vectordb
        self.settings = get_settings()

    async def process_file_upload(self, file: UploadFile, session_id: Optional[str] = None) -> UploadResult:
        """
        Validate and index an uploaded binary file (.pdf, .ppt, .pptx).
        
        Args:
            file: FastAPI UploadFile object.
            session_id: Optional conversational session assignment.
            
        Returns:
            UploadResult confirming successful ingestion and vector storage.
        """
        filename = file.filename or "unnamed_document"
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        # 1. Validate extension against supported list in centralized config
        supported = self.settings.SUPPORTED_FILE_TYPES
        if ext not in supported and f".{ext}" not in supported:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '{ext}'. Supported formats: {', '.join(supported)}"
            )

        # 2. Map extension to formal SourceType
        source_type = SourceType.PDF if ext == "pdf" else SourceType.PPT

        # 3. Save file temporarily to disk to allow PyMuPDF/pptx parsing
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, f"sama_upload_{filename}")

        try:
            content_bytes = await file.read()
            if len(content_bytes) > self.settings.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"Uploaded file exceeds maximum allowed limit of {self.settings.MAX_FILE_SIZE // 1048576} MB."
                )

            with open(temp_file_path, "wb") as f_out:
                f_out.write(content_bytes)
            
            logger.info("Saved temporary upload file to: %s (Size: %d bytes)", temp_file_path, len(content_bytes))

            # 4. Invoke multi-source document ingestion pipeline
            result = self.pipeline.process_and_index(
                source=temp_file_path,
                source_type=source_type,
                source_name=filename,
                session_id=session_id
            )
            return result

        except HTTPException:
            raise
        except Exception as e:
            logger.error("File upload processing failed for '%s': %s", filename, str(e))
            raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")
        finally:
            # Clean up temporary disk resource
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.debug("Cleaned up temporary upload file: %s", temp_file_path)
                except Exception as ex:
                    logger.warning("Failed to remove temporary upload file: %s", str(ex))

    def process_url_upload(self, url: str, session_id: Optional[str] = None) -> UploadResult:
        """
        Fetch, parse, chunk, embed, and index an online documentation webpage.
        """
        if not url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

        try:
            return self.pipeline.process_and_index(
                source=url,
                source_type=SourceType.WEB,
                source_name=url,
                session_id=session_id
            )
        except Exception as e:
            logger.error("URL processing failed for '%s': %s", url, str(e))
            raise HTTPException(status_code=422, detail=f"Failed to process web URL: {str(e)}")

    def process_youtube_upload(self, url_or_id: str, language: str = "en", session_id: Optional[str] = None) -> UploadResult:
        """
        Extract timestamped video transcripts from YouTube and index into Qdrant vector database.
        """
        try:
            return self.pipeline.process_and_index(
                source=url_or_id,
                source_type=SourceType.YOUTUBE,
                source_name=url_or_id,
                session_id=session_id,
                language=language
            )
        except Exception as e:
            logger.error("YouTube transcript indexing failed for '%s': %s", url_or_id, str(e))
            raise HTTPException(status_code=422, detail=f"Failed to process YouTube transcript: {str(e)}")

    def list_sources(self, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return all indexed sources registered in the platform."""
        return self.source_service.list_sources(session_id=session_id)

    def get_source_details(self, source_id: str) -> Dict[str, Any]:
        """Retrieve detailed diagnostic info for a specific source ID."""
        record = self.source_service.get_source(source_id)
        if not record:
            raise HTTPException(status_code=404, detail=f"Source ID '{source_id}' not found in registry.")
        return record

    def delete_source_and_vectors(self, source_id: str) -> Dict[str, str]:
        """
        Delete a knowledge source and simultaneously erase its associated vector points from Qdrant.
        """
        record = self.source_service.get_source(source_id)
        if not record:
            raise HTTPException(status_code=404, detail=f"Source ID '{source_id}' not found in registry.")

        # Delete vectors from Qdrant storage
        vectors_deleted = self.vectordb.delete_vectors(source_id)
        # Remove from source registry
        registry_deleted = self.source_service.delete_source(source_id)

        if not registry_deleted:
            raise HTTPException(status_code=500, detail="Failed to remove source from active registry.")

        return {
            "source_id": source_id,
            "status": "deleted",
            "message": f"Successfully removed source and purged {'all' if vectors_deleted else '0'} linked vectors from Qdrant."
        }

    def delete_session_data(self, session_id: str) -> Dict[str, Any]:
        """
        Delete ALL sources, vectors, and registry entries for a given session.
        Called when creating a new session to ensure a clean slate.
        """
        # 1. Delete all vectors in Qdrant belonging to this session
        vectors_deleted = self.vectordb.delete_session_vectors(session_id)

        # 2. Remove all source registry entries for this session
        deleted_source_ids = self.source_service.delete_sources_by_session(session_id)

        logger.info(
            "Session cleanup complete for '%s': %d sources removed, vectors_purged=%s.",
            session_id, len(deleted_source_ids), vectors_deleted
        )

        return {
            "session_id": session_id,
            "sources_deleted": len(deleted_source_ids),
            "vectors_purged": vectors_deleted,
            "status": "cleaned",
        }


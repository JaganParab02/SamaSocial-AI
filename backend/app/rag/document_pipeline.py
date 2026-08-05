"""
DocumentPipeline entry point for knowledge source ingestion and indexing.
Orchestrates: Source detection -> Parser execution -> Chunking -> Embedding generation -> Qdrant indexing -> Registry update.
Contains zero chatbot or vector retrieval logic.
"""

import time
import uuid
from typing import Any, Optional
from app.models.document import (
    SourceType,
    SourceMetadata,
    ParsedDocument,
    UploadResult,
)
from app.parsers.pdf_parser import PDFParser
from app.parsers.ppt_parser import PPTParser
from app.parsers.web_parser import WebParser
from app.parsers.youtube_parser import YoutubeParser
from app.rag.chunk_service import ChunkService
from app.embeddings.service import EmbeddingService
from app.vectordb.service import VectorStoreService
from app.core.logger import get_logger

logger = get_logger(__name__)


class DocumentPipeline:
    """
    Unified end-to-end knowledge ingestion engine.
    Fully decoupled from frontend chatbots or prompts; output vector structures are freely reusable
    by Learning Assistant (Module 1) and Course Planner (Module 2).
    """

    def __init__(
        self,
        chunk_service: ChunkService,
        embedding_service: EmbeddingService,
        vectordb_service: VectorStoreService,
        source_service: Any, # SourceService injected
    ):
        self.chunk_service = chunk_service
        self.embedding_service = embedding_service
        self.vectordb = vectordb_service
        self.source_service = source_service
        
        # Instantiate parsers once
        self.parsers = {
            SourceType.PDF: PDFParser(),
            SourceType.PPT: PPTParser(),
            SourceType.WEB: WebParser(),
            SourceType.YOUTUBE: YoutubeParser(),
        }

    def process_and_index(
        self,
        source: Any,
        source_type: SourceType,
        source_name: str,
        session_id: Optional[str] = None,
        **parser_kwargs: Any,
    ) -> UploadResult:
        """
        Execute complete multi-step indexing workflow for an incoming document or link.
        
        Args:
            source: File path on disk, target web URL, or YouTube identifier.
            source_type: Enum classification of source document type.
            source_name: Human readable title or original file name.
            session_id: Optional conversational session scope owner.
            
        Returns:
            UploadResult confirming indexing completion and metrics.
        """
        start_time = time.time()
        source_id = str(uuid.uuid4())
        logger.info(
            "Starting DocumentPipeline execution for '%s' (Type=%s, ID=%s)",
            source_name, source_type, source_id
        )

        # Register tentative ingestion in Source Registry
        self.source_service.register_source(
            source_id=source_id,
            name=source_name,
            source_type=source_type,
            session_id=session_id,
            status="processing",
            metadata={"raw_source_target": str(source)},
        )

        try:
            # 1. Select appropriate parser
            parser = self.parsers.get(source_type)
            if not parser:
                raise ValueError(f"No parser implementation available for source type: {source_type}")

            # 2. Extract structured text and document hierarchy
            logger.debug("Step 1/5: Running extraction parser for '%s'...", source_name)
            parser_result = parser.extract(source, **parser_kwargs)

            # Build formal ParsedDocument intermediate representation
            source_meta = SourceMetadata(
                source_id=source_id,
                session_id=session_id,
                source_name=parser_result.source_name or source_name,
                source_type=source_type,
                additional_info=parser_result.metadata,
            )
            parsed_doc = ParsedDocument(
                metadata=source_meta,
                content=parser_result.text_content,
                structured_items=parser_result.structured_items,
                summary=parser_result.summary_placeholder,
            )

            # 3. Chunk extracted text with granular metadata tagging
            logger.debug("Step 2/5: Chunking extracted document content...")
            chunk_result = self.chunk_service.chunk_document(parsed_doc)
            chunks = chunk_result.chunks

            if not chunks:
                logger.warning("No extractable text chunks produced for document '%s'.", source_name)

            # 4. Generate dense embeddings for chunks
            logger.debug("Step 3/5: Generating %d embeddings via EmbeddingService...", len(chunks))
            chunk_texts = [c.chunk_text for c in chunks]
            embeddings = self.embedding_service.embed_batch(chunk_texts)

            # 5. Store vectors and payload metadata into Qdrant collection
            logger.debug("Step 4/5: Upserting vectors into Qdrant vector database...")
            vectors_stored = self.vectordb.upsert_vectors(chunks, embeddings)

            total_duration_ms = round((time.time() - start_time) * 1000.0, 2)

            # Update registry status to ready
            self.source_service.update_status(
                source_id=source_id,
                status="ready",
                processing_time_ms=total_duration_ms,
                metadata={
                    "chunks_count": len(chunks),
                    "vectors_stored": vectors_stored,
                    "summary": parsed_doc.summary,
                    "structured_items_count": len(parsed_doc.structured_items),
                },
            )

            logger.info("Successfully indexed document '%s' in %d ms.", source_id, total_duration_ms)

            return UploadResult(
                success=True,
                document_id=source_id,
                source_name=parsed_doc.metadata.source_name,
                source_type=source_type,
                chunks_count=len(chunks),
                vectors_stored=vectors_stored,
                summary=parsed_doc.summary,
                message="Document extracted, chunked, embedded, and indexed successfully.",
            )

        except Exception as e:
            error_duration = round((time.time() - start_time) * 1000.0, 2)
            logger.error("DocumentPipeline failed for source '%s': %s", source_name, str(e))
            self.source_service.update_status(
                source_id=source_id,
                status="failed",
                processing_time_ms=error_duration,
                metadata={"error": str(e)},
            )
            raise RuntimeError(f"Document processing pipeline failure: {str(e)}")

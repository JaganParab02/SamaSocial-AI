# KNOWN ISSUES & TECHNICAL DEBT

> Last Updated: 2026-08-04

This document highlights intentional architectural trade-offs, system constraints, and technical debt maintained for evaluation simplicity.

---

## 1. Synchronous Document Extraction (Technical Debt)
- **Constraint**: When ingesting PDF manuals or PowerPoint slides via `/api/v1/upload/file`, text extraction and dense chunk embedding execute synchronously within the calling HTTP Uvicorn request worker.
- **Impact**: Uploading massive documents (>50MB or 500+ pages) blocks the worker thread until completion, potentially causing client HTTP read timeouts under heavy concurrent loads.
- **Resolution Path**: In true multi-tenant production deployments, `DocumentPipeline` should dispatch ingestion jobs to an asynchronous worker queue (such as Celery or Arq backed by Redis), immediately returning an `HTTP 202 Accepted` job task link to the frontend for UI polling.

## 2. In-Memory Session Persistence
- **Constraint**: `SessionManager` and `SourceService` maintain conversational memory buffers and active source registries inside thread-safe local Python RAM dictionaries.
- **Impact**: Restarting the backend FastAPI application purges historical conversational transcripts and registered session metadata (though underlying vectors persist securely inside Qdrant).
- **Resolution Path**: Connect the service persistence layer directly to a centralized Redis cluster or relational PostgreSQL table (using our included Supabase connection adapter) without altering domain functional signatures.

## 3. Local Dense Embeddings CPU Consumption
- **Constraint**: Dense vector generation occurs natively using local CPU computation via `SentenceTransformers` (`all-MiniLM-L6-v2`, 384 dimensions).
- **Impact**: Prevents third-party embedding API billing costs during development, but increases container initialization times and baseline CPU consumption during ingestion.
- **Resolution Path**: Delegate vector generation to dedicated external API endpoints (such as OpenAI `text-embedding-3-small` or Cohere Embed) via configuration flags.

## 4. YouTube Transcript Auto-Caption Dependency
- **Constraint**: `YoutubeParser` utilizes `youtube-transcript-api` to retrieve time-stamped video lecture subtitles.
- **Impact**: If a video creator explicitly disables auto-generated English captions or blocks embedding embedding access, the ingestion endpoint cleanly catches the failure and returns an appropriate `HTTP 400` error to the UI.

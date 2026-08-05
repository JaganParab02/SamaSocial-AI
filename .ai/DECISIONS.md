# ARCHITECTURAL DECISION RECORDS (ADRs)

> Last Updated: 2026-08-04

---

## Index

- [ADR 001: Separation of Ingestion from Retrieval/Chat (Milestone 2)](#adr-001)
- [ADR 002: Polymorphic Content Parser Framework](#adr-002)
- [ADR 003: Singleton Resource Lifecycle Management](#adr-003)
- [ADR 004: Extensible Session Metadata Structure](#adr-004)
- [ADR 005: Local Sentence-Transformers vs Remote Embedding APIs](#adr-005)

---

<a id="adr-001"></a>

## ADR 001: Separation of Ingestion from Retrieval/Chat (Milestone 2)

**Date**: 2026-08-04  
**Status**: Accepted  
**Context**: Milestone 2 builds the core AI backend. The prompt explicitly required that while the backend must ingest, parse, chunk, embed, and store vectors in Qdrant, it must NOT yet answer questions, retrieve vectors, build prompts into LLMs, or implement chatbot streaming.  
**Decision**: We designed a strict architectural boundary where `DocumentPipeline`, `ChunkService`, and all parsers have zero dependence on retrieval or chat engines. `VectorStoreService` implements `upsert_vectors` and raises `NotImplementedError` with helpful placeholder documentation for `search_by_metadata` (to be activated in Milestone 3).  
**Consequences**: Ensures Module 1 (Learning Assistant) and Module 2 (Course Planner) can freely reuse the indexing pipeline and vector repository without inheriting unwanted conversational chat mechanics or hardcoded prompt assumptions.

---

<a id="adr-002"></a>

## ADR 002: Polymorphic Content Parser Framework

**Date**: 2026-08-04  
**Status**: Accepted  
**Context**: We must ingest PDFs, PowerPoint slides, educational web URLs, and timestamped YouTube video lectures into a uniform vector space.  
**Decision**: Created an abstract `BaseParser` class defining `extract(source)`, `metadata(source)`, and `summary(text)`. Every format parser (`PDFParser`, `PPTParser`, `WebParser`, `YoutubeParser`) returns an identical Pydantic domain object (`ParserResult`).  
**Consequences**: The ingestion engine (`DocumentPipeline`) remains format-agnostic. New content formats (e.g., Markdown or Word files) can be added simply by subclassing `BaseParser`.

---

<a id="adr-003"></a>

## ADR 003: Singleton Resource Lifecycle Management

**Date**: 2026-08-04  
**Status**: Accepted  
**Context**: Loading local transformer embedding weights (`all-MiniLM-L6-v2`) and initializing database connection sockets on every HTTP request degrades server throughput and causes memory exhaustion.  
**Decision**: Applied a strictly scoped dependency injection pattern (`app/core/dependencies.py`) using lazy-loaded Python singletons for `EmbeddingService`, `VectorStoreService`, `SupabaseClient`, and `LLMClient`. Pre-warmed embeddings inside FastAPI's `@asynccontextmanager lifespan` handler.  
**Consequences**: Extremely stable server execution with minimal memory footprint and zero cold-start embedding lag during request processing.

---

<a id="adr-004"></a>

## ADR 004: Extensible Session Metadata Structure

**Date**: 2026-08-04  
**Status**: Accepted  
**Context**: Module 1 needs user dialogue messages and uploaded file citations, whereas Module 2 requires syllabus analysis states and week-by-week study course structures.  
**Decision**: In `SessionManager`, our `Session` Pydantic model defines dedicated extensible dictionary fields: `metadata: Dict[str, Any]`, `uploaded_sources: List[str]`, `planner_state: Dict[str, Any]`, and `course_plan: Optional[Dict[str, Any]]`.  
**Consequences**: Eliminates database schema lock-in between modules. Both tasks operate over the identical session management layer without conflicting schema migrations.

---

<a id="adr-005"></a>

## ADR 005: Local Sentence-Transformers vs Remote Embedding APIs

**Date**: 2026-08-04  
**Status**: Accepted  
**Context**: Need fast, standardized vector representations of educational text chunks for Qdrant similarity searches.  
**Decision**: Chose local `sentence-transformers/all-MiniLM-L6-v2` producing 384-dimensional dense embeddings rather than cloud-based OpenAI embedding endpoints.  
**Consequences**: Eliminates API token costs for vector generation, guarantees low network latency during large document chunking, and keeps vector dimension compact for rapid Qdrant search filtering.

# FILE PURPOSES

> Last Updated: 2026-08-04

---

## Reusable AI Backend Core Source Tree

```
backend/
├── Dockerfile                   # Multi-stage container definition for backend server deployment
├── docker-compose.yml           # Local development service coordination with Qdrant container
├── requirements.txt             # Production and testing Python dependency locks
├── .env.example                 # Standardized template of all supported system environment parameters
├── app/
│   ├── __init__.py              # Application root package marker
│   ├── main.py                  # FastAPI server initialization, CORS setup, router mounting, and lifespan pre-warming
│   ├── core/
│   │   ├── config.py            # Centralized Pydantic settings loading env values without hardcoded defaults
│   │   ├── logger.py            # Colored terminal output and file rotating custom structured logging engine
│   │   └── dependencies.py      # Dependency injection container factories managing AI and DB singletons
│   ├── models/
│   │   ├── document.py          # Unified Pydantic domain models for chunks, parsers, and source representations
│   │   ├── session.py           # Extensible Session and message models shared by Module 1 & Module 2
│   │   ├── api.py               # API request payload schemas and standard error response definitions
│   │   └── chat.py              # API models for chat requests, responses, streaming, and citations
│   ├── llm/
│   │   ├── client.py            # Reusable Groq API adapter with retry logic, generating, and streaming
│   │   ├── prompt_builder.py    # Dynamic assembler of LLM message arrays using PromptLoader
│   │   └── streaming_service.py # SSE event generator wrapper for streaming tokens and citations
│   ├── embeddings/
│   │   └── service.py           # Sentence-Transformers local embedding model wrapper producing 384-d vectors
│   ├── vectordb/
│   │   └── service.py           # Qdrant vector database adapter managing collection schemas and payloads
│   ├── db/
│   │   └── supabase.py          # Relational database client adapter connection pool without assumptions
│   ├── parsers/
│   │   ├── base.py              # Abstract polymorphic extraction contract (extract, metadata, summary)
│   │   ├── pdf_parser.py        # PyMuPDF PDF page text extractor with image extraction placeholders
│   │   ├── ppt_parser.py        # python-pptx presentation slide text and speaker notes placeholder extractor
│   │   ├── web_parser.py        # BeautifulSoup4 online article text extractor stripping navigational UI noise
│   │   └── youtube_parser.py    # youtube-transcript-api lecture transcriber with timestamp intervals
│   ├── rag/
│   │   ├── chunk_service.py     # Langchain RecursiveCharacterTextSplitter enriching chunks with metadata
│   │   ├── document_pipeline.py # Unified document workflow orchestrating parsers, chunker, embeddings, and Qdrant
│   │   ├── retriever.py         # Vector similarity search orchestrator with session and source filtering
│   │   ├── context_builder.py   # Token-budgeted deduplication of retrieved chunks for prompt injection
│   │   └── citation_builder.py  # Maps retrieval payload metadata into formatted structured citations
│   ├── chat/
│   │   ├── session_manager.py   # State tracking repository supporting source attachments and planner states
│   │   ├── memory_service.py    # Conversational memory buffer enforcing sliding window history truncation
│   │   ├── chat_pipeline.py     # Central RAG orchestrator connecting memory, retrieval, LLM, and citations
│   │   ├── chat_service.py      # Thin business layer delegating requests to ChatPipeline and managing sessions
│   │   └── conversation_manager.py # Higher level conversation lifecycle management
│   ├── prompts/
│   │   ├── loader.py            # Dynamic prompt file loader with memory caching and keyword substitution
│   │   ├── system.txt           # Foundational educational behavior instructions for NavGurukul learning assistant
│   │   ├── learning_assistant.txt # Template formatted for grounded RAG answer extraction with citation instruction
│   │   └── course_planner.txt   # Template structured for generating Module 2 week-by-week study JSON paths
│   ├── services/
│   │   ├── document_service.py  # High-level validation, upload lifecycle, and vector deletion business logic
│   │   └── source_service.py    # In-memory registry tracking ingested knowledge source status and durations
│   └── api/
│       ├── upload.py            # Thin FastAPI route handlers for file, web, and YouTube ingestion POST endpoints
│       ├── sources.py           # Route handlers for listing sources and deleting documents with their vectors
│       ├── health.py            # Comprehensive system health check endpoints for all 5 core infrastructure engines
│       └── chat.py              # Chat endpoints supporting synchronous, streaming SSE, and history operations
└── tests/
    ├── __init__.py              # Tests package marker
    └── test_smoke.py            # Comprehensive unit and integration smoke tests without network credentials
```

# ARCHITECTURE

> Last Updated: 2026-08-04

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                               CLIENT LAYER                               │
│  React + Vite SPA (Chat UI, File Upload, Quiz & Course Planner Widgets)  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTP REST / Server-Sent Events (SSE)
┌────────────────────────────────────▼─────────────────────────────────────┘
│                              API LAYER (Routes)                          │
│        FastAPI Routers: /upload/* | /sources/* | /health/* | /chat/*     │
│             (Thin Handlers, Schema Validation via Pydantic)              │
└───────────────┬────────────────────┬─────────────────────┬───────────────┘
                │                    │                     │
┌───────────────▼─────────┐ ┌────────▼─────────┐ ┌─────────▼───────────────┐
│     DocumentService     │ │   SourceService   │ │      ChatService       │
│  (Uploads & Lifecycle)  │ │ (Source Registry)│ │ (Reserved: Milestone 3) │
└───────────────┬─────────┘ └────────┬─────────┘ └─────────┬───────────────┘
                │                    │                     │
┌───────────────▼────────────────────┴─────────────────────▼───────────────┐
│                      RAG INGESTION & PIPELINE LAYER                      │
│                                                                          │
│  ┌───────────────────┐     ┌──────────────────┐     ┌─────────────────┐  │
│  │ DocumentPipeline  │────▶│   ChunkService   │────▶│ VectorStoreSvc  │  │
│  └─────────┬─────────┘     └────────┬─────────┘     └────────┬────────┘  │
│            │                        │                        │           │
│            ▼                        ▼                        ▼           │
│  ┌───────────────────┐     ┌──────────────────┐     ┌─────────────────┐  │
│  │ Content Parsers   │     │ EmbeddingService │     │ Qdrant Client   │  │
│  │ (PDF/PPT/Web/YT)  │     │ (MiniLM-L6-v2)   │     │ (Shared DB)     │  │
│  └───────────────────┘     └──────────────────┘     └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities & Independence

1. **API Layer (Routes)**: Contains zero business logic. Strictly translates HTTP parameters and multi-part file payloads into validated Pydantic models, injecting domain services via FastAPI dependency injection.
2. **Service Layer**: Holds business logic and orchestrates pipeline steps. Neither `DocumentService` nor `SourceService` make direct SQL queries or construct raw LLM HTTP requests.
3. **Parser Layer (`BaseParser` framework)**: Completely decoupled from vector databases, embeddings, and chatbots. Parsers strictly transform raw input (PDF bytes, PPT slides, HTML text, YouTube IDs) into standard `ParserResult` domain objects.
4. **AI & Vector Storage Layer**: Singletons managing heavy resource consumption (Sentence-Transformers model weights, Qdrant client connections, Groq LLM network wrappers).

---

## Module 1 and Module 2 Reusability Strategy

This backend core intentionally serves as the engine for both modules:
- **Module 1 (Multi-Source Learning Assistant)** uses `DocumentPipeline` to ingest textbook syllabus files and lecture transcripts, later querying them via conversational RAG chat.
- **Module 2 (AI Course Planning Assistant)** reuses the **exact same** indexed Qdrant collections, source registry records, and extensible `Session` schemas (`planner_state` & `course_plan` attributes) to generate structured study roadmaps without needing separate ingestion pipelines or custom vector stores.

| Name | Layer | Purpose |
|------|-------|---------|
| `LLMClient` | 4 - Foundation | Wraps Groq SDK connection. |
| `ChatService` | 2 - Business Logic | Orchestrates standard LLM text completions and history. |
| `CoursePlannerService`| 2 - Business Logic | Handles dual LLM flows (structured JSON generation + conversational response stream). |
| `Retriever` | 2 - Business Logic | Executes similarity searches against Qdrant vector store. |
| `DocumentPipeline`| 2 - Business Logic | Chains ingestion steps (detect, parse, chunk, embed, index). |
| `SessionManager`| 3 - State Management| In-memory repository for session objects, storing chat history and Course Plan state. |

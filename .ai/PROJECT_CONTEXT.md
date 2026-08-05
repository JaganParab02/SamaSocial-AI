# PROJECT CONTEXT

> Last Updated: 2026-08-04

---

## What the Project Is

An AI-powered Learning Assistant platform built for NavGurukul. The system allows users to upload learning materials (PDFs, PPTs, websites, YouTube videos), processes them into embeddings, and provides an interactive chat interface with RAG-based answers, citations, quiz generation, and course planning.

The backend core is shared across both target modules:
- **Module 1**: Multi-Source AI Learning Assistant
- **Module 2**: AI Course Planning Assistant

---

## Business Objective

Enable self-paced, AI-assisted learning for NavGurukul students by:
- Parsing diverse content sources into structured knowledge
- Providing conversational Q&A with source citations
- Generating quizzes to test understanding
- Planning personalized learning courses

---

## Assignment Summary

### Task 1 — Learning Assistant (RAG Chat)
- Parse content from PDF, PPT, Website, YouTube (✅ Core Completed)
- Generate embeddings and store in vector database (✅ Core Completed)
- Provide streaming chat with retrieval-augmented generation (⬜ Next Milestone)
- Include citation support linking answers to source material (⬜ Next Milestone)

### Task 2 — Course Planner
- Generate structured learning paths from uploaded content (⬜ Next Milestone)
- Suggest module ordering and dependencies (⬜ Next Milestone)
- Integrate with the chat assistant for guided learning (⬜ Next Milestone)

---

## Overall Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Frontend   │────▶│   Backend    │────▶│   LLM Provider │
│   (React)    │◀────│  (FastAPI)   │◀────│   (Groq)       │
└─────────────┘     └──────┬───────┘     └────────────────┘
                           │
                    ┌──────┴───────┐
                    │   Qdrant     │
                    │ (Vector DB)  │
                    └──────────────┘
```

- **Frontend**: React + Vite — UI and user interaction
- **Backend**: FastAPI (Python 3.11) — API routes, service layer, RAG ingestion pipeline
- **Vector DB**: Qdrant — Embedding storage and similarity search
- **Relational/State DB**: Supabase — Shared database client connection
- **LLM**: Groq (llama-3.1-70b-versatile) — Fast inference for chat and generation
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2) producing 384-d vectors
- **Containerization**: Docker & Docker Compose

---

## Current Implementation Status

🟢 **Phase: Reusable AI Backend Core (Milestone 2 completed)**
- ✅ Project initialized & Docker Compose configured
- ✅ Centralized configuration, colored logger, and dependency injection
- ✅ Domain Pydantic models (Document, DocumentChunk, Session, API schemas)
- ✅ Groq LLM client, Qdrant vector store, Supabase DB client singletons
- ✅ Content Parsers: PyMuPDF, python-pptx, BeautifulSoup4, youtube-transcript-api
- ✅ RAG Ingestion Pipeline & Langchain text chunking
- ✅ Session Manager, Memory buffer, and externalized Prompt Loader
- ✅ Fully tested API upload, source registry, and system health endpoints

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for full checklist.

# SamaSocial AI Modules

A unified production-ready monorepo powering two distinct AI modules:
1. **Module 1**: Multi-Source AI Learning Assistant (Conversational RAG)
2. **Module 2**: AI Course Planning Assistant (Generative Curriculums)

This architecture utilizes a single unified AI backend for ingestion, embeddings, and chat services, preventing infrastructure duplication and reducing technical debt.

---

## 🚀 Features

### Task 1: Multi-Source Learning Assistant (Complete)
- **Multi-modal Ingestion**: Drag-and-drop PDFs, PPTs, or paste Web URLs and YouTube Links.
- **RAG Chat Pipeline**: Semantic similarity search against Qdrant combined with conversation history.
- **Real-Time Streaming**: Fetch-based Server-Sent Events (SSE) streaming for instantaneous generation.
- **Auto-Citations**: LLM claims are dynamically mapped to source documents, page numbers, and timestamps.

### Task 2: Course Planning Assistant (Complete)
- **Generative Curriculums**: LLM automatically generates week-by-week structured json learning paths.
- **Dual-LLM Execution**: Generates structured Pydantic-validated JSON in the background while simultaneously streaming a conversational explanation to the user.
- **Split-Screen Interactive UI**: Chat on the left, live JSON preview on the right.
- **Live Editability**: Users can manually modify the JSON state inline via a code editor.
- **Export**: Export final plans locally.

---

## 🏗️ Architecture Overview

The system is built on a highly modular service-oriented architecture:

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Framer Motion, TanStack Query.
- **Backend Core**: FastAPI, Uvicorn, Pydantic, Python 3.11.
- **AI Stack**: Groq (`llama-3.1-70b-versatile`), SentenceTransformers (Local CPU Embeddings).
- **Vector Database**: Qdrant (Dockerized).

> See `.ai/ARCHITECTURE.md` for a deeper breakdown of the layers (Service, Repository, Foundation).

---

## 🛠️ Setup Instructions

### 1. Docker Compose (Recommended)
The easiest way to run the entire application stack (Frontend, Backend, and Qdrant) is via Docker.

```bash
# 1. Copy the environment variables template
cp .env.example .env

# 2. Add your Groq API key inside .env
# GROQ_API_KEY=your_key_here

# 3. Spin up the entire platform
docker compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs (Swagger): `http://localhost:8000/docs`

### 2. Manual Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Run Qdrant container separately first!
# docker run -p 6333:6333 qdrant/qdrant

uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing

The backend includes a comprehensive pytest suite covering API routes, service orchestration, LLM failure modes, and schema validation edge cases.

```bash
cd backend
pytest tests/ -v
```

---

## ⚠️ Known Limitations & Future Scope
- **Synchronous Heavy Parsing**: Extremely large PDFs (1000+ pages) process synchronously in the API request cycle. Production environments should offload this to Celery/Redis.
- **YouTube Transcripts**: The `youtube-transcript-api` relies on auto-generated English captions. It will fail if captions are disabled by the creator.
- **Web Scraping**: `trafilatura` will successfully scrape standard blogs/docs, but will fail against Cloudflare anti-bot checks or Javascript-rendered SPAs.

---

*This software was authored according to strict SOLID principles and QA standards for the SamaSocial AI Assignment.*

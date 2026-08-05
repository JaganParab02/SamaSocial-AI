# ENVIRONMENT VARIABLES

> Last Updated: 2026-08-04

---

## How to Use

1. Copy `.env.example` to `.env` in the project root
2. Fill in required values
3. Docker Compose automatically loads `.env`

---

## Variables

### LLM Configuration

| Name | Purpose | Default | Example | Required? |
| ---- | ------- | ------- | ------- | --------- |
| `GROQ_API_KEY` | API key for Groq LLM provider | — | `gsk_abc123...` | ✅ Yes |
| `GROQ_MODEL` | Model to use for chat completion | `llama-3.1-70b-versatile` | `llama-3.1-70b-versatile` | No |
| `GROQ_EMBEDDING_MODEL` | Model for embeddings (if using Groq) | — | `nomic-embed-text-v1.5` | No |

### Vector Database

| Name | Purpose | Default | Example | Required? |
| ---- | ------- | ------- | ------- | --------- |
| `QDRANT_HOST` | Qdrant server hostname | `localhost` | `qdrant` (Docker) | No |
| `QDRANT_PORT` | Qdrant server port | `6333` | `6333` | No |
| `QDRANT_COLLECTION` | Default collection name | `documents` | `documents` | No |

### Backend

| Name | Purpose | Default | Example | Required? |
| ---- | ------- | ------- | ------- | --------- |
| `BACKEND_HOST` | Backend server host | `0.0.0.0` | `0.0.0.0` | No |
| `BACKEND_PORT` | Backend server port | `8000` | `8000` | No |
| `BACKEND_RELOAD` | Enable hot reload (dev only) | `true` | `true` | No |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173` | `http://localhost:5173,http://localhost:3000` | No |
| `LOG_LEVEL` | Logging level | `INFO` | `DEBUG` | No |

### Frontend

| Name | Purpose | Default | Example | Required? |
| ---- | ------- | ------- | ------- | --------- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` | `http://localhost:8000` | No |

### Embedding

| Name | Purpose | Default | Example | Required? |
| ---- | ------- | ------- | ------- | --------- |
| `EMBEDDING_MODEL` | Sentence Transformers model name | `all-MiniLM-L6-v2` | `all-MiniLM-L6-v2` | No |
| `EMBEDDING_DIMENSION` | Vector dimension size | `384` | `384` | No |

### Chunking

| Name | Purpose | Default | Example | Required? |
| ---- | ------- | ------- | ------- | --------- |
| `CHUNK_SIZE` | Max characters per chunk | `1000` | `1000` | No |
| `CHUNK_OVERLAP` | Overlap between chunks | `200` | `200` | No |

---

## Docker Compose Environment

These variables are used in `docker-compose.yml` service definitions:

```yaml
services:
  backend:
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - QDRANT_HOST=qdrant
      - QDRANT_PORT=6333

  frontend:
    environment:
      - VITE_API_URL=http://localhost:8000

  qdrant:
    # No custom env needed — uses defaults
```

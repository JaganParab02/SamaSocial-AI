# API CONTRACT

> Last Updated: 2026-08-04

---

## Base URL

`http://localhost:8000/api/v1`

---

## Implemented Endpoints (Milestone 2 Core)

### 1. File Upload Ingestion
- **Method**: `POST`
- **Path**: `/api/v1/upload/file`
- **Description**: Parses, chunks, embeds, and indexes a binary PDF or presentation (.ppt, .pptx) document into Qdrant.
- **Request (Multipart Form-Data)**:
  - `file`: Binary file item (required)
  - `session_id`: UUID string (optional)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "document_id": "8f9a2e61-6a2d-4b72-a1b5-900829cd6d10",
    "source_name": "Syllabus_Chapter_1.pdf",
    "source_type": "pdf",
    "chunks_count": 24,
    "vectors_stored": 24,
    "summary": "PDF Document containing ~4102 words across 14 extracted pages.",
    "message": "Document extracted, chunked, embedded, and indexed successfully."
  }
  ```

---

### 2. Website Article Ingestion
- **Method**: `POST`
- **Path**: `/api/v1/upload/url`
- **Description**: Scrapes HTML article, cleans navigation/footer noise, generates embeddings, and indexes content into Qdrant.
- **Request (JSON)**:
  ```json
  {
    "url": "https://docs.python.org/3/tutorial/datastructures.html",
    "session_id": "session-xyz"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "document_id": "11a56fbc-2234-4bc1-9c88-123456789abc",
    "source_name": "5. Data Structures — Python 3.11.8 documentation",
    "source_type": "web",
    "chunks_count": 18,
    "vectors_stored": 18,
    "summary": "Web educational article from 'https://docs...' containing ~2800 words of parsed primary text.",
    "message": "Document extracted, chunked, embedded, and indexed successfully."
  }
  ```

---

### 3. YouTube Video Transcript Ingestion
- **Method**: `POST`
- **Path**: `/api/v1/upload/youtube`
- **Description**: Extracts timestamped lecture captions from YouTube API, segments text, embeds, and indexes into vector storage.
- **Request (JSON)**:
  ```json
  {
    "url_or_video_id": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "language": "en",
    "session_id": "session-xyz"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "document_id": "33bcdefa-9012-4211-bb67-8899aabbccdd",
    "source_name": "YouTube Video (dQw4w9WgXcQ) - Title placeholder until metadata API integration",
    "source_type": "youtube",
    "chunks_count": 32,
    "vectors_stored": 32,
    "summary": "YouTube educational lecture transcript (ID: dQw4w9WgXcQ) with ~5420 transcribed words and timestamp markers.",
    "message": "Document extracted, chunked, embedded, and indexed successfully."
  }
  ```

---

### 4. List Indexed Sources
- **Method**: `GET`
- **Path**: `/api/v1/sources`
- **Query Params**: `?session_id=str` (optional filter)
- **Response (200 OK)**: Array of `SourceResponse` objects containing operational state and processing durations.

---

### 5. Delete Source & Purge Vectors
- **Method**: `DELETE`
- **Path**: `/api/v1/sources/{source_id}`
- **Description**: Deletes source registry entry and erases all corresponding points from Qdrant collection.
- **Response (200 OK)**:
  ```json
  {
    "source_id": "8f9a2e61-6a2d-4b72-a1b5-900829cd6d10",
    "status": "deleted",
    "message": "Successfully removed source and purged all linked vectors from Qdrant."
  }
  ```

---

### 6. Comprehensive Health Diagnostics
- **Method**: `GET`
- **Path**: `/health` (also available: `/health/llm`, `/health/qdrant`, `/health/embedding`, `/health/supabase`, `/health/parsers`)
- **Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "version": "0.2.0",
    "components": {
      "llm": {"component": "LLMClient (Groq)", "status": "healthy", "message": "Groq LLM adapter operational."},
      "embedding": {"component": "EmbeddingService (Sentence-Transformers)", "status": "healthy", "message": "Model 'all-MiniLM-L6-v2' loaded (384-d)."},
      "qdrant": {"component": "VectorStoreService (Qdrant)", "status": "healthy", "message": "Qdrant vector store connection operational."},
      "supabase": {"component": "SupabaseClient (Database)", "status": "healthy", "message": "Supabase connection adapter initialized."},
      "parsers": {"component": "Parser Engines (PDF, PPT, Web, YouTube)", "status": "healthy", "message": "All required parsing libraries are operational."}
    }
  }
  ```

---

### 7. Chat (Synchronous)
- **Method**: `POST`
- **Path**: `/api/v1/chat`
- **Description**: Submits a user question, retrieves relevant context from Qdrant, and returns the LLM's response along with citations.
- **Request (JSON)**:
  ```json
  {
    "session_id": "session-xyz",
    "question": "What are data structures?",
    "source_filter": "all",
    "top_k": 5
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "session_id": "session-xyz",
    "answer": "Data structures are ways of organizing data...",
    "citations": [
      {
        "source_name": "5. Data Structures — Python 3.11.8 documentation",
        "source_type": "web",
        "url": "https://docs.python.org/3/tutorial/datastructures.html"
      }
    ],
    "is_out_of_scope": false
  }
  ```

---

### 8. Chat (Streaming SSE)
- **Method**: `POST`
- **Path**: `/api/v1/chat/stream`
- **Description**: Same as synchronous chat but streams tokens back using Server-Sent Events (SSE).
- **Request**: Same as above.
- **Response**: SSE stream `data: {"event": "token", "data": "..."}` ending with a `citations` event and a `done` event.

---

### 9. Get Conversation History
- **Method**: `GET`
- **Path**: `/api/v1/chat/history/{session_id}`
- **Description**: Returns the conversation history for a session.

---

### 10. Clear Conversation History
- **Method**: `DELETE`
- **Path**: `/api/v1/chat/history/{session_id}`
- **Description**: Clears the conversation history for a session.

---

### 11. Reset Session
- **Method**: `POST`
- **Path**: `/api/v1/chat/reset`
- **Description**: Clears history and resets planner state, but maintains source associations.

---

## Pending Endpoints (Reserved for Milestone 4)

- `POST /api/v1/quiz/generate` — Structured multi-choice question evaluator.
- `POST /api/v1/planner/generate` — Module 2 week-by-week study course creator.

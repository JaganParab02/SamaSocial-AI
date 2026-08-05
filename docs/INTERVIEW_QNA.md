# Technical Interview Guide & Architectural Trade-offs

This document prepares evaluators and project developers for deep-dive discussions concerning the foundational architecture, performance trade-offs, and scaling strategies used across the SamaSocial AI Modules.

---

### Q: Why did you design a unified Core AI Platform rather than two isolated backends for Module 1 and Module 2?
**A:** This directly respects the **Don't Repeat Yourself (DRY)** and **Single Responsibility (SOLID)** principles. Both the Learning Assistant and the Course Planner fundamentally rely on identical underlying actions: ingesting complex knowledge sources, embedding vectors into Qdrant, retrieving relevant semantic contexts, and streaming LLM responses. By decoupling our `DocumentPipeline` and `Retriever` from specific consumer endpoints, Module 2 (Course Planner) simply imports the exact same foundational interfaces without duplicating a single vector index or storage service.

### Q: How did you solve the dual requirement of real-time conversational streaming alongside structured, validated JSON generation in the Course Planner?
**A:** Standard conversational LLM outputs are inherently free-form, whereas structured software needs deterministic, schema-compliant JSON. To achieve both without sacrificing user experience, `CoursePlannerService` implements a **Dual-Stage Orchestration Pattern**:
1. **Structural Generation**: First, a synchronous request to Groq (`temperature=0.1`) utilizes a targeted systemic prompt to construct a valid Pydantic `CoursePlan` JSON object.
2. **Conversational Stream**: Second, an asynchronous streaming generator (`temperature=0.7`) engages the mentor in natural conversation, streaming markdown tokens to the browser via Server-Sent Events (SSE). 
3. **Payload Synchronization**: Upon stream termination, the backend emits a specialized `{ "event": "plan_update", "data": <course_plan_json> }` packet over the open SSE connection, enabling the UI to instantly update the interactive visual syllabus without requiring secondary REST polling.

### Q: How does the React Frontend process complex Server-Sent Events (SSE) from POST requests?
**A:** The standard browser `EventSource` web interface natively restricts connections to HTTP GET requests, making it impossible to transmit complex JSON request payloads (such as large conversation histories or advanced filtering configurations) in a request body. To circumvent this without adopting heavy proprietary streaming libraries, we engineered a custom streaming consumer in React using the native **Fetch API** coupled with a `ReadableStreamDefaultReader`. We intercept raw byte stream chunks, decode UTF-8 strings, separate events by double newline breaks (`\n\n`), and safely process custom target event names (`token`, `plan_update`, and `error`).

### Q: What strategy prevents unexpected external AI provider downtime from causing systemic crashes?
**A:** We utilize layered resilience patterns:
1. **Network Retries & Backoff**: AI network integrations are shielded against intermittent socket failures using exponential backoff wrappers (via `tenacity`).
2. **Global Exception Containment**: The primary FastAPI runtime embeds a global fallback router middleware. If external dependencies (e.g. Qdrant socket timeouts, Groq rate limits, or Supabase dropouts) raise uncaught exceptions, the handler terminates the call stack gracefully, logs detailed execution tracebacks securely inside internal production logs, and returns a clean, sanitized `HTTP 500` JSON object. The frontend captures this response, rendering an intuitive visual error notification without crashing the client interface.

### Q: How would you evolve this codebase to support 10,000+ concurrent multi-tenant users?
**A:**
1. **Asynchronous Worker Pipelines**: Processing massive 500-page PDF documents currently blocks the calling Uvicorn async event loop. We would decouple document chunking and vector embedding into an asynchronous task queue (such as **Celery** or **Arq**) managed via Redis, responding immediately to uploads with an interactive process progress status link (`HTTP 202 Accepted`).
2. **Distributed Session Storage**: Replace the existing in-memory `SessionManager` state dictionary with a centralized **Redis Cluster** or a persistent **PostgreSQL / Supabase** relational table to support horizontal auto-scaling across stateless application containers.
3. **Dedicated Vector Inference Clusters**: Currently, dense embeddings execute locally on CPU cores via standard `SentenceTransformers`. We would delegate vector generation directly to high-throughput external model endpoints (e.g., OpenAI's `text-embedding-3-small` or Cohere Embed) to conserve backend memory overhead and accelerate batch vector operations.

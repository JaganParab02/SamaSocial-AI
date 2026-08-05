# Comprehensive Quality Assurance Test Plan

This document establishes the testing protocols, regression scenarios, edge-case validations, and execution procedures for the SamaSocial AI backend and frontend applications.

---

## 1. Automated Backend Test Suite

The automated test suite utilizes `pytest`, `pytest-asyncio`, and FastAPI's `TestClient` to validate API routing, service isolation, and error resilience.

### Test Files & Scope:
- `tests/test_smoke.py`: Verifies basic dependency injection, router registration, and health endpoint responsiveness.
- `tests/test_planner.py`: Verifies the dual-LLM generation pipeline in `CoursePlannerService`. Tests structural JSON parsing, graceful handling of malformed LLM syntax, Pydantic schema constraints, and Server-Sent Event (SSE) interruption safety.
- `tests/test_edge_cases.py`: Verifies rejection of empty uploads, malformed YouTube domain URLs, missing environment variables, and graceful degradation during network connection drops.
- `tests/test_extended_qa.py`: Verifies boundary conditions, including empty Qdrant retrieval results, prompt injection resistance, conversation memory truncation limits, and malformed manual JSON overrides.
- `tests/test_chat.py`: Verifies multi-turn memory serialization, context deduplication, and citation formatting.

> **Status**: 27/27 tests passing (100% pass rate).

### Running Automated Tests:
```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows: .\venv\Scripts\activate
# Unix/MacOS: source venv/bin/activate

pip install -r requirements.txt
pytest tests/ -v --cov=app
```

---

## 2. Manual End-to-End Test Protocols

### Scenario A: Multi-Source Learning Assistant (Module 1)
1. **Startup**: Execute `docker compose up --build`. Open browser to `http://localhost:5173`.
2. **Ingestion**: Navigate to the Learning Assistant dashboard. Upload a sample PDF file and paste a valid YouTube educational lecture link.
   - *Expected Outcome*: The frontend upload animation triggers. Upon completion, both items populate the active Source List with a `completed` status.
3. **Conversational RAG**: Type a question requiring synthesis across both the PDF and YouTube video.
   - *Expected Outcome*: Responses begin streaming instantly word-by-word. Upon stream conclusion, specific source citations (matching uploaded document IDs) display beneath the generated answer.

### Scenario B: Course Planning Assistant (Module 2)
1. **Navigation**: Switch to the `/course-planner` split-screen interface.
2. **Curriculum Generation**: Input the prompt: *"Generate a 2-week course syllabus on machine learning based on the documents I just uploaded."*
   - *Expected Outcome*: The left-side chat window streams an introductory conversational response from the assistant. As the stream terminates, the right-side syllabus preview automatically animates into view, correctly formatting Modules, Lessons, and Learning Outcomes without page reloads.
3. **Manual Override & Persistence**: Click the **"Edit JSON"** button in the preview header. Modify a lesson title in the editor, and click Save.
   - *Expected Outcome*: The updated text instantly renders in the clean visual hierarchy view. Clicking **"Export JSON"** successfully downloads a valid `.json` representation reflecting your exact customizations.

---

## 3. Resilience & Regression Verification
- **Catastrophic LLM Failure**: Disconnect internet access or provide an invalid `GROQ_API_KEY` in `.env`. Attempt a chat request.
  - *Verification*: The FastAPI backend logs a descriptive error without crashing Uvicorn. The React UI intercepts the resulting `HTTP 500` and displays an unobtrusive error notification to the user.
- **Unsupported Ingestion Types**: Attempt uploading an executable (`.exe`) or image (`.png`) file to the ingestion pipeline.
  - *Verification*: The API rejects the request instantly with an `HTTP 415 Unsupported Media Type` response prior to attempting parser extraction.

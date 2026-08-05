# TESTING GUIDE

> Last Updated: 2026-08-04

---

## Test Execution Commands

To execute the automated verification suite for the Reusable AI Backend Core from terminal:

```bash
# From repository workspace root
python -m pytest backend/tests/test_smoke.py -v

# Or with uvicorn running to check manual HTTP routes
curl http://localhost:8000/health
```

---

## Automated Test Scenarios (`test_smoke.py`)

Our verification test suite evaluates 7 critical architectural boundaries without requiring live network API keys:
1. **Configuration Loading (`test_01_configuration_loading`)**: Verifies Pydantic settings loading, default chunking size thresholds, and accepted document extensions.
2. **Local Embedding Service (`test_02_embedding_service`)**: Confirms Sentence-Transformers model (`all-MiniLM-L6-v2`) loads into memory and accurately produces 384-dimensional dense vectors across single and batch string transformations.
3. **Qdrant Vector Database (`test_03_vectordb_service`)**: Verifies resilient local fallback when external Qdrant server is unreached, validating vector insertions, metadata indexing, health reporting, and cleanup vector deletion by `source_id`.
4. **Session and Memory Management (`test_04_session_and_memory_manager`)**: Evaluates extensible `Session` object creation, knowledge source ID associations, Module 2 planner state modifications, conversational sliding windows, and token estimations.
5. **Dynamic Prompt Loader (`test_05_prompt_loader`)**: Validates externalized reading of `.txt` templates from `app/prompts/` and dynamic variable replacement without code recompilation.
6. **Content Parser Framework (`test_06_web_and_youtube_parsers`)**: Asserts `BaseParser` interface compliance, protocol filtering, and YouTube video identifier regular expression matching.
7. **RAG Semantic Chunker (`test_07_chunking_service`)**: Confirms `ChunkService` correctly splits extended educational prose into sequential `DocumentChunk` records enriched with document source IDs and segment order numbering.

---

## Manual Diagnostic Endpoints

When running `uvicorn app.main:app`, you can inspect operational statuses via OpenAPI Interactive documentation at `http://localhost:8000/docs` or via health APIs:
- `GET /health` — Overall system readiness and degraded component diagnostics.
- `GET /health/parsers` — Confirms PyMuPDF, python-pptx, BeautifulSoup4, and YouTube API libraries are imported cleanly.

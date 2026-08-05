# NEXT STEPS

> Last Updated: 2026-08-04

---

All core development for the SamaSocial AI Assignment has concluded. The project is fully documented, tested, and containerized.

### Future Potential Enhancements (Post-Submission)
1. **Quiz Generation Engine**: Expand the LLM prompts to extract exact objective question/answers from the vector chunks.
2. **Graph Dependencies**: Visually render the course dependencies using `React Flow`.
3. **Background Processing**: Migrate the `DocumentPipeline` to run asynchronously on Celery to prevent blocking FastAPI worker threads during massive PDF ingestion.

---

## Task Queue (Ordered)

| Priority | Task | Dependencies | Status |
| -------- | ---- | ------------ | ------ |
| 1 | AI Backend Core & Document Ingestion Pipeline | None | ✅ Completed (Milestone 2) |
| 2 | RAG Chat, Retrieval, and Streaming | Milestone 2 | ✅ Completed (Milestone 3) |
| 3 | Course Planner Generation Service (Task 2) | Milestone 3 | ⬜ Next Task |
| 4 | Quiz Generation & Evaluation Service | ChatService | ⬜ Pending |
| 5 | React Frontend Chat & Planner UI | API layer complete | ⬜ Pending |

---

## Known Blockers

- None. Backend core infrastructure is operational and isolated cleanly via Dependency Injection.

# CODE GUIDELINES

> Last Updated: 2026-08-04
>
> ⚠️ These rules should NOT change during development.

---

## General Principles

1. **Separation of Concerns** — Each layer has a single responsibility
2. **No Business Logic in Routes** — Routes only validate and delegate
3. **No Direct External Access in Services** — Use adapters/wrappers
4. **Don't Repeat Yourself (DRY)** — Reuse services and utilities
5. **Explicit Over Implicit** — Clear naming, typed parameters, documented behavior

---

## Naming Conventions

### Python (Backend)

| Element | Convention | Example |
| ------- | ---------- | ------- |
| Files | `snake_case.py` | `chat_service.py` |
| Classes | `PascalCase` | `ChatService` |
| Functions | `snake_case` | `generate_response()` |
| Variables | `snake_case` | `chunk_size` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_CHUNK_SIZE` |
| Private | `_leading_underscore` | `_build_prompt()` |
| Pydantic Models | `PascalCase` + suffix | `ChatRequest`, `ChatResponse` |
| Enums | `PascalCase` | `SourceType.PDF` |

### TypeScript/JavaScript (Frontend)

| Element | Convention | Example |
| ------- | ---------- | ------- |
| Files (components) | `PascalCase.jsx` | `ChatMessage.jsx` |
| Files (utilities) | `camelCase.js` | `apiClient.js` |
| Components | `PascalCase` | `ChatMessage` |
| Functions | `camelCase` | `sendMessage()` |
| Variables | `camelCase` | `messageCount` |
| Constants | `UPPER_SNAKE_CASE` | `API_BASE_URL` |
| Hooks | `useCamelCase` | `useChat()` |
| CSS classes | `kebab-case` | `chat-message` |

---

## Folder Conventions

### Backend

```
backend/app/
├── api/           # Route handlers ONLY (no logic)
├── services/      # Business logic (no DB/API access)
├── models/        # Pydantic models (request/response)
├── prompts/       # LLM prompt templates (never in code)
├── config/        # Settings and configuration
└── main.py        # App entry point
```

**Rules**:
- One router file per feature (e.g., `chat_router.py`, `upload_router.py`)
- One service file per domain (e.g., `chat_service.py`, `parser_service.py`)
- Models grouped by feature (e.g., `chat_models.py`)

### Frontend

```
frontend/src/
├── components/    # Reusable UI components
├── pages/         # Page-level components (one per route)
├── services/      # API client functions
├── hooks/         # Custom React hooks
└── App.jsx        # Root component
```

**Rules**:
- One component per file
- Co-locate component styles (`ChatMessage.jsx` + `ChatMessage.css`)
- All API calls go through `services/`

---

## Error Handling

### Backend (Python/FastAPI)

```python
# ✅ DO: Use custom exceptions with HTTP status codes
from fastapi import HTTPException

class DocumentNotFoundError(Exception):
    pass

# In route handler:
try:
    result = service.process(data)
except DocumentNotFoundError:
    raise HTTPException(status_code=404, detail="Document not found")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

```python
# ❌ DON'T: Catch and silence exceptions
try:
    result = service.process(data)
except:
    pass
```

**Rules**:
- Always log errors with context
- Return structured error responses (JSON with `detail` field)
- Use specific exception types, never bare `except:`
- Validate input at the API layer using Pydantic

### Frontend (React)

```javascript
// ✅ DO: Handle errors in API calls with user feedback
try {
  const response = await apiClient.sendMessage(message);
  // handle success
} catch (error) {
  setError(error.message || 'Something went wrong');
}
```

**Rules**:
- Always show user-friendly error messages
- Never expose raw error details to users
- Use error boundaries for component-level failures

---

## Logging

### Backend

```python
import logging

logger = logging.getLogger(__name__)

# Use appropriate levels:
logger.debug("Processing chunk %d of %d", i, total)     # Development detail
logger.info("Document %s uploaded successfully", doc_id)  # Key events
logger.warning("Groq rate limit approaching")             # Warnings
logger.error("Failed to parse PDF: %s", str(e))          # Errors
```

**Rules**:
- Use `__name__` for logger names (auto-namespacing)
- Use parameterized logging (not f-strings) for performance
- Log at the service layer, not in routes
- Never log sensitive data (API keys, user content)

---

## Dependency Injection

### Backend

```python
# ✅ DO: Accept dependencies as parameters
class ChatService:
    def __init__(self, retriever: Retriever, llm_client: LLMClient):
        self.retriever = retriever
        self.llm_client = llm_client

# ❌ DON'T: Instantiate dependencies inside the class
class ChatService:
    def __init__(self):
        self.retriever = Retriever()  # Hard-coupled
```

**Rules**:
- Services receive their dependencies via constructor
- Use FastAPI's `Depends()` for route-level injection
- Makes testing easy (pass mock implementations)

---

## FastAPI Rules

1. **Route handlers are thin** — validate, delegate, return
2. **Use Pydantic models** for all request/response schemas
3. **Use `Depends()`** for service injection
4. **Use `APIRouter`** to organize routes by feature
5. **Prefix all API routes** with `/api/v1/`
6. **Use async** for I/O-bound operations
7. **Document endpoints** with docstrings (auto-generates OpenAPI docs)

```python
# ✅ Good route handler
@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service)
):
    """Send a message and receive a streaming response."""
    return await chat_service.generate_response(request)
```

---

## React Rules

1. **Functional components only** — no class components
2. **Custom hooks** for shared stateful logic
3. **Props validation** — use PropTypes or TypeScript
4. **No inline styles** — use CSS modules or CSS files
5. **Component composition** over inheritance
6. **Lift state up** only when necessary
7. **Use `useEffect` cleanup** for subscriptions (SSE streams)

```jsx
// ✅ Good component
function ChatMessage({ message, isUser }) {
  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <p>{message.content}</p>
      {message.citations && <Citations items={message.citations} />}
    </div>
  );
}
```

---

## Git Conventions

### Commit Messages

```
<type>: <short description>

Types:
  feat     — New feature
  fix      — Bug fix
  docs     — Documentation only
  refactor — Code restructuring (no behavior change)
  test     — Adding/updating tests
  chore    — Build, config, tooling changes

Examples:
  feat: add PDF parser with PyMuPDF
  fix: handle empty transcript in YouTube parser
  docs: update API contract for chat endpoint
  refactor: extract chunking logic into service
```

### Branch Naming

```
feature/<name>    — New features
fix/<name>        — Bug fixes
docs/<name>       — Documentation updates

Examples:
  feature/pdf-parser
  fix/streaming-disconnect
  docs/api-contract
```

---

## Code Quality

- **No commented-out code** in committed files
- **No TODO comments** without a corresponding issue in KNOWN_ISSUES.md
- **No magic numbers** — use named constants
- **No unused imports** — clean up before committing
- **Maximum function length** — ~50 lines (break into helper functions)
- **Maximum file length** — ~300 lines (split into modules)

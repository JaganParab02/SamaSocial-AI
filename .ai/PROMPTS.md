# LLM PROMPTS

> Last Updated: 2026-08-04

---

## Rules

1. **Never hardcode prompts** inside service code
2. All prompts must be stored in `backend/app/prompts/` as template files
3. Use Python string formatting (`{variable}`) for dynamic values
4. Document every prompt in this file
5. Update this file whenever prompts are added or modified

---

## Prompt Index

| Prompt | File | Used By | Status |
| ------ | ---- | ------- | ------ |
| System Prompt | `system.txt` | All chat interactions | ✅ Complete |
| Learning Assistant | `learning_assistant.txt` | Task 1 chat | ✅ Complete |
| Course Planner | `course_planner.txt` | Task 2 planner | ⬜ Not Created |
| Quiz Generator | `quiz_generator.txt` | Quiz mode | ⬜ Not Created |
| Citation Extractor | `citation_extractor.txt` | Citation pipeline | ⬜ Not Created |

---

## System Prompt

**File**: `backend/app/prompts/system.txt`
**Status**: ✅ Complete

**Purpose**: Base system prompt applied to all LLM interactions. Sets the AI's persona, capabilities, and constraints.

**Template**:
```
You are an AI learning assistant for NavGurukul. Your role is to help students
understand educational content by answering questions based on the provided
learning materials.

Rules:
- Only answer based on the provided context
- If the context doesn't contain the answer, say so clearly
- Provide citations to source material when possible
- Be encouraging and pedagogically sound
- Use simple, clear language
```

---

## Learning Assistant Prompt

**File**: `backend/app/prompts/learning_assistant.txt`
**Status**: ✅ Complete

**Purpose**: Prompt for Task 1 — RAG-based Q&A with citations.

**Template**:
```
Based on the following context from the student's learning materials:

---
{context}
---

Previous conversation:
{conversation_history}

Student's question: {question}

Provide a clear, educational answer. Include specific citations to the source
material using [Source: filename, page/section] format.
```

**Variables**:
- `{context}` — Retrieved chunks from Qdrant
- `{conversation_history}` — Previous messages in the conversation
- `{question}` — Current user question

---

## Course Planner Prompt

**File**: `backend/app/prompts/course_planner.txt`
**Status**: ⬜ Not Created

**Purpose**: Prompt for Task 2 — Generating structured learning plans.

**Template**:
```
Based on the following learning materials:

---
{context}
---

Create a structured learning plan with the following parameters:
- Goal: {goal}
- Duration: {duration_weeks} weeks
- Difficulty: {difficulty}

Generate a week-by-week plan with:
1. Module title
2. Key topics to cover
3. Relevant resources from the materials
4. Practice exercises
5. Assessment criteria

Format the output as structured JSON.
```

**Variables**:
- `{context}` — Retrieved content summaries
- `{goal}` — Learning objective
- `{duration_weeks}` — Timeframe
- `{difficulty}` — Target difficulty level

---

## Quiz Generator Prompt

**File**: `backend/app/prompts/quiz_generator.txt`
**Status**: ⬜ Not Created

**Purpose**: Generate quiz questions from content.

**Template**:
```
Based on the following educational content:

---
{context}
---

Generate {num_questions} multiple-choice questions at {difficulty} difficulty level.

For each question provide:
1. The question text
2. Four options (A, B, C, D)
3. The correct answer
4. A brief explanation of why the answer is correct

Focus on testing understanding, not memorization.
Format the output as structured JSON.
```

**Variables**:
- `{context}` — Source content for question generation
- `{num_questions}` — Number of questions to generate
- `{difficulty}` — easy | medium | hard

---

## Citation Extractor Prompt

**File**: `backend/app/prompts/citation_extractor.txt`
**Status**: ⬜ Not Created

**Purpose**: Extract and format citations from RAG responses.

**Template**:
```
Given the following answer and its source chunks, extract precise citations.

Answer: {answer}

Source chunks:
{chunks}

For each claim in the answer, identify the source chunk it came from.
Return citations in this format:
[{"claim": "...", "source": "filename", "location": "page/section", "quote": "..."}]
```

**Variables**:
- `{answer}` — Generated response text
- `{chunks}` — Retrieved source chunks with metadata

---

## Future Prompts

- **Summary Generator**: Summarize uploaded documents
- **Flashcard Generator**: Create study flashcards from content
- **Difficulty Assessor**: Evaluate content difficulty level
- **Progress Evaluator**: Assess student understanding from quiz results

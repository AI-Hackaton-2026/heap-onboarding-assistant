# Coding Standards

This is a two-stack project: a **Python + FastAPI** backend and a **React (Vite) + TypeScript** frontend. Standards below are split accordingly.

## Python (backend)

- Target Python 3.10+. Use type hints on all function signatures and Pydantic models for request/response bodies.
- Use Pydantic models for all API request/response schemas so plan/chat outputs are typed and validated.
- Keep the RAG pipeline modular: `ingest.py` (load + chunk + embed), `retriever.py` (similarity search), `chat.py` (RAG chain + source citation), `plan/generator.py` (structured-output plan generation).
- Never hardcode secrets — read keys from environment (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.).
- Honor the `USE_MOCK` flag: mock loaders and real Slack/GitHub loaders must share the same interface.

## TypeScript (frontend)

- Strict mode enabled; no `any` — use proper typing or `unknown`.
- Define interfaces for all props, API responses, and data models (mirror the backend's plan/chat/source shapes).
- Use type inference where obvious, explicit types where helpful.

## React (Vite)

- Function components with hooks; no class components.
- Keep API calls in `frontend/src/lib/api.ts`; components consume typed responses, not raw `fetch`.
- One concern per component; lift session state (role, progress) to a context/provider rather than prop-drilling.

## Styling — Tailwind CSS

- Use Tailwind utility classes; avoid bespoke CSS files unless a utility truly can't express it.
- Note any version-specific config gotchas here once Tailwind is installed (e.g. v4 uses `@theme` in CSS, not `tailwind.config.js`).

## File Organization

- Backend routes: `backend/main.py`
- Backend RAG: `backend/rag/{ingest,retriever,chat}.py`
- Backend plan: `backend/plan/generator.py`
- Backend mock data: `backend/data/mock_github/`, `backend/data/mock_slack/`
- Frontend components: `frontend/src/components/`
- Frontend pages/routes: `frontend/src/pages/` (Wizard, Plan+Checklist, Chat, HR Dashboard)
- Frontend API client / utils: `frontend/src/lib/`

## Naming

- React components: PascalCase (`PlanChecklist.tsx`)
- Functions: camelCase (TS) / snake_case (Python)
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces / Pydantic models: PascalCase (no prefix)

## Data / Vector Store

- FAISS is the vector store. Build the index once via `python -m rag.ingest`; the index is a build artifact, not source — keep it out of git.
- Retrieval returns top-k chunks; always carry the source label through to the answer so citations are accurate.

## Data Fetching

- Frontend talks to the backend only through `lib/api.ts` against `VITE_API_URL`.
- Validate all inbound request bodies with Pydantic; never trust client input.

## Error Handling

- Backend: raise `HTTPException` with clear status + message; catch and log RAG/LLM failures.
- The chat endpoint must degrade gracefully — when no relevant chunk is found, return an honest "not found in company documents" answer rather than a hallucination.
- Frontend: surface user-friendly errors; never leave the UI in a silent failed state.

## Code Quality

- No commented-out code unless specified.
- No unused imports or variables; no stray `console.log` / `print` debugging left in.
- Keep functions focused and under ~50 lines when possible.

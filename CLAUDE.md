# Onboardly

An AI onboarding assistant that actually gets used — grounded in your company's Slack, GitHub, and internal docs (RAG with cited sources).

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

This is a two-part app. Run the backend and frontend separately.

### Backend (Python + FastAPI, `backend/`)
- **Install**: `pip install -r requirements.txt`
- **Build vector index** (one-time): `python -m rag.ingest`
- **Dev server**: `uvicorn main:app --reload --port 8000`  (docs at http://localhost:8000/docs)

### Frontend (React + Vite, `frontend/`)
- **Dev server**: `npm run dev`  (http://localhost:5173)
- **Build**: `npm run build`
- **Production preview**: `npm run preview`
- **Lint**: `npm run lint`

**IMPORTANT:** Do not add Claude to any commit messages

<!--
  MCP / project-specific rules:
  - The RAG pipeline reads keys from env (ANTHROPIC_API_KEY / OPENAI_API_KEY); never hardcode them.
  - Slack/GitHub are mocked behind USE_MOCK=true — keep mock and real loaders interface-compatible.
  - FAISS index is a build artifact; do not commit it.
-->

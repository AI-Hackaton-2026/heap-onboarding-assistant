# Onboardly 🚀

> **AI Onboarding Assistant** that actually gets used — grounded in your company's Slack, GitHub, and internal docs.

Built by **Team Heap** for the **FEP AI Hackathon 2026** (Theme 9 — AI Onboarding Assistant).

---

## The Problem

New employees need a lot of information in their first weeks, and finding the right resource, process, or person is slow and frustrating. Managers and colleagues answer the same questions over and over. Onboarding lives in the heads of a few people — it doesn't scale, and every new hire gets a different experience.

## What Onboardly Does

Onboardly is a conversational AI assistant that:

1. **Generates a personalized onboarding plan** from a role and department — a developer gets a different plan than someone in HR.
2. **Answers questions in natural language** using the company's real documents, and **cites its sources** so answers are verifiable — no hallucinations.
3. **Tracks progress** through an interactive checklist, and surfaces to HR where new hires get stuck.

The core idea: instead of a chatbot that makes things up, Onboardly uses **RAG (Retrieval-Augmented Generation)** over the company's actual knowledge — so every answer is grounded and traceable.

---

## Features

| Feature | Description | Priority |
| --- | --- | --- |
| 🗓️ **Onboarding Plan Generator** | Enter a role + department → AI returns a structured plan (Day 1 / Week 1 / Weeks 2–4) as typed JSON. Role-specific. | MUST |
| 💬 **RAG Chat Assistant** | Ask anything ("How do I request leave?", "What's our branching strategy?"). AI retrieves relevant chunks and answers **with a cited source** (e.g. `[GitHub: backend/README.md]`). | MUST |
| ✅ **Progress Checklist** | Plan items become an interactive checklist with a progress bar. State is persisted per session. | MUST |
| 🗺️ **Guided Conversational Flow** | The assistant proactively suggests the next logical step from the plan — the user doesn't need to know what to ask. | MUST |
| 💾 **Context Memory** | Remembers the user's role and progress across the session, so they never repeat themselves. | MUST |
| 👤 **"Who do I ask?"** | Matches a question to the right person from the Slack org chart, and can draft an intro message. | SHOULD |
| 📊 **HR Dashboard** | Overview of new hires, completion %, most-asked questions, and bottleneck topics. | STRETCH |
| 🎓 **Knowledge Gap Alert** | When the AI can't find an answer, it logs the gap so HR knows which docs are missing. | STRETCH |

---

## Architecture

```
  Slack API ─┐
  GitHub API ─┼─→ Ingestion & Chunking ─→ Embeddings ─→ Vector Store (FAISS)
  HR Docs ───┘

  User enters role ─→ LLM (Claude / GPT-4o) ─→ ┌─ 📋 Onboarding Plan
                                                ├─ 💬 Chat with citations
                                                └─ 📊 HR Dashboard
```

### How RAG works (no hallucinations)

```
User asks "How do we deploy?"
    → embed the question
    → retrieve top-3 chunks from the vector store
    → LLM receives: prompt + retrieved context
    → answer + [Source: repo/README.md]
```

The model **only answers from retrieved documents**. If it can't find a relevant answer, it says so ("I couldn't find this in the company documents") rather than guessing.

> **Note on data sources:** For the hackathon, Slack and GitHub content is simulated with local Markdown files under `data/mock_github/` and `data/mock_slack/`. The same LangChain loaders work against the real Slack Web API and GitHub REST API by flipping a `USE_MOCK` flag — no architectural change needed.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React + Tailwind CSS |
| Backend | Python + FastAPI |
| AI / RAG | LangChain, OpenAI `text-embedding-3-small` |
| Vector store | FAISS |
| LLM | Claude API or OpenAI GPT-4o |
| Integrations | Slack Web API, GitHub REST API (mocked for the hackathon) |
| Deploy | Vercel (frontend) |

---

## Project Structure

```
heap-onboardly/
├── backend/
│   ├── main.py              # FastAPI app + routes
│   ├── rag/
│   │   ├── ingest.py        # load + chunk + embed docs into FAISS
│   │   ├── retriever.py     # similarity search
│   │   └── chat.py          # RAG chat chain + source citation
│   ├── plan/
│   │   └── generator.py     # structured-output plan generation
│   ├── data/
│   │   ├── mock_github/     # *.md files simulating GitHub docs
│   │   └── mock_slack/      # org chart + channel FAQs
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # Wizard, Plan+Checklist, Chat, HR Dashboard
│   │   ├── components/
│   │   └── lib/api.ts       # backend client
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- An LLM API key (Anthropic **or** OpenAI) and an OpenAI key for embeddings

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # then fill in your keys (see below)

# Build the vector index from mock docs (one-time)
python -m rag.ingest

# Run the API
uvicorn main:app --reload --port 8000
```

The API is now at `http://localhost:8000` (interactive docs at `http://localhost:8000/docs`).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env             # set VITE_API_URL=http://localhost:8000
npm run dev
```

The app is now at `http://localhost:5173`.

### Environment Variables

**`backend/.env`**

```env
# Use one LLM provider
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...

# Required for embeddings
OPENAI_API_KEY=sk-...

# Optional — only needed to pull from real Slack/GitHub instead of mock data
USE_MOCK=true
SLACK_BOT_TOKEN=xoxb-...
GITHUB_TOKEN=ghp_...
```

**`frontend/.env`**

```env
VITE_API_URL=http://localhost:8000
```

> ⚠️ Never commit real API keys. `.env` is gitignored; only `.env.example` is tracked.

---

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/plan` | Generate a structured onboarding plan from `{ role, department }`. |
| `POST` | `/api/chat` | RAG answer to a question, with cited sources and session context. |
| `GET` | `/api/org-chart` | Org structure / contacts derived from Slack data. |
| `GET` | `/api/progress` | Checklist completion status for a user. |
| `POST` | `/api/progress` | Update task done/undone state. |
| `GET` | `/api/hr/overview` | (Stretch) Aggregated onboarding status across new hires. |
| `GET` | `/api/hr/faq-summary` | (Stretch) Summary of most-asked questions + doc gaps. |

**Example — generate a plan:**

```bash
curl -X POST http://localhost:8000/api/plan \
  -H "Content-Type: application/json" \
  -d '{"role": "Backend Developer", "department": "Engineering"}'
```

```json
{
  "days": [
    {
      "day": 1,
      "title": "Environment setup",
      "tasks": [
        { "id": "t1", "text": "Clone the main repo", "done": false },
        { "id": "t2", "text": "Install dependencies", "done": false }
      ]
    }
  ]
}
```

---

## Demo Flow

1. **Wizard** — enter name, role, and department → backend generates the plan as structured JSON.
2. **Plan + Checklist** — the plan renders as a day-by-day accordion; each task has a checkbox and the progress bar updates live.
3. **Chat** — ask free-form questions; the assistant retrieves from the knowledge base and answers with a `[Source: ...]` citation, aware of your role and progress.

---

## Team

**Heap** — 5 members.

| Name | Role |
| --- | --- |
| _TBD_ | Backend / RAG pipeline |
| _TBD_ | Frontend / UI |
| _TBD_ | Integrations (Slack / GitHub) |
| _TBD_ | Plan generation + HR view |
| _TBD_ | Demo / presentation |

---

## Acknowledgements

Built in ~15 hours for the **FEP AI Hackathon 2026** (Jun 2–3, 2026). AI tools (Claude, Copilot) were used for brainstorming, coding assistance, and debugging — the team understands and can explain the full implementation.

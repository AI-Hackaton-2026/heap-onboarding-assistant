// Mock Slack workspace data. Used by the mock sync pipeline so the knowledge
// base has realistic Slack context without a real Slack App connection.
// Replace this with real API calls in T-SLACK-1/2.

export interface MockMessage {
  user: string;
  text: string;
  ts: string;
}

export interface MockChannel {
  id: string;
  name: string;
  purpose: string;
  messages: MockMessage[];
}

export const MOCK_WORKSPACE_NAME = "Acme Engineering";

export const MOCK_CHANNELS: MockChannel[] = [
  {
    id: "C001",
    name: "general",
    purpose: "Company-wide announcements and onboarding",
    messages: [
      {
        user: "Alice (Engineering Manager)",
        text: "Welcome to the team everyone! Please make sure to read the onboarding docs in Notion first, then clone the repo and run `npm install` inside the `onboardly/` folder.",
        ts: "2024-01-15T09:00:00Z",
      },
      {
        user: "Bob (CTO)",
        text: "Reminder: all PRs need at least one approval before merging to development. We use feature branches — never commit directly to main or development.",
        ts: "2024-01-15T10:00:00Z",
      },
      {
        user: "Carol (HR)",
        text: "New hires: your first week is about getting set up and meeting the team. Don't worry about shipping — focus on understanding the codebase and asking lots of questions in #engineering.",
        ts: "2024-01-16T09:00:00Z",
      },
      {
        user: "Alice (Engineering Manager)",
        text: "Stand-ups are async. Post your update in #standup every morning: what you did yesterday, what you're doing today, any blockers.",
        ts: "2024-01-17T08:30:00Z",
      },
    ],
  },
  {
    id: "C002",
    name: "engineering",
    purpose: "Engineering discussions, architecture decisions, and PR reviews",
    messages: [
      {
        user: "Dan (Backend Lead)",
        text: "Architecture overview: we use Next.js App Router for both frontend and API routes. Prisma connects to Supabase Postgres and bypasses RLS — always enforce access in app logic, never rely on DB-level security alone.",
        ts: "2024-01-15T11:00:00Z",
      },
      {
        user: "Eve (Frontend)",
        text: "For UI components always use shadcn/ui primitives first, then compose. Don't hand-roll base elements like buttons or inputs — they're in src/components/ui/.",
        ts: "2024-01-15T11:30:00Z",
      },
      {
        user: "Dan (Backend Lead)",
        text: "Auth is handled by Supabase Auth. The middleware (proxy.ts) refreshes sessions on every request and guards /dashboard, /projects, /integrations. Check src/lib/auth/actions.ts for sign-in/sign-out server actions.",
        ts: "2024-01-16T10:00:00Z",
      },
      {
        user: "Frank (DevOps)",
        text: "Deployments go through Vercel. Every push to main auto-deploys to production. The development branch deploys to staging. Never force-push to either.",
        ts: "2024-01-16T14:00:00Z",
      },
      {
        user: "Eve (Frontend)",
        text: "Responsive design is mandatory — every component must work at 390 / 768 / 1440px. Build mobile-first with Tailwind breakpoints. This is a hard requirement, not optional.",
        ts: "2024-01-17T09:00:00Z",
      },
      {
        user: "Dan (Backend Lead)",
        text: "For vector search we use pgvector with the <=> cosine distance operator. Embeddings are 768-dimensional (Gemini). Never use Prisma for vector queries — use prisma.$queryRaw with a ::vector cast.",
        ts: "2024-01-18T11:00:00Z",
      },
    ],
  },
  {
    id: "C003",
    name: "onboarding",
    purpose: "Questions from new hires and onboarding support",
    messages: [
      {
        user: "Grace (New Hire)",
        text: "Who should I ask about the GitHub App setup? I'm trying to connect a repo to a project but I'm getting a 403.",
        ts: "2024-01-20T10:00:00Z",
      },
      {
        user: "Dan (Backend Lead)",
        text: "For GitHub App setup you need Administration:Read permission and the App must be installed on the repo owner (not just your personal account). See the .env.example for all the env vars you need.",
        ts: "2024-01-20T10:15:00Z",
      },
      {
        user: "Henry (New Hire)",
        text: "What's the process for getting a new feature into production?",
        ts: "2024-01-21T09:00:00Z",
      },
      {
        user: "Alice (Engineering Manager)",
        text: "Feature workflow: create a feature branch from development → implement → lint + build must pass → open PR → get one approval → merge to development → QA on staging → merge development to main for production deploy.",
        ts: "2024-01-21T09:20:00Z",
      },
      {
        user: "Grace (New Hire)",
        text: "Where do environment variables go? I see .env.example but not sure where to put real values.",
        ts: "2024-01-22T11:00:00Z",
      },
      {
        user: "Frank (DevOps)",
        text: "Local dev: create onboardly/.env.local (git-ignored). Staging/prod: set in Vercel project settings. Never commit .env.local or any file with real secrets.",
        ts: "2024-01-22T11:10:00Z",
      },
    ],
  },
  {
    id: "C004",
    name: "backend",
    purpose: "Backend team — API design, database, and infrastructure",
    messages: [
      {
        user: "Dan (Backend Lead)",
        text: "Database schema is managed by Prisma. To add a column: edit prisma/schema.prisma, run `npm run db:push` from inside onboardly/. For production we'll use proper migrations.",
        ts: "2024-01-15T14:00:00Z",
      },
      {
        user: "Dan (Backend Lead)",
        text: "Tenant isolation is critical. Prisma bypasses Supabase RLS so we enforce it in app logic. Every query must be scoped through getProjectAccess() or requireProjectAdmin(). See src/lib/members/access.ts.",
        ts: "2024-01-16T15:00:00Z",
      },
      {
        user: "Isabel (Backend)",
        text: "Storage: Supabase Storage with two buckets — `uploads` for user-uploaded docs and `docs` for generated content. Always use the service-role server client for Storage. Downloads go through signed URLs (1-hour expiry), never public URLs.",
        ts: "2024-01-17T10:00:00Z",
      },
      {
        user: "Dan (Backend Lead)",
        text: "API route conventions: validate all inbound bodies before use, return clear HTTP status codes, never trust client input. Server actions for mutations, API routes for file uploads or long-running ops.",
        ts: "2024-01-18T09:00:00Z",
      },
      {
        user: "Isabel (Backend)",
        text: "AI services: Gemini 2.5 Flash for chat and course generation, gemini-embedding-001 for 768-dim embeddings. Key is in GEMINI_API_KEY. Client in src/lib/ai/gemini.ts.",
        ts: "2024-01-19T11:00:00Z",
      },
    ],
  },
];

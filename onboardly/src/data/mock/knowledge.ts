// Mock knowledge base documents/chunks for building knowledge-status UI
// before real ingestion + embeddings exist.

import type { Citation } from "@/types/chat";

export interface MockKnowledgeChunk {
  id: string;
  text: string;
  citation: Citation;
}

export const mockKnowledgeChunks: MockKnowledgeChunk[] = [
  {
    id: "chunk-1",
    text: "We deploy from the main branch via the Vercel GitHub integration.",
    citation: { label: "GitHub: README.md", source: "README.md" },
  },
  {
    id: "chunk-2",
    text: "Frontend questions go to the #frontend channel; @alice owns the design system.",
    citation: { label: "Slack: #frontend", source: "slack/frontend" },
  },
];

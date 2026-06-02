// Gemini client + shared helpers. Single place that initializes the Google
// GenAI SDK so the rest of the app (chat, course gen, embeddings) reuses it.

import { GoogleGenAI } from "@google/genai";

/** Default models for the app. */
export const GEMINI_CHAT_MODEL = "gemini-2.5-flash";
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";

let client: GoogleGenAI | null = null;

/** Lazily create a shared GoogleGenAI client from the GEMINI_API_KEY env var. */
export function getGemini(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

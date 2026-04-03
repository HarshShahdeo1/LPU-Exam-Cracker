import OpenAI from "openai";

import { getRequiredEnv } from "@/lib/env";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: getRequiredEnv("OPENAI_API_KEY"),
      baseURL: process.env.OPENAI_BASE_URL || undefined
    });
  }

  return openaiClient;
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function getAIProviderName() {
  const baseURL = process.env.OPENAI_BASE_URL?.toLowerCase() ?? "";

  if (!baseURL) {
    return "OpenAI";
  }

  if (baseURL.includes("groq")) {
    return "Groq";
  }

  return "OpenAI-compatible";
}

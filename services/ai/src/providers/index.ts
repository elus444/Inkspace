import type { AIProvider } from "./aiProvider.js";
import { StubAIProvider } from "./stubProvider.js";
import { GeminiAIProvider } from "./geminiProvider.js";

/**
 * The entire "stub today, real Gemini output later" mechanism lives here:
 * one branch on whether GEMINI_API_KEY is set. Nothing else in the service
 * (routes, controller, models) needs to change when a real key is added —
 * restart the process with the env var set and every endpoint switches
 * over automatically.
 */
export function createAIProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey) {
    const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
    return new GeminiAIProvider(apiKey, modelName);
  }
  return new StubAIProvider();
}

export type { AIProvider, GenerateRequest, AITask, ToneResult, ToneLabel } from "./aiProvider.js";

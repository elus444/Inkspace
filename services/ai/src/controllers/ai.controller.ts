import { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import { createAIProvider } from "../providers/index.js";
import type { AITask } from "../providers/aiProvider.js";
import AICache from "../models/aiCache.model.js";
import AISuggestion from "../models/aiSuggestion.model.js";
import { cacheKey } from "../utils/hash.js";
import { scoreReadability } from "../utils/readability.js";

// One provider instance for the process lifetime — cheap to construct, and
// reusing it avoids re-creating the Gemini SDK client per request.
const provider = createAIProvider();

async function logSuggestion(userId: string, task: string, postId?: string) {
  try {
    await AISuggestion.create({ userId, task, provider: provider.name, postId });
  } catch (err) {
    // Analytics logging must never break the actual feature.
    console.error("Failed to log AI suggestion:", err);
  }
}

/**
 * Shared handler for every streaming generative task. Checks the cache
 * first (serves instantly, no provider call); on a miss, streams the
 * provider's output straight through to the client while buffering it in
 * memory so the complete text can be cached + logged once the stream ends.
 */
async function handleGenerate(
  task: AITask,
  req: AuthRequest,
  res: Response,
  content: string,
  extra?: string
) {
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "content is required" });
  }
  if (content.length > 20000) {
    return res.status(400).json({ message: "content is too long (max 20000 characters)" });
  }

  const key = cacheKey(task, content, extra ?? "");
  const cached = await AICache.findOne({ key }).lean();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("X-AI-Provider", provider.name);

  if (cached) {
    res.setHeader("X-AI-Cache", "HIT");
    res.write(cached.output);
    res.end();
    void logSuggestion(req.userId!, task, req.body?.postId);
    return;
  }

  res.setHeader("X-AI-Cache", "MISS");
  res.flushHeaders();

  let full = "";
  try {
    for await (const chunk of provider.generateStream({ task, content, title: extra })) {
      full += chunk;
      res.write(chunk);
    }
  } catch (err) {
    console.error(`AI provider error on task "${task}":`, err);
    if (!res.headersSent) {
      res.status(502).json({ message: "AI provider failed to generate a response" });
      return;
    }
    // Headers/streaming already started — end the stream as-is rather than
    // sending a broken/partial JSON error into a text/plain response.
    res.end();
    return;
  }

  res.end();

  if (full.trim()) {
    void AICache.create({ key, task, output: full }).catch((err) =>
      console.error("Failed to cache AI response:", err)
    );
  }
  void logSuggestion(req.userId!, task, req.body?.postId);
}

export const suggestTitle = async (req: AuthRequest, res: Response) => {
  await handleGenerate("title", req, res, req.body?.content ?? "");
};

export const suggestDescription = async (req: AuthRequest, res: Response) => {
  const { content, title } = req.body ?? {};
  await handleGenerate("description", req, res, content ?? "", title);
};

export const suggestTwitter = async (req: AuthRequest, res: Response) => {
  await handleGenerate("twitter", req, res, req.body?.content ?? "");
};

export const writingSuggestions = async (req: AuthRequest, res: Response) => {
  await handleGenerate("writing-suggestions", req, res, req.body?.content ?? "");
};

export const analyzeTone = async (req: AuthRequest, res: Response) => {
  const content: string = req.body?.content ?? "";
  if (!content.trim()) {
    return res.status(400).json({ message: "content is required" });
  }
  if (content.length > 20000) {
    return res.status(400).json({ message: "content is too long (max 20000 characters)" });
  }

  try {
    const result = await provider.analyzeTone(content);
    void logSuggestion(req.userId!, "analyze-tone", req.body?.postId);
    res.json({ ...result, provider: provider.name });
  } catch (err) {
    console.error("AI tone analysis error:", err);
    res.status(502).json({ message: "AI provider failed to analyze tone" });
  }
};

export const readabilityScore = (req: AuthRequest, res: Response) => {
  const content: string = req.body?.content ?? "";
  if (!content.trim()) {
    return res.status(400).json({ message: "content is required" });
  }
  const result = scoreReadability(content);
  res.json(result);
};

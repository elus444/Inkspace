import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, GenerateRequest, ToneResult, ToneLabel } from "./aiProvider.js";

const TONE_LABELS: ToneLabel[] = ["professional", "casual", "academic", "humorous"];

function buildPrompt(req: GenerateRequest): string {
  switch (req.task) {
    case "title":
      return `Suggest one concise, compelling blog post title (under 12 words, no quotation marks) for the following draft content. Reply with only the title, nothing else.\n\nContent:\n${req.content}`;
    case "description":
      return `Write a single SEO meta description (150-160 characters, one sentence, no quotation marks) for a blog post${req.title ? ` titled "${req.title}"` : ""}. Reply with only the description.\n\nContent:\n${req.content}`;
    case "twitter":
      return `Convert the following blog post into a Twitter/X thread. Number each tweet like "1/n". Keep each tweet under 260 characters. Reply with only the thread.\n\nContent:\n${req.content}`;
    case "writing-suggestions":
      return `Give 3-5 short, specific, actionable writing-improvement suggestions (clarity, tone, structure, grammar) for the following draft, as a markdown bullet list. Reply with only the list.\n\nContent:\n${req.content}`;
  }
}

/** Real Gemini-backed provider. Only constructed when GEMINI_API_KEY is set. */
export class GeminiAIProvider implements AIProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(apiKey: string, modelName: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async *generateStream(req: GenerateRequest): AsyncIterable<string> {
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const result = await model.generateContentStream(buildPrompt(req));
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async analyzeTone(content: string): Promise<ToneResult> {
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const prompt = `Classify the dominant tone of the following text as exactly one of: professional, casual, academic, humorous. Reply with strict JSON only, no markdown fences: {"tone": "<one of the four>", "confidence": <number between 0 and 1>}.\n\nText:\n${content}`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    try {
      const jsonText = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(jsonText) as { tone?: string; confidence?: number };
      const tone = TONE_LABELS.includes(parsed.tone as ToneLabel) ? (parsed.tone as ToneLabel) : "professional";
      const confidence = typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5;
      return { tone, confidence };
    } catch {
      return { tone: "professional", confidence: 0.5 };
    }
  }
}

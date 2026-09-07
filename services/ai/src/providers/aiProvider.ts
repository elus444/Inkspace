/**
 * Provider-agnostic AI interface. Every generative endpoint in this service
 * talks only to this interface, never to a specific SDK — swapping the
 * backing model (stub -> Gemini, or Gemini -> something else later) is a
 * one-file change in `providers/index.ts`; nothing else in the codebase
 * needs to know which provider is active.
 *
 * The interface is task-aware (rather than a raw "prompt in, text out")
 * so the offline stub provider can give each endpoint genuinely useful,
 * differentiated demo output by inspecting `content` directly, instead of
 * having to parse a prompt string built for a real LLM.
 */
export type AITask = "title" | "description" | "twitter" | "writing-suggestions";

export interface GenerateRequest {
  task: AITask;
  content: string;
  /** Only used by the "description" task, which writes an SEO description
   *  informed by the post's chosen title. */
  title?: string;
}

export type ToneLabel = "professional" | "casual" | "academic" | "humorous";

export interface ToneResult {
  tone: ToneLabel;
  confidence: number; // 0-1
}

export interface AIProvider {
  /** Human-readable name, surfaced to the frontend so it can be honest about
   *  whether output is real model output or the offline stub. */
  readonly name: string;

  /**
   * Stream a completion for a generative task as an async sequence of text
   * chunks. Implementations should yield small chunks reasonably quickly
   * rather than yielding the whole response at once, so the caller's
   * streaming HTTP response is actually incremental.
   */
  generateStream(req: GenerateRequest): AsyncIterable<string>;

  /** Classify the dominant tone of a piece of writing. Not streamed — it's
   *  a single structured result, not prose. */
  analyzeTone(content: string): Promise<ToneResult>;
}

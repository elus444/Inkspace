import type { AIProvider, GenerateRequest, ToneResult, ToneLabel } from "./aiProvider.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Yield `text` in small word-ish chunks with a tiny delay between each, so
 *  callers exercise the exact same incremental-rendering code path they'd
 *  use against a real streaming model. */
async function* streamText(text: string): AsyncIterable<string> {
  const chunks = text.match(/\S+\s*/g) ?? [text];
  for (const chunk of chunks) {
    await sleep(15 + Math.floor(Math.random() * 20));
    yield chunk;
  }
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function buildTitle(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "Untitled Draft";
  const first = splitSentences(trimmed)[0] ?? trimmed;
  const words = first.split(/\s+/).slice(0, 9).join(" ").replace(/[.,;:!?]+$/, "");
  return titleCase(words.length > 3 ? words : trimmed.split(/\s+/).slice(0, 9).join(" "));
}

function buildDescription(content: string, title?: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Add some content to generate an SEO description.";
  const prefix = title ? `${title}: ` : "";
  const budget = 155 - prefix.length;
  if (trimmed.length <= budget) return prefix + trimmed;
  const cut = trimmed.slice(0, budget);
  const lastSpace = cut.lastIndexOf(" ");
  return prefix + cut.slice(0, lastSpace > 0 ? lastSpace : budget).trim() + "…";
}

function buildTwitterThread(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  if (!trimmed) return "1/1 Nothing to thread yet — write some content first.";
  const sentences = splitSentences(trimmed);
  const tweets: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > 230 && current) {
      tweets.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) tweets.push(current);
  const total = Math.max(1, tweets.length);
  return tweets.map((t, i) => `${i + 1}/${total} ${t}`).join("\n\n");
}

function buildWritingSuggestions(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "- Start writing and suggestions will appear here.";
  const tips: string[] = [];
  const sentences = splitSentences(trimmed);
  const words = trimmed.split(/\s+/).filter(Boolean);

  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 28).length;
  if (longSentences > 0) {
    tips.push(`- ${longSentences} sentence(s) are quite long — consider breaking them up for clarity.`);
  }

  const passiveMatches = trimmed.match(/\b(was|were|is|are|been)\s+\w+ed\b/gi) ?? [];
  if (passiveMatches.length > 1) {
    tips.push(`- Passive voice detected ${passiveMatches.length} time(s) (e.g. "${passiveMatches[0]}") — active voice usually reads stronger.`);
  }

  const adverbs = words.filter((w) => /\w{4,}ly$/i.test(w));
  if (adverbs.length > 3) {
    tips.push(`- ${adverbs.length} "-ly" adverbs found — trimming some (e.g. "${adverbs[0]}") can tighten the prose.`);
  }

  const repeats = new Map<string, number>();
  for (const w of words) {
    const key = w.toLowerCase().replace(/[^a-z]/g, "");
    if (key.length < 5) continue;
    repeats.set(key, (repeats.get(key) ?? 0) + 1);
  }
  const overused = [...repeats.entries()].filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1])[0];
  if (overused) {
    tips.push(`- "${overused[0]}" appears ${overused[1]} times — a synonym here or there could help variety.`);
  }

  if (sentences.length > 0 && words.length / sentences.length < 8) {
    tips.push("- Sentences are quite short and choppy — combining a few could improve flow.");
  }

  if (tips.length === 0) {
    tips.push("- Solid draft — sentence length, voice, and word variety all look balanced.");
  }

  return tips.join("\n");
}

const TONE_MARKERS: Record<ToneLabel, RegExp[]> = {
  casual: [/\b(gonna|wanna|kinda|yeah|awesome|super|lol|haha|hey|stuff|cool)\b/gi, /!{1,}/g, /\b(I'm|don't|can't|it's|you're)\b/gi],
  academic: [/\b(furthermore|therefore|hypothesis|research|analysis|methodology|significant|consequently|thus|empirical)\b/gi],
  humorous: [/\b(lol|haha|hilarious|joke|funny|kidding|wink|pun)\b/gi, /😂|🤣|😆/g],
  professional: [/\b(accordingly|pursuant|stakeholders|deliverable|strategic|leverage|objective|outcomes)\b/gi],
};

function scoreTone(content: string): ToneResult {
  const scores: Record<ToneLabel, number> = { professional: 0.5, casual: 0, academic: 0, humorous: 0 };
  for (const [tone, patterns] of Object.entries(TONE_MARKERS) as [ToneLabel, RegExp[]][]) {
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) scores[tone] += matches.length;
    }
  }
  const entries = Object.entries(scores) as [ToneLabel, number][];
  const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;
  const [tone, raw] = entries.sort((a, b) => b[1] - a[1])[0]!;
  const confidence = Math.min(0.95, Math.max(0.4, raw / total));
  return { tone, confidence: Math.round(confidence * 100) / 100 };
}

/**
 * Deterministic, network-free provider. Produces genuinely useful (if
 * simple) output from lightweight text heuristics rather than random
 * placeholder strings, so the feature is real and testable before a
 * Gemini API key ever exists.
 */
export class StubAIProvider implements AIProvider {
  readonly name = "stub";

  async *generateStream(req: GenerateRequest): AsyncIterable<string> {
    let text: string;
    switch (req.task) {
      case "title":
        text = buildTitle(req.content);
        break;
      case "description":
        text = buildDescription(req.content, req.title);
        break;
      case "twitter":
        text = buildTwitterThread(req.content);
        break;
      case "writing-suggestions":
        text = buildWritingSuggestions(req.content);
        break;
    }
    yield* streamText(text);
  }

  async analyzeTone(content: string): Promise<ToneResult> {
    return scoreTone(content);
  }
}

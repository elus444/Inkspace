import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiZap, FiCopy, FiCheck, FiAlertTriangle } from "react-icons/fi";
import { aiApi } from "../api/axios";
import { useDebounce } from "../hooks/useDebounce";

interface ReadabilityResult {
  fleschScore: number;
  gradeLevel: number;
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  tips: string[];
}

interface ToneResult {
  tone: "professional" | "casual" | "academic" | "humorous";
  confidence: number;
  provider: string;
}

interface AIAssistPanelProps {
  content: string;
  title: string;
  onApplyTitle: (title: string) => void;
}

/**
 * Streams a generative AI task from the ai-service and calls `onChunk` as
 * each piece of text arrives. Uses the raw fetch streaming API rather than
 * axios, since axios (via XHR in the browser) doesn't expose an incremental
 * reader the way `response.body.getReader()` does. This is the one place
 * in the app that needs it.
 */
async function streamAIRequest(
  path: string,
  body: Record<string, unknown>,
  onChunk: (chunk: string) => void
): Promise<{ provider: string | null; cache: string | null }> {
  const baseURL = (aiApi.defaults.baseURL as string) ?? "";
  const token = localStorage.getItem("authToken");

  const res = await fetch(`${baseURL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const message = await res.text().catch(() => "");
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }

  return {
    provider: res.headers.get("X-AI-Provider"),
    cache: res.headers.get("X-AI-Cache"),
  };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-taupe hover:text-maroon transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <FiCheck className="text-green-600" /> : <FiCopy />}
    </button>
  );
}

const TONE_COLORS: Record<ToneResult["tone"], string> = {
  professional: "text-maroon-dark bg-maroon/10",
  casual: "text-amber-700 bg-amber-500/10",
  academic: "text-ink-soft bg-taupe/15",
  humorous: "text-rose-700 bg-rose-500/10",
};

const AIAssistPanel = ({ content, title, onApplyTitle }: AIAssistPanelProps) => {
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [titleSuggestion, setTitleSuggestion] = useState("");
  const [descriptionSuggestion, setDescriptionSuggestion] = useState("");
  const [twitterThread, setTwitterThread] = useState("");
  const [writingTips, setWritingTips] = useState("");
  const [tone, setTone] = useState<ToneResult | null>(null);
  const [readability, setReadability] = useState<ReadabilityResult | null>(null);

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const debouncedContent = useDebounce(content, 500);

  // Guards against a slow earlier debounce tick overwriting a newer one's
  // result if content changes again before the first request finishes.
  const requestSeq = useRef(0);

  const setBusy = (key: string, value: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: value }));

  const runGenerate = async (
    key: string,
    path: string,
    body: Record<string, unknown>,
    onChunk: (text: string) => void
  ) => {
    setError(null);
    setBusy(key, true);
    onChunk(""); // reset before streaming in the new result
    let acc = "";
    try {
      const { provider: p } = await streamAIRequest(path, body, (chunk) => {
        acc += chunk;
        onChunk(acc);
      });
      if (p) setProvider(p);
    } catch (err) {
      console.error(`AI ${key} failed:`, err);
      setError("AI Assist is temporarily unavailable. Please try again.");
    } finally {
      setBusy(key, false);
    }
  };

  // Live writing suggestions, debounced 500ms after the user stops typing.
  useEffect(() => {
    if (!debouncedContent.trim()) {
      setWritingTips("");
      setReadability(null);
      return;
    }
    const seq = ++requestSeq.current;

    void runGenerate("writing", "/writing-suggestions", { content: debouncedContent }, (text) => {
      if (seq === requestSeq.current) setWritingTips(text);
    });

    void aiApi
      .post<ReadabilityResult>("/readability-score", { content: debouncedContent })
      .then((res) => {
        if (seq === requestSeq.current) setReadability(res.data);
      })
      .catch((err) => console.error("Readability score failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent]);

  const handleSuggestTitle = () =>
    runGenerate("title", "/suggest-title", { content }, setTitleSuggestion);

  const handleSuggestDescription = () =>
    runGenerate("description", "/suggest-description", { content, title }, setDescriptionSuggestion);

  const handleSuggestTwitter = () =>
    runGenerate("twitter", "/suggest-twitter", { content }, setTwitterThread);

  const handleAnalyzeTone = async () => {
    if (!content.trim()) return;
    setError(null);
    setBusy("tone", true);
    try {
      const res = await aiApi.post<ToneResult>("/analyze-tone", { content });
      setTone(res.data);
      setProvider(res.data.provider);
    } catch (err) {
      console.error("Tone analysis failed:", err);
      setError("AI Assist is temporarily unavailable. Please try again.");
    } finally {
      setBusy("tone", false);
    }
  };

  const disabled = !content.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 rounded-2xl border border-border-warm bg-parchment/60 p-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg italic text-ink">
          <FiZap className="text-maroon" size={16} /> AI Assist
        </h3>
        {provider === "stub" && (
          <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] text-taupe">
            Demo mode (no Gemini key set)
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-maroon/10 p-2 text-sm text-maroon-dark">
          <FiAlertTriangle /> <span>{error}</span>
        </div>
      )}

      {/* Live writing suggestions */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-taupe">
          Writing suggestions {loading.writing && <span className="text-maroon">&middot; thinking...</span>}
        </p>
        <pre className="min-h-[2.5rem] whitespace-pre-wrap rounded-lg bg-cream p-3 font-sans text-sm text-ink-soft">
          {writingTips || "Start typing and suggestions will appear here."}
        </pre>
      </div>

      {/* Readability */}
      {readability && (
        <div className="rounded-lg bg-cream p-3 text-sm text-ink-soft">
          <div className="mb-1 flex items-center gap-3">
            <span className="font-semibold text-ink">Readability: {readability.fleschScore}/100</span>
            <span className="text-taupe">Grade level ~{readability.gradeLevel}</span>
          </div>
          <ul className="list-inside list-disc space-y-0.5 text-ink-soft/90">
            {readability.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Generator buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || loading.title}
          onClick={handleSuggestTitle}
          className="rounded-full border border-border-warm bg-cream py-2 text-sm text-ink-soft transition-colors hover:border-maroon/40 hover:text-maroon disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading.title ? "Generating..." : "Suggest Title"}
        </button>
        <button
          type="button"
          disabled={disabled || loading.description}
          onClick={handleSuggestDescription}
          className="rounded-full border border-border-warm bg-cream py-2 text-sm text-ink-soft transition-colors hover:border-maroon/40 hover:text-maroon disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading.description ? "Generating..." : "SEO Description"}
        </button>
        <button
          type="button"
          disabled={disabled || loading.twitter}
          onClick={handleSuggestTwitter}
          className="rounded-full border border-border-warm bg-cream py-2 text-sm text-ink-soft transition-colors hover:border-maroon/40 hover:text-maroon disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading.twitter ? "Generating..." : "Twitter Thread"}
        </button>
        <button
          type="button"
          disabled={disabled || loading.tone}
          onClick={handleAnalyzeTone}
          className="rounded-full border border-border-warm bg-cream py-2 text-sm text-ink-soft transition-colors hover:border-maroon/40 hover:text-maroon disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading.tone ? "Analyzing..." : "Analyze Tone"}
        </button>
      </div>

      {tone && (
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${TONE_COLORS[tone.tone]}`}>
          <span className="font-semibold capitalize">{tone.tone}</span>
          <span className="opacity-70">{Math.round(tone.confidence * 100)}% confidence</span>
        </div>
      )}

      {titleSuggestion && (
        <div className="rounded-lg bg-cream p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-base italic text-ink">{titleSuggestion}</p>
            <div className="flex shrink-0 items-center gap-2">
              <CopyButton text={titleSuggestion} />
              <button
                type="button"
                onClick={() => onApplyTitle(titleSuggestion)}
                className="text-xs font-medium text-maroon hover:text-maroon-dark"
              >
                Use
              </button>
            </div>
          </div>
        </div>
      )}

      {descriptionSuggestion && (
        <div className="flex items-start justify-between gap-2 rounded-lg bg-cream p-3">
          <p className="text-sm text-ink-soft">{descriptionSuggestion}</p>
          <CopyButton text={descriptionSuggestion} />
        </div>
      )}

      {twitterThread && (
        <div className="flex items-start justify-between gap-2 rounded-lg bg-cream p-3">
          <pre className="whitespace-pre-wrap font-sans text-sm text-ink-soft">{twitterThread}</pre>
          <CopyButton text={twitterThread} />
        </div>
      )}
    </motion.div>
  );
};

export default AIAssistPanel;

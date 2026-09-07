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
 * reader the way `response.body.getReader()` does — this is the one place
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
      className="text-slate-400 hover:text-slate-200 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <FiCheck className="text-green-400" /> : <FiCopy />}
    </button>
  );
}

const TONE_COLORS: Record<ToneResult["tone"], string> = {
  professional: "text-blue-400 bg-blue-500/10",
  casual: "text-amber-400 bg-amber-500/10",
  academic: "text-purple-400 bg-purple-500/10",
  humorous: "text-pink-400 bg-pink-500/10",
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
      className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-slate-100 font-semibold">
          <FiZap className="text-indigo-400" /> AI Assist
        </h3>
        {provider === "stub" && (
          <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">
            Demo suggestions — connect a Gemini API key for live AI
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 text-sm p-2 rounded-lg flex items-center gap-2">
          <FiAlertTriangle /> <span>{error}</span>
        </div>
      )}

      {/* Live writing suggestions */}
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
          Writing suggestions {loading.writing && <span className="text-indigo-400">· thinking…</span>}
        </p>
        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3 min-h-[2.5rem]">
          {writingTips || "Start typing — suggestions appear here automatically."}
        </pre>
      </div>

      {/* Readability */}
      {readability && (
        <div className="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-semibold text-slate-100">Readability: {readability.fleschScore}/100</span>
            <span className="text-slate-500">Grade level ~{readability.gradeLevel}</span>
          </div>
          <ul className="list-disc list-inside text-slate-400 space-y-0.5">
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
          className="text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 rounded-lg py-2 transition-colors"
        >
          {loading.title ? "Generating…" : "Suggest Title"}
        </button>
        <button
          type="button"
          disabled={disabled || loading.description}
          onClick={handleSuggestDescription}
          className="text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 rounded-lg py-2 transition-colors"
        >
          {loading.description ? "Generating…" : "SEO Description"}
        </button>
        <button
          type="button"
          disabled={disabled || loading.twitter}
          onClick={handleSuggestTwitter}
          className="text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 rounded-lg py-2 transition-colors"
        >
          {loading.twitter ? "Generating…" : "Twitter Thread"}
        </button>
        <button
          type="button"
          disabled={disabled || loading.tone}
          onClick={handleAnalyzeTone}
          className="text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 rounded-lg py-2 transition-colors"
        >
          {loading.tone ? "Analyzing…" : "Analyze Tone"}
        </button>
      </div>

      {tone && (
        <div className={`text-sm rounded-lg px-3 py-2 inline-flex items-center gap-2 ${TONE_COLORS[tone.tone]}`}>
          <span className="font-semibold capitalize">{tone.tone}</span>
          <span className="opacity-70">{Math.round(tone.confidence * 100)}% confidence</span>
        </div>
      )}

      {titleSuggestion && (
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-slate-200">{titleSuggestion}</p>
            <div className="flex items-center gap-2 shrink-0">
              <CopyButton text={titleSuggestion} />
              <button
                type="button"
                onClick={() => onApplyTitle(titleSuggestion)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Use
              </button>
            </div>
          </div>
        </div>
      )}

      {descriptionSuggestion && (
        <div className="bg-slate-900/50 rounded-lg p-3 flex items-start justify-between gap-2">
          <p className="text-sm text-slate-200">{descriptionSuggestion}</p>
          <CopyButton text={descriptionSuggestion} />
        </div>
      )}

      {twitterThread && (
        <div className="bg-slate-900/50 rounded-lg p-3 flex items-start justify-between gap-2">
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200">{twitterThread}</pre>
          <CopyButton text={twitterThread} />
        </div>
      )}
    </motion.div>
  );
};

export default AIAssistPanel;

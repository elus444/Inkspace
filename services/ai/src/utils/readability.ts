/**
 * Readability scoring is deliberately NOT routed through the AI provider.
 * Flesch-Kincaid is a well-defined deterministic formula — running it
 * through an LLM would be slower, cost tokens, and be less accurate than
 * just computing it. This means the readability endpoint gives fully
 * correct results with zero provider dependency, whether or not a real
 * Gemini key is ever configured.
 */
export interface ReadabilityResult {
  fleschScore: number; // 0-100, higher = easier to read
  gradeLevel: number; // US school grade level
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  tips: string[];
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;
  const stripped = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  const matches = stripped.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
}

export function scoreReadability(content: string): ReadabilityResult {
  const sentences = splitSentences(content);
  const words = splitWords(content);
  const sentenceCount = Math.max(1, sentences.length);
  const wordCount = Math.max(1, words.length);
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;

  const fleschScoreRaw =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const gradeLevelRaw =
    0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  const fleschScore = Math.round(Math.min(100, Math.max(0, fleschScoreRaw)) * 10) / 10;
  const gradeLevel = Math.round(Math.max(0, gradeLevelRaw) * 10) / 10;

  const tips: string[] = [];
  if (avgWordsPerSentence > 25) {
    tips.push(
      `Average sentence length is ${avgWordsPerSentence.toFixed(1)} words — consider splitting long sentences for easier reading.`
    );
  }
  if (avgSyllablesPerWord > 1.7) {
    tips.push("Vocabulary skews complex — swapping in a few simpler words can widen your audience.");
  }
  const longestSentence = sentences.reduce(
    (longest, s) => (splitWords(s).length > splitWords(longest).length ? s : longest),
    ""
  );
  if (splitWords(longestSentence).length > 40) {
    tips.push("At least one sentence runs past 40 words — a strong candidate to break in two.");
  }
  if (fleschScore < 30) {
    tips.push("This reads at a very advanced level (college graduate+). That's fine for technical audiences, but consider simplifying for a general readership.");
  } else if (fleschScore > 80) {
    tips.push("This reads very easily — great for broad audiences, though double-check it still conveys the nuance you intend.");
  }
  if (tips.length === 0) {
    tips.push("Sentence length and word complexity are well balanced.");
  }

  return {
    fleschScore,
    gradeLevel,
    wordCount,
    sentenceCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    tips,
  };
}

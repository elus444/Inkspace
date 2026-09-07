import { createHash } from "node:crypto";

/** Deterministic cache key for a given AI task + its input. */
export function cacheKey(task: string, content: string, extra = ""): string {
  return createHash("sha256").update(`${task}:${extra}:${content}`).digest("hex");
}

import { analyticsApi } from "../api/axios";

/**
 * Every tracking call is fire-and-forget from the caller's point of view.
 * A slow or failed analytics request must never block or break the page a
 * real user is reading. Errors are swallowed here (not silently ignored,
 * just logged to the console) so callers don't need their own try/catch.
 */
function fireAndForget(promise: Promise<unknown>): void {
  promise.catch((err) => console.error("Analytics tracking failed:", err));
}

export function trackView(postId: string): void {
  fireAndForget(analyticsApi.post("/track-view", { postId, referrer: document.referrer || undefined }));
}

export function trackLike(postId: string): void {
  fireAndForget(analyticsApi.post("/track-like", { postId }));
}

export function trackComment(postId: string): void {
  fireAndForget(analyticsApi.post("/track", { type: "comment", postId }));
}

export function trackSave(postId: string): void {
  fireAndForget(analyticsApi.post("/track", { type: "save", postId }));
}

export function trackRepost(postId: string): void {
  fireAndForget(analyticsApi.post("/track", { type: "repost", postId }));
}

export function trackSignup(): void {
  fireAndForget(analyticsApi.post("/track", { type: "signup" }));
}

export function trackLogin(): void {
  fireAndForget(analyticsApi.post("/track", { type: "login" }));
}

/**
 * Reports how long a post was actually open for, via `sendBeacon` so the
 * request survives the tab closing/navigating away (a normal POST would be
 * cancelled mid-flight in that moment). Silently does nothing if the
 * duration is implausible (e.g. 0ms) or the browser lacks sendBeacon.
 */
export function trackReadTime(postId: string, durationMs: number): void {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return;
  const baseURL = (analyticsApi.defaults.baseURL as string) ?? "";
  const body = JSON.stringify({ postId, durationMs });

  if (typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(`${baseURL}/track-read-time`, blob);
  } else {
    fireAndForget(analyticsApi.post("/track-read-time", { postId, durationMs }));
  }
}

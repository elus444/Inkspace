import rateLimit from "express-rate-limit";

/**
 * First rate limiter in the codebase. AI calls are the most expensive
 * endpoints once a real provider key is attached, so they get protected
 * even while running on the free stub — the limit is cheap insurance that
 * costs nothing today and matters the moment GEMINI_API_KEY is set.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI requests, please slow down and try again shortly." },
});

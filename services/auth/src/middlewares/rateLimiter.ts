import rateLimit from "express-rate-limit";

/**
 * Login and register are classic brute-force / credential-stuffing
 * targets and previously had zero throttling. 20 attempts per 15 minutes
 * per IP is generous enough for a real user who mistypes a password a few
 * times, but shuts down automated guessing.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later." },
});

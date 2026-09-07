import express from "express";
import {
  suggestTitle,
  suggestDescription,
  suggestTwitter,
  writingSuggestions,
  analyzeTone,
  readabilityScore,
} from "../controllers/ai.controller.js";
import authMiddleware from "../middlewares/auth.js";
import { aiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.use(authMiddleware, aiRateLimiter);

router.post("/suggest-title", suggestTitle);
router.post("/suggest-description", suggestDescription);
router.post("/suggest-twitter", suggestTwitter);
router.post("/writing-suggestions", writingSuggestions);
router.post("/analyze-tone", analyzeTone);
router.post("/readability-score", readabilityScore);

export default router;

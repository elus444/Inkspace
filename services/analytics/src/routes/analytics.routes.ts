import express from "express";
import {
  trackView,
  trackReadTime,
  trackLike,
  trackGeneric,
  getDashboard,
  getPostsMetrics,
  getAuthorStats,
  getTrending,
} from "../controllers/analytics.controller.js";

const router = express.Router();

// Ingest — intentionally public (no JWT). None of this is sensitive data,
// and signup-tracking necessarily happens before a token exists.
router.post("/track-view", trackView);
router.post("/track-read-time", trackReadTime);
router.post("/track-like", trackLike);
router.post("/track", trackGeneric);

// Query — public, read-only, cached.
router.get("/dashboard", getDashboard);
router.get("/posts", getPostsMetrics);
router.get("/author-stats", getAuthorStats);
router.get("/trending", getTrending);

export default router;

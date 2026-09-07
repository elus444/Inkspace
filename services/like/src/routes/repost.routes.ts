import express from "express";
import {
  createRepost,
  removeRepost,
  getRepostStatus,
  getRepostCount,
  getMyReposts,
  getRepostFeed,
} from "../controllers/repost.controller.js";
import authMiddleware from "../middlewares/auth";

const router = express.Router();

router.post("/", authMiddleware, createRepost);
router.delete("/", authMiddleware, removeRepost);
router.get("/me", authMiddleware, getMyReposts);
router.get("/feed", getRepostFeed);
router.get("/post/:postId/reposted", authMiddleware, getRepostStatus);
router.get("/post/:postId/count", getRepostCount);

export default router;

import { Request, Response } from "express";
import Repost from "../models/repost.model.js";

interface AuthRequest extends Request {
  userId?: string;
}

const MAX_FEED_LIMIT = 50;
const DEFAULT_FEED_LIMIT = 12;

export const createRepost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ message: "postId required" });

    const repost = await Repost.create({ userId, postId });
    res.status(201).json(repost);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already reposted" });
    }
    res.status(500).json({ message: "Failed to repost", error: err.message || err });
  }
};

export const removeRepost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ message: "postId required" });

    const removed = await Repost.findOneAndDelete({ userId, postId });
    if (!removed) return res.status(404).json({ message: "Repost not found" });
    res.json({ message: "Un-reposted" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to remove repost", error: err.message || err });
  }
};

export const getRepostStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const exists = await Repost.exists({ userId, postId });
    res.json({ postId, reposted: Boolean(exists) });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to check repost status", error: err.message || err });
  }
};

export const getRepostCount = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const count = await Repost.countDocuments({ postId });
    res.json({ postId, count });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to get repost count", error: err.message || err });
  }
};

export const getMyReposts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const reposts = await Repost.find({ userId }).sort({ createdAt: -1 });
    res.json(reposts);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to get reposts", error: err.message || err });
  }
};

/**
 * Site-wide, public: the feed of everyone's recent reposts, used by Home
 * to merge reposts into the main feed so OTHER users see them too, not
 * just the reposter. Cursor-paginated on `before` (an ISO timestamp) to
 * match Home's "Load more" pattern.
 */
export const getRepostFeed = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(MAX_FEED_LIMIT, Math.max(1, parseInt(String(req.query.limit ?? ""), 10) || DEFAULT_FEED_LIMIT));
    const before = req.query.before;
    const query = typeof before === "string" && before.trim() ? { createdAt: { $lt: new Date(before) } } : {};

    const reposts = await Repost.find(query).sort({ createdAt: -1 }).limit(limit);
    res.json(reposts);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load repost feed", error: err.message || err });
  }
};

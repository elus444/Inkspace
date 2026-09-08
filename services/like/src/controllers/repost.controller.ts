import { Request, Response } from "express";
import Repost from "../models/repost.model.js";

interface AuthRequest extends Request {
  userId?: string;
}

const MAX_FEED_LIMIT = 50;
const DEFAULT_FEED_LIMIT = 12;

/** Rejects anything that isn't a plain non-empty string -- without this,
 *  a JSON body like {"postId": {"$ne": null}} would be passed straight
 *  into a Mongoose filter/document as an object instead of the id string
 *  the API contract expects. */
function isId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export const createRepost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.body ?? {};
    if (!isId(postId)) return res.status(400).json({ message: "postId required" });

    const repost = await Repost.create({ userId, postId });
    res.status(201).json(repost);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already reposted" });
    }
    console.error("Failed to repost:", err);
    res.status(500).json({ message: "Failed to repost" });
  }
};

export const removeRepost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.body ?? {};
    if (!isId(postId)) return res.status(400).json({ message: "postId required" });

    const removed = await Repost.findOneAndDelete({ userId, postId });
    if (!removed) return res.status(404).json({ message: "Repost not found" });
    res.json({ message: "Un-reposted" });
  } catch (err) {
    console.error("Failed to remove repost:", err);
    res.status(500).json({ message: "Failed to remove repost" });
  }
};

export const getRepostStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const exists = await Repost.exists({ userId, postId });
    res.json({ postId, reposted: Boolean(exists) });
  } catch (err) {
    console.error("Failed to check repost status:", err);
    res.status(500).json({ message: "Failed to check repost status" });
  }
};

export const getRepostCount = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const count = await Repost.countDocuments({ postId });
    res.json({ postId, count });
  } catch (err) {
    console.error("Failed to get repost count:", err);
    res.status(500).json({ message: "Failed to get repost count" });
  }
};

export const getMyReposts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const reposts = await Repost.find({ userId }).sort({ createdAt: -1 });
    res.json(reposts);
  } catch (err) {
    console.error("Failed to get reposts:", err);
    res.status(500).json({ message: "Failed to get reposts" });
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
    let query: Record<string, unknown> = {};
    if (typeof before === "string" && before.trim()) {
      const beforeDate = new Date(before);
      if (!Number.isNaN(beforeDate.getTime())) {
        query = { createdAt: { $lt: beforeDate } };
      }
    }

    const reposts = await Repost.find(query).sort({ createdAt: -1 }).limit(limit);
    res.json(reposts);
  } catch (err) {
    console.error("Failed to load repost feed:", err);
    res.status(500).json({ message: "Failed to load repost feed" });
  }
};

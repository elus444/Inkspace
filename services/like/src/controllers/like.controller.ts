import { Request, Response } from "express";
import Like from "../models/like.model.js";

interface AuthRequest extends Request {
  userId?: string;
}

/** Rejects anything that isn't a plain non-empty string -- without this,
 *  a JSON body like {"postId": {"$ne": null}} would be passed straight
 *  into a Mongoose filter/document as an object instead of the id string
 *  the API contract expects. */
function isId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export const createLike = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId, commentId } = req.body ?? {};
    if (!isId(postId) && !isId(commentId)) {
      return res.status(400).json({ message: "postId or commentId required" });
    }

    const like = new Like({ userId, postId: isId(postId) ? postId : undefined, commentId: isId(commentId) ? commentId : undefined });
    await like.save();
    res.status(201).json(like);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already liked" });
    }
    console.error("Failed to create like:", err);
    res.status(500).json({ message: "Failed to create like" });
  }
};

export const removeLike = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId, commentId } = req.body ?? {};
    if (!isId(postId) && !isId(commentId)) {
      return res.status(400).json({ message: "postId or commentId required" });
    }

    const query: Record<string, string> = { userId };
    if (isId(postId)) query.postId = postId;
    if (isId(commentId)) query.commentId = commentId;

    const removed = await Like.findOneAndDelete(query);
    if (!removed) return res.status(404).json({ message: "Like not found" });
    res.json({ message: "Unliked" });
  } catch (err) {
    console.error("Failed to remove like:", err);
    res.status(500).json({ message: "Failed to remove like" });
  }
};

export const getPostLikesCount = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const count = await Like.countDocuments({ postId });
    res.json({ postId, count });
  } catch (err) {
    console.error("Failed to get likes count:", err);
    res.status(500).json({ message: "Failed to get likes count" });
  }
};

export const getUserLikedPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const exists = await Like.exists({ userId, postId });
    res.json({ postId, liked: Boolean(exists) });
  } catch (err) {
    console.error("Failed to check like:", err);
    res.status(500).json({ message: "Failed to check like" });
  }
};

export const getUserLikes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const likes = await Like.find({ userId }).sort({ createdAt: -1 });
    res.json(likes);
  } catch (err) {
    console.error("Failed to get user likes:", err);
    res.status(500).json({ message: "Failed to get user likes" });
  }
};

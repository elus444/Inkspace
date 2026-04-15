import { Request, Response } from "express";
import Like from "../models/like.model.js";
import auth from "../middlewares/auth.js"


interface AuthRequest extends Request {
  userId?: string;
  user:string;
}
export const createLike = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId, commentId } = req.body;
    if (!postId && !commentId) return res.status(400).json({ message: "postId or commentId required" });

    const like = new Like({ userId, postId, commentId });
    await like.save();
    res.status(201).json(like);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already liked" });
    }
    res.status(500).json({ message: "Failed to create like", error: err.message || err });
  }
};

export const removeLike = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId, commentId } = req.body;
    if (!postId && !commentId) return res.status(400).json({ message: "postId or commentId required" });

    const query: any = { userId };
    if (postId) query.postId = postId;
    if (commentId) query.commentId = commentId;

    const removed = await Like.findOneAndDelete(query);
    if (!removed) return res.status(404).json({ message: "Like not found" });
    res.json({ message: "Unliked" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to remove like", error: err.message || err });
  }
};

export const getPostLikesCount = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const count = await Like.countDocuments({ postId });
    res.json({ postId, count });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to get likes count", error: err.message || err });
  }
};

export const getUserLikedPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const exists = await Like.exists({ userId, postId });
    res.json({ postId, liked: Boolean(exists) });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to check like", error: err.message || err });
  }
};

export const getUserLikes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const likes = await Like.find({ userId }).sort({ createdAt: -1 });
    res.json(likes);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to get user likes", error: err.message || err });
  }
};

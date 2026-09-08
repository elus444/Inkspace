import { Request, Response } from "express";
import Comment from "../models/comment.model.js";

interface AuthRequest extends Request {
  userId?: string;
}

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.userId;
    if (!authorId) return res.status(401).json({ message: "Unauthorized" });

    const { postId, content } = req.body ?? {};
    if (typeof postId !== "string" || !postId.trim() || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "postId and content are required" });
    }

    const comment = await Comment.create({ postId, authorId, content });
    res.status(201).json(comment);
  } catch (error) {
    console.error("Failed to create comment:", error);
    res.status(500).json({ message: "Failed to create comment" });
  }
};

export const getCommentsByPost = async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.authorId !== req.userId) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    const { content } = req.body ?? {};
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "content must be a non-empty string" });
    }
    comment.content = content;
    await comment.save();
    res.json(comment);
  } catch (error) {
    console.error("Failed to update comment:", error);
    res.status(500).json({ message: "Failed to update comment" });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.authorId !== req.userId) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

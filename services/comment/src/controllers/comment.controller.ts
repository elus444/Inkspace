import { Request, Response } from "express";
import Comment from "../models/comment.model.js";

interface AuthRequest extends Request {
  userId?: string;
  user:string;
}

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.userId;
    const { postId, content } = req.body;
    const comment = await Comment.create({ postId, authorId, content });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Failed to create comment", error });
  }
};


export const getCommentsByPost = async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments", error });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: "Failed to update comment", error });
  }
};


export const deleteComment = async (req: Request, res: Response) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete comment", error });
  }
};

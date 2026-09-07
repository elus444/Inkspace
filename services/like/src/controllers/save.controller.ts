import { Request, Response } from "express";
import SavedPost from "../models/savedPost.model.js";

interface AuthRequest extends Request {
  userId?: string;
}

export const createSave = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ message: "postId required" });

    const saved = await SavedPost.create({ userId, postId });
    res.status(201).json(saved);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already saved" });
    }
    res.status(500).json({ message: "Failed to save post", error: err.message || err });
  }
};

export const removeSave = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ message: "postId required" });

    const removed = await SavedPost.findOneAndDelete({ userId, postId });
    if (!removed) return res.status(404).json({ message: "Save not found" });
    res.json({ message: "Unsaved" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to unsave post", error: err.message || err });
  }
};

export const getSaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const exists = await SavedPost.exists({ userId, postId });
    res.json({ postId, saved: Boolean(exists) });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to check save status", error: err.message || err });
  }
};

export const getMySaves = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const saves = await SavedPost.find({ userId }).sort({ createdAt: -1 });
    res.json(saves);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to get saved posts", error: err.message || err });
  }
};

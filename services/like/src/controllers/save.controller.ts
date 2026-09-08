import { Request, Response } from "express";
import SavedPost from "../models/savedPost.model.js";

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

export const createSave = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.body ?? {};
    if (!isId(postId)) return res.status(400).json({ message: "postId required" });

    const saved = await SavedPost.create({ userId, postId });
    res.status(201).json(saved);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already saved" });
    }
    console.error("Failed to save post:", err);
    res.status(500).json({ message: "Failed to save post" });
  }
};

export const removeSave = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.body ?? {};
    if (!isId(postId)) return res.status(400).json({ message: "postId required" });

    const removed = await SavedPost.findOneAndDelete({ userId, postId });
    if (!removed) return res.status(404).json({ message: "Save not found" });
    res.json({ message: "Unsaved" });
  } catch (err) {
    console.error("Failed to unsave post:", err);
    res.status(500).json({ message: "Failed to unsave post" });
  }
};

export const getSaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const exists = await SavedPost.exists({ userId, postId });
    res.json({ postId, saved: Boolean(exists) });
  } catch (err) {
    console.error("Failed to check save status:", err);
    res.status(500).json({ message: "Failed to check save status" });
  }
};

export const getMySaves = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const saves = await SavedPost.find({ userId }).sort({ createdAt: -1 });
    res.json(saves);
  } catch (err) {
    console.error("Failed to get saved posts:", err);
    res.status(500).json({ message: "Failed to get saved posts" });
  }
};

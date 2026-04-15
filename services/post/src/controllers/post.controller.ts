import { Request, Response } from "express";
import Post from "../models/post.model.js";

interface AuthRequest extends Request {
  userId?: string;
  user:string;
}

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.userId;
    if (!authorId) return res.status(401).json({ message: "Unauthorized" });
    const { title, content, tags } = req.body;
    const post = await Post.create({ title, content, authorId, tags });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to create post", error });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts", error });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch post", error });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to update post", error });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete post", error });
  }
};

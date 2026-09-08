import { Request, Response } from "express";
import Post from "../models/post.model.js";

interface AuthRequest extends Request {
  userId?: string;
}

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.userId;
    if (!authorId) return res.status(401).json({ message: "Unauthorized" });

    const { title, content, tags } = req.body ?? {};
    if (typeof title !== "string" || !title.trim() || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "title and content are required" });
    }
    const cleanTags = Array.isArray(tags) ? tags.filter((t) => typeof t === "string") : undefined;

    const post = await Post.create({ title, content, authorId, tags: cleanTags });
    res.status(201).json(post);
  } catch (error) {
    console.error("Failed to create post:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

const MAX_IDS = 100;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

/**
 * Three modes on one route, all returning the same {posts,total,hasMore}
 * shape, to keep the frontend's call sites simple:
 *  - ?ids=a,b,c    exactly those posts (batch-resolving reposted posts /
 *                  trending-post titles without over-fetching)
 *  - ?authorId=X   all of one author's posts, newest first (the "my posts"
 *                  query -- replaces fetching every post and filtering
 *                  client-side)
 *  - (default)     paginated feed, newest first
 */
export const getPosts = async (req: Request, res: Response) => {
  try {
    const idsParam = req.query.ids;
    if (typeof idsParam === "string" && idsParam.trim()) {
      const ids = [...new Set(idsParam.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAX_IDS);
      const posts = await Post.find({ _id: { $in: ids } }).sort({ createdAt: -1 });
      return res.json({ posts, total: posts.length, hasMore: false });
    }

    const authorId = req.query.authorId;
    if (typeof authorId === "string" && authorId.trim()) {
      const posts = await Post.find({ authorId }).sort({ createdAt: -1 });
      return res.json({ posts, total: posts.length, hasMore: false });
    }

    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit ?? ""), 10) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(),
    ]);
    res.json({ posts, total, hasMore: skip + posts.length < total });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    console.error("Failed to fetch post:", error);
    res.status(500).json({ message: "Failed to fetch post" });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.authorId !== req.userId) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    // Whitelist exactly the fields a client may change -- never pass
    // req.body straight into an update. Mongoose treats top-level `$`-keys
    // in an update document as raw operators, so forwarding an unfiltered
    // body would let a caller reassign authorId or run arbitrary $unset/
    // $rename operators against a document they're allowed to touch at all.
    const { title, content, tags } = req.body ?? {};
    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return res.status(400).json({ message: "title must be a non-empty string" });
    }
    if (content !== undefined && (typeof content !== "string" || !content.trim())) {
      return res.status(400).json({ message: "content must be a non-empty string" });
    }
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (tags !== undefined) post.tags = Array.isArray(tags) ? tags.filter((t) => typeof t === "string") : [];

    await post.save();
    res.json(post);
  } catch (error) {
    console.error("Failed to update post:", error);
    res.status(500).json({ message: "Failed to update post" });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.authorId !== req.userId) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Failed to delete post:", error);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

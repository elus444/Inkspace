import express from "express";
import { createLike, removeLike, getPostLikesCount, getUserLikedPost, getUserLikes } from "../controllers/like.controller.js";
import authMiddleware from "../middlewares/auth";
const router = express.Router();

router.post("/", authMiddleware, createLike);          
router.delete("/", authMiddleware, removeLike);    
router.get("/post/:postId/count", getPostLikesCount);  
router.get("/post/:postId/liked", authMiddleware, getUserLikedPost);
router.get("/me", authMiddleware, getUserLikes);            

export default router;

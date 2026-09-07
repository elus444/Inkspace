import express from "express";
import { createSave, removeSave, getSaveStatus, getMySaves } from "../controllers/save.controller.js";
import authMiddleware from "../middlewares/auth";

const router = express.Router();

router.post("/", authMiddleware, createSave);
router.delete("/", authMiddleware, removeSave);
router.get("/me", authMiddleware, getMySaves);
router.get("/post/:postId/saved", authMiddleware, getSaveStatus);

export default router;

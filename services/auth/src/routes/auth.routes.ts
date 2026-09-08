import express from "express";
import { registerUser, loginUser, getUsersByIds } from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/register", authRateLimiter, registerUser);
router.post("/login", authRateLimiter, loginUser);
router.get("/users", getUsersByIds);

export default router;

import express from "express";
import { registerUser, loginUser, getUsersByIds } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", getUsersByIds);

export default router;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();

// Render (and most PaaS hosts) sit behind a reverse proxy -- without this,
// express-rate-limit reads the proxy's own IP for every request instead of
// the real client's X-Forwarded-For, bucketing every visitor together.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

export default app;

import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

// Render (and most PaaS hosts) sit behind a reverse proxy -- without this,
// express-rate-limit reads the proxy's own IP for every request instead of
// the real client's X-Forwarded-For, bucketing every visitor together.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/ai", aiRoutes);

export default app;

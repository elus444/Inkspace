import express from "express";
import cors from "cors";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

app.use(cors());
// sendBeacon's Blob defaults to no explicit charset and some browsers send
// `text/plain;charset=UTF-8` for a JSON-stringified beacon body — accept
// both so track-read-time isn't silently dropped by a strict content-type check.
app.use(express.json({ type: ["application/json", "text/plain"] }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/analytics", analyticsRoutes);

export default app;

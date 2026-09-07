import express from "express";
import cors from "cors";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

// `navigator.sendBeacon` (used by track-read-time) always sends its request
// with credentials mode "include", per spec — browsers then reject a
// literal wildcard `Access-Control-Allow-Origin: *` response outright, even
// though nothing here actually uses cookies. Reflecting the request's own
// origin (rather than "*") plus allowing credentials satisfies that check
// without narrowing access, since these endpoints are meant to be public
// from any origin anyway.
app.use(cors({ origin: true, credentials: true }));
// sendBeacon's Blob defaults to no explicit charset and some browsers send
// `text/plain;charset=UTF-8` for a JSON-stringified beacon body — accept
// both so track-read-time isn't silently dropped by a strict content-type check.
app.use(express.json({ type: ["application/json", "text/plain"] }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/analytics", analyticsRoutes);

export default app;

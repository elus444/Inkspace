import express from "express";
import cors from "cors";
import likeRoutes from "./routes/like.routes.js";
import saveRoutes from "./routes/save.routes.js";
import repostRoutes from "./routes/repost.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/likes", likeRoutes);
// Saves (private bookmarks) and reposts (public shares) live in this same
// service since they're the identical userId+postId relationship pattern
// as Like -- no new service, no new deployment, no new database needed.
app.use("/api/saves", saveRoutes);
app.use("/api/reposts", repostRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

export default app;

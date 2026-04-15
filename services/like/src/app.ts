import express from "express";
import cors from "cors";
import likeRoutes from "./routes/like.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/likes", likeRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

export default app;

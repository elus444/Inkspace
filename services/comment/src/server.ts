import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import commentRoutes from "./routes/comment.routes.js";
import cors from "cors";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/comments", commentRoutes);

mongoose.connect(process.env.MONGO_URL as string)
  .then(() => console.log("Comment DB connected"))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Comment service running on port ${PORT}`));

import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 5001;
const MONGO_URL = process.env.MONGO_URL

mongoose
  .connect(MONGO_URL as string)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`Post service running on port ${PORT}`);
});

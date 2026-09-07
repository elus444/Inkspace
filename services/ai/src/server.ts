import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5004;
const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL as string)
  .then(() => console.log("AI service: MongoDB connected"))
  .catch((err) => console.error("AI service: MongoDB connection error:", err));

if (!process.env.GEMINI_API_KEY?.trim()) {
  console.log("AI service: no GEMINI_API_KEY set — running on the offline stub provider");
}

app.listen(PORT, () => {
  console.log(`AI service running on port ${PORT}`);
});

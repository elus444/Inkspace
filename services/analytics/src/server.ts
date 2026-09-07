import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { initSocket } from "./socket.js";

dotenv.config();

// Defense-in-depth: every route handler already catches its own errors, but
// a stray rejection (e.g. a Mongo timeout firing after a Promise.all has
// already settled) should be logged loudly rather than silently killing the
// only instance this free-tier service runs.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection in analytics service:", reason);
});

const PORT = process.env.PORT || 5005;
const MONGO_URL = process.env.MONGO_URL;

const server = http.createServer(app);
initSocket(server);

mongoose
  .connect(MONGO_URL as string)
  .then(() => console.log("Analytics service: MongoDB connected"))
  .catch((err) => console.error("Analytics service: MongoDB connection error:", err));

server.listen(PORT, () => {
  console.log(`Analytics service running on port ${PORT}`);
});

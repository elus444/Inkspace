import mongoose, { Schema, Document } from "mongoose";

export interface IAICache extends Document {
  key: string;
  task: string;
  output: string;
  createdAt: Date;
}

const aiCacheSchema = new Schema<IAICache>({
  key: { type: String, required: true, unique: true },
  task: { type: String, required: true },
  output: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 }, // 24h TTL
});

export default mongoose.model<IAICache>("AICache", aiCacheSchema);

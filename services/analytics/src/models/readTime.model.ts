import mongoose, { Schema, Document } from "mongoose";

/** Reported asynchronously via `navigator.sendBeacon` on page-leave, so it
 *  lives separately from the initial PostViewed event rather than trying to
 *  update that event in place (no reliable id to correlate them by, and a
 *  beacon request must be a single fire-and-forget POST). */
export interface IReadTime extends Document {
  postId: string;
  durationMs: number;
  createdAt: Date;
}

const readTimeSchema = new Schema<IReadTime>(
  {
    postId: { type: String, required: true, index: true },
    durationMs: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IReadTime>("ReadTime", readTimeSchema);

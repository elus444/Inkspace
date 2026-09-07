import mongoose, { Document, Schema } from "mongoose";

/**
 * A public share -- unlike SavedPost (a private bookmark), reposts are
 * visible to other users: they show up in the site-wide feed endpoint so
 * Home can merge them into everyone's feed with a "Reposted by ___" tag.
 */
export interface IRepost extends Document {
  userId: string;
  postId: string;
  createdAt: Date;
}

const repostSchema = new Schema<IRepost>(
  {
    userId: { type: String, required: true, index: true },
    postId: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

repostSchema.index({ userId: 1, postId: 1 }, { unique: true });
// Backs the site-wide feed endpoint (newest reposts first) and the
// per-post repost count.
repostSchema.index({ createdAt: -1 });

export default mongoose.model<IRepost>("Repost", repostSchema);

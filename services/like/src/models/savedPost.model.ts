import mongoose, { Document, Schema } from "mongoose";

/**
 * A private bookmark -- only the saving user ever sees this (unlike Repost,
 * which is public). Same userId+postId shape as Like, deliberately, since
 * it's the identical "does this user have a relationship to this post"
 * pattern.
 */
export interface ISavedPost extends Document {
  userId: string;
  postId: string;
  createdAt: Date;
}

const savedPostSchema = new Schema<ISavedPost>(
  {
    userId: { type: String, required: true, index: true },
    postId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

savedPostSchema.index({ userId: 1, postId: 1 }, { unique: true });

export default mongoose.model<ISavedPost>("SavedPost", savedPostSchema);

import mongoose, { Document, Schema } from "mongoose";

export interface ILike extends Document {
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    userId: { type: String, required: true, index: true },
    postId: { type: String, required: function() { return !this.commentId; } },
    commentId: { type: String, required: function() { return !this.postId; } }
  },
  { timestamps: true }
);

likeSchema.index({ userId: 1, postId: 1 }, { unique: true, partialFilterExpression: { postId: { $exists: true } } });
likeSchema.index({ userId: 1, commentId: 1 }, { unique: true, partialFilterExpression: { commentId: { $exists: true } } });

export default mongoose.model<ILike>("Like", likeSchema);

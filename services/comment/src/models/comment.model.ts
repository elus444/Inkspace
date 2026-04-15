import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema: Schema = new Schema<IComment>(
  {
    postId: { type: String, required: true },
    authorId: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IComment>("Comment", commentSchema);
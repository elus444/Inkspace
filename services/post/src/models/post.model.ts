import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  authorId: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema: Schema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: String, required: true },
    tags: { type: [String] },
  },
  { timestamps: true }
);

export default mongoose.model<IPost>("Post", postSchema);

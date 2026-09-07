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

// Backs the home feed (newest-first, paginated) and the "my posts" /
// author-scoped queries added for the Analytics/Library pages.
postSchema.index({ createdAt: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });

export default mongoose.model<IPost>("Post", postSchema);

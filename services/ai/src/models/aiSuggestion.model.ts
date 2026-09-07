import mongoose, { Schema, Document } from "mongoose";

/**
 * Log of every AI suggestion served, for future analytics (which task types
 * get used most, which provider served them, per-user/per-post usage). Not
 * itself an analytics dashboard — feature 3 will read this collection.
 */
export interface IAISuggestion extends Document {
  userId: string;
  postId?: string;
  task: string;
  provider: string;
  createdAt: Date;
}

const aiSuggestionSchema = new Schema<IAISuggestion>(
  {
    userId: { type: String, required: true, index: true },
    postId: { type: String },
    task: { type: String, required: true },
    provider: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IAISuggestion>("AISuggestion", aiSuggestionSchema);

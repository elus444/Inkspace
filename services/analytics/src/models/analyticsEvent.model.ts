import mongoose, { Schema, Document } from "mongoose";

export type AnalyticsEventType =
  | "PostViewed"
  | "PostLiked"
  | "PostCommented"
  | "UserSignup"
  | "UserLogin";

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface IAnalyticsEvent extends Document {
  type: AnalyticsEventType;
  postId?: string;
  userId?: string;
  referrer?: string;
  device?: DeviceType;
  country?: string;
  createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    type: {
      type: String,
      required: true,
      enum: ["PostViewed", "PostLiked", "PostCommented", "UserSignup", "UserLogin"],
    },
    postId: { type: String, index: true },
    userId: { type: String },
    referrer: { type: String },
    device: { type: String, enum: ["mobile", "tablet", "desktop"] },
    country: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Every query in this service filters by type + a time window, and often
// also by postId — this compound index covers the common cases directly.
analyticsEventSchema.index({ type: 1, createdAt: -1 });
analyticsEventSchema.index({ postId: 1, type: 1, createdAt: -1 });

export default mongoose.model<IAnalyticsEvent>("AnalyticsEvent", analyticsEventSchema);

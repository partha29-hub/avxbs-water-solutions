import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    // Existing field retained for old video records.
    videoUrl: { type: String, required: true },

    publicId: { type: String, default: "" },
    resourceType: {
      type: String,
      enum: ["image", "video"],
      default: "video",
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "video",
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Media =
  mongoose.models.Media || mongoose.model("Media", mediaSchema);

export default Media;
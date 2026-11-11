import mongoose from "mongoose";

const websiteSettingsSchema = new mongoose.Schema(
  {
    logoUrl: {
      type: String,
      default: "/assets/logo/avxbs-logo.png",
      trim: true,
    },
    logoPublicId: {
      type: String,
      default: "",
      trim: true,
    },
    siteName: {
      type: String,
      default: "AVXBS Water Solutions",
      trim: true,
    },
  },
  { credentials: true, timestamps: true }
);

const WebsiteSettings =
  mongoose.models.WebsiteSettings ||
  mongoose.model("WebsiteSettings", websiteSettingsSchema);

export default WebsiteSettings;


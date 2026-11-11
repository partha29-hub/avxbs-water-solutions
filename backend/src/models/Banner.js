import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Subtitle cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    mediaUrl: {
      type: String,
      required: [true, "Banner media URL is required"],
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
      required: true,
      index: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    posterUrl: {
      type: String,
      default: "",
      trim: true,
    },
    posterPublicId: {
      type: String,
      default: "",
      trim: true,
    },
    // Maintained for backward compatibility
    desktopImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    desktopImagePublicId: {
      type: String,
      trim: true,
      default: "",
    },
    buttonText: {
      type: String,
      trim: true,
      default: "",
      maxlength: [50, "Button text cannot exceed 50 characters"],
    },
    buttonLink: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Button link cannot exceed 300 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure mediaUrl and desktopImageUrl stay in sync
bannerSchema.pre("save", function (next) {
  if (this.mediaUrl && !this.desktopImageUrl) {
    this.desktopImageUrl = this.mediaUrl;
  }
  if (!this.mediaUrl && this.desktopImageUrl) {
    this.mediaUrl = this.desktopImageUrl;
  }
  if (this.publicId && !this.desktopImagePublicId) {
    this.desktopImagePublicId = this.publicId;
  }
  next();
});

// Compound index for fast public hero queries
bannerSchema.index({ isActive: 1, order: 1, createdAt: -1 });

const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);

export default Banner;

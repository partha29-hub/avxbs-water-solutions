import mongoose from "mongoose";

const highlightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
    },

    label: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    icon: {
      type: String,
      default: "Sparkles",
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    buttonText: {
      type: String,
      default: "Explore",
      trim: true,
    },

    buttonAction: {
      type: String,
      default: "inquiry", // "inquiry" | "whatsapp" | "link"
      trim: true,
    },

    buttonLink: {
      type: String,
      default: "",
      trim: true,
    },

    audience: {
      type: String,
      enum: ["Residential", "Commercial", "Both"],
      default: "Both",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Highlight =
  mongoose.models.Highlight ||
  mongoose.model("Highlight", highlightSchema);

export default Highlight;

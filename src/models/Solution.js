
import mongoose from "mongoose";

const solutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    audience: {
  type: String,
  enum: ["Residential", "Commercial", "Both"],
  required: true,
},

    category: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    badge: {
      type: String,
      default: "",
    },

    benefits: [{
      type: String,
      trim: true,
    }],

    isFeatured: {
      type: Boolean,
      default: false,
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

const Solution =
  mongoose.models.Solution ||
  mongoose.model("Solution", solutionSchema);

export default Solution;

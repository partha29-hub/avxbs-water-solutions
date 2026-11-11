import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, required: true, trim: true },

    // Inquiry classification
    audience: {
      type: String,
      enum: ["Residential", "Commercial", ""],
      default: "",
      index: true,
    },
    section: {
      type: String,
      default: "",
      index: true,
    },
    tabId: {
      type: String,
      default: "",
      index: true,
    },
    tabName: {
      type: String,
      default: "",
    },
    solutionId: {
      type: String,
      default: "",
    },

    category: { type: String, default: "" },
    subject: { type: String, default: "" },
    message: { type: String, default: "" },
    product: { type: String, default: "" },

    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["New", "Contacted", "Completed"],
      default: "New",
      index: true,
    },
  },
  { timestamps: true }
);

const Inquiry =
  mongoose.models.Inquiry ||
  mongoose.model("Inquiry", inquirySchema);

export default Inquiry;

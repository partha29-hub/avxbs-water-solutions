import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "text", "number", "email", "phone", "textarea",
        "dropdown", "radio", "checkbox", "date",
      ],
      default: "text",
    },
    placeholder: { type: String, default: "" },
    required: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    options: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const dynamicTabSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Residential", "Commercial", "Both"],
      default: "Both",
    },
    fields: { type: [fieldSchema], default: [] },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const DynamicTab =
  mongoose.models.DynamicTab ||
  mongoose.model("DynamicTab", dynamicTabSchema);

export default DynamicTab;
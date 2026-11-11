
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

const audienceFormSchema = new mongoose.Schema(
  {
    audience: {
      type: String,
      enum: ["Residential", "Commercial"],
      required: true,
    },
    fields: { type: [fieldSchema], default: [] },
  },
  { _id: false }
);

const productFormSchema = new mongoose.Schema(
  {
    solutionId: { type: String, required: true },
    solutionName: { type: String, required: true },
    audience: {
      type: String,
      enum: ["Residential", "Commercial"],
      required: true,
    },
    forms: { type: [audienceFormSchema], default: [] },
  },
  { _id: false }
);

const formConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "main-inquiry-form",
      unique: true,
    },
    products: { type: [productFormSchema], default: [] },
  },
  { timestamps: true }
);

const FormConfig =
  mongoose.models.FormConfig ||
  mongoose.model("FormConfig", formConfigSchema);

export default FormConfig;

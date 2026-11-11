import mongoose from "mongoose";

const assistanceSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    buttonLabel: { type: String, default: "Need Assistance?" },
    openingMessage: {
      type: String,
      default:
        "Hello AVXBS Team, I need assistance with your water treatment solutions. Please share more details.",
    },
    departments: {
      type: [
        {
          name: { type: String, required: true },
          phone: { type: String, required: true },
          isActive: { type: Boolean, default: true },
        },
      ],
      default: [
        {
          name: "General Enquiry",
          phone: "919692625703",
          isActive: true,
        },
      ],
    },
    defaultDepartment: { type: String, default: "General Enquiry" },
  },
  { timestamps: true }
);

const Assistance =
  mongoose.models.Assistance ||
  mongoose.model("Assistance", assistanceSchema);

export default Assistance;
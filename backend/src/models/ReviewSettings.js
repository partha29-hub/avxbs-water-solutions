import mongoose from "mongoose";

const reviewSettingsSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      default: "REVIEWS",
      trim: true,
    },
    subtitle: {
      type: String,
      default: "From our clients",
      trim: true,
    },
    backgroundImageUrl: {
      type: String,
      default: "",
    },
    backgroundPublicId: {
      type: String,
      default: "",
    },
    feedbackHeading: {
      type: String,
      default: "Share Your Experience",
      trim: true,
    },
    feedbackSubtitle: {
      type: String,
      default: "We value your trust and feedback. Tell us about your journey with AVXBS water solutions.",
      trim: true,
    },
    enablePublicSubmissions: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ReviewSettings =
  mongoose.models.ReviewSettings ||
  mongoose.model("ReviewSettings", reviewSettingsSchema);

export default ReviewSettings;


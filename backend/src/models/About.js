import mongoose from "mongoose";

const statisticSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      trim: true,
    },
    suffix: {
      type: String,
      default: "%",
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const aboutSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      default: "About AVXBS",
      trim: true,
    },
    tagline: {
      type: String,
      default:
        "Delivering advanced, unique solutions for residential and commercial infrastructure.",
      trim: true,
    },
    introductionHeading: {
      type: String,
      default: "Company Introduction & Overview",
      trim: true,
    },
    introductionParagraphs: {
      type: [String],
      default: [
        "AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.",
        "Water hardness causes persistent scale deposition, plumbing deterioration, reduced thermal efficiency in water heaters, and premature appliance failure. At AVXBS, we merge precision chemical engineering with intelligent automated flow sensing to eliminate calcium and magnesium hardness at the point of entry.",
        "From luxury residences and high-rise apartments to industrial boiler feeds and commercial hospitality complexes, our engineered solutions protect equipment, elevate water quality, and optimize resource efficiency.",
      ],
    },
    establishmentStatement: {
      type: String,
      default:
        "Established in [YEAR], AVXBS is committed to delivering innovative water treatment and purification solutions for homes and industries.",
      trim: true,
    },
    establishmentYear: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    imagePublicId: {
      type: String,
      default: "",
    },
    statistics: {
      type: [statisticSchema],
      default: [
        {
          value: "99.8",
          suffix: "%",
          label: "Scale Reduction",
          order: 0,
          isActive: true,
        },
        {
          value: "50",
          suffix: "%",
          label: "Lower Salt Consumption",
          order: 1,
          isActive: true,
        },
        {
          value: "100",
          suffix: "%",
          label: "Food-Grade Resins",
          order: 2,
          isActive: true,
        },
      ],
    },
  },
  { timestamps: true }
);

const About = mongoose.models.About || mongoose.model("About", aboutSchema);

export default About;


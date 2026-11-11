
import mongoose from "mongoose";

const footerSchema = new mongoose.Schema(
  {
    brandTagline: {
      type: String,
      default: "PURE WATER. BETTER LIVING.",
    },
    topMessage: {
      type: String,
      default: "Engineering Pure Water for Homes & Enterprises",
    },
    aboutHeading: {
      type: String,
      default: "About AVXBS",
    },
    aboutDescription: {
      type: String,
      default: "AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.",
    },
    highlightText: {
      type: String,
      default: "Smart Water Treatment Solutions",
    },
    contactHeading: {
      type: String,
      default: "Contact & Support",
    },
    contactDescription: {
      type: String,
      default: "We're here to help you.",
    },
    addressHeading: {
      type: String,
      default: "Headquarters",
    },
    address: {
      type: String,
      default: "[Official Company Address - To Be Provided]",
    },
    phoneHeading: {
      type: String,
      default: "Helpline",
    },
    phone: {
      type: String,
      default: "[Toll-Free / Support Phone - To Be Provided]",
    },
    emailHeading: {
      type: String,
      default: "Email",
    },
    email: {
      type: String,
      default: "[Official Support Email - To Be Provided]",
    },
    legalLinks: {
      type: [
        {
          label: String,
          url: String,
          isActive: { type: Boolean, default: true },
        },
      ],
      default: [
        { label: "Privacy Policy", url: "#privacy", isActive: true },
        { label: "Legal", url: "#terms", isActive: true },
        { label: "Warranty & Service", url: "#warranty", isActive: true },
      ],
    },
    socialLinks: {
      type: [
        {
          platform: String,
          url: String,
          isActive: { type: Boolean, default: true },
        },
      ],
      default: [
        { platform: "Facebook", url: "#facebook", isActive: true },
        { platform: "X", url: "#x", isActive: true },
        { platform: "Instagram", url: "#instagram", isActive: true },
        { platform: "YouTube", url: "#youtube", isActive: true },
        { platform: "LinkedIn", url: "#linkedin", isActive: true },
      ],
    },
    copyrightCompany: {
      type: String,
      default: "AVXBS Solutions",
    },
    rightsText: {
      type: String,
      default: "All Rights Reserved.",
    },
    showCopyrightYear: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Footer =
  mongoose.models.Footer || mongoose.model("Footer", footerSchema);

export default Footer;

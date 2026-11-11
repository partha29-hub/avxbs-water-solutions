import Footer from "../models/Footer.js";

const defaultFooterData = {
  brandTagline: "PURE WATER. BETTER LIVING.",
  topMessage: "Engineering Pure Water for Homes & Enterprises",
  aboutHeading: "About AVXBS",
  aboutDescription:
    "AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.",
  highlightText: "Smart Water Treatment Solutions",
  socialLinks: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
  },
  contactInfo: {
    phone: "+91 96926 25703",
    email: "support@avxbs.com",
    address: "AVXBS Water Treatment Systems, Industrial Corridor, India",
    workingHours: "Mon - Sat: 9:00 AM - 7:00 PM",
  },
  copyrightText: "© 2026 AVXBS Water Systems. All rights reserved.",
};

// GET footer
export const getFooter = async (req, res, next) => {
  try {
    let footer = await Footer.findOne().lean();

    if (!footer) {
      footer = await Footer.create(defaultFooterData);
    }

    return res.json({
      success: true,
      footer,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: PUT update footer
export const updateFooter = async (req, res, next) => {
  try {
    const updates = req.body;

    let footer = await Footer.findOne();
    if (!footer) {
      footer = new Footer(defaultFooterData);
    }

    Object.assign(footer, updates);
    await footer.save();

    return res.json({
      success: true,
      message: "Footer configuration updated successfully.",
      footer,
    });
  } catch (error) {
    next(error);
  }
};


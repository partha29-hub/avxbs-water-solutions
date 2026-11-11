import express from "express";
import mongoose from "mongoose";
import {
  getPublicSolutions,
  getPublicHighlights,
} from "../controllers/solutionController.js";
import { getPublicTabs } from "../controllers/dynamicTabController.js";
import { getFormConfig } from "../controllers/formBuilderController.js";
import { getPublicMedia } from "../controllers/mediaController.js";
import { getAssistance } from "../controllers/assistanceController.js";
import { getFooter } from "../controllers/footerController.js";
import { submitInquiry } from "../controllers/inquiryController.js";
import { getPublicAbout } from "../controllers/aboutController.js";
import {
  getPublicReviews,
  submitPublicFeedback,
} from "../controllers/reviewController.js";
import { getPublicBanners } from "../controllers/bannerController.js";
import { getPublicLogo } from "../controllers/settingsController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public Solutions & Highlights
router.get("/public/solutions", getPublicSolutions);
router.get("/public/highlights", getPublicHighlights);
router.get("/public/dynamic-tabs", getPublicTabs);

// Dynamic Drawer Form Config
router.get("/form-config", getFormConfig);

// Public Media / Videos
router.get("/media", getPublicMedia);

// Public Banners (Hero Slider)
router.get("/banners", getPublicBanners);
router.get("/public/banners", getPublicBanners);

// Public WhatsApp Assistance
router.get("/assistance", getAssistance);

// Public Website Brand Logo
router.get("/logo", getPublicLogo);
router.get("/public/logo", getPublicLogo);

// Public Footer
router.get("/footer", getFooter);

// Public About Us
router.get("/public/about", getPublicAbout);

// Public Customer Reviews & Feedback Submission
router.get("/reviews", getPublicReviews);
router.post("/reviews", upload.any(), submitPublicFeedback);

// Public Inquiry Submission
router.post("/inquiries", submitInquiry);

// Health Check
router.get("/health/db", (req, res) => {
  const state = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return res.json({
    success: state === 1,
    status: states[state] || "unknown",
    database: mongoose.connection.name || "none",
  });
});

export default router;

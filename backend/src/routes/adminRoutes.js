import express from "express";
import {
  login,
  logout,
  register,
  getAccount,
  updateAccount,
  updatePassword,
  getDashboardStats,
} from "../controllers/adminAuthController.js";
import {
  getAdminTabs,
  createTab,
  updateTab,
  deleteTab,
} from "../controllers/dynamicTabController.js";
import {
  getAdminFormConfig,
  updateAdminFormConfig,
} from "../controllers/formBuilderController.js";
import {
  getAdminSolutions,
  createSolution,
  updateSolution,
  deleteSolution,
  getAdminHighlights,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  uploadHighlightImage,
} from "../controllers/solutionController.js";
import {
  getAdminMedia,
  createMedia,
  updateMedia,
  patchMedia,
  deleteMedia,
} from "../controllers/mediaController.js";
import { getAssistance, updateAssistance } from "../controllers/assistanceController.js";
import { getFooter, updateFooter } from "../controllers/footerController.js";
import {
  getAdminAbout,
  updateAdminAbout,
  uploadAboutImage,
  deleteAboutImage,
} from "../controllers/aboutController.js";
import {
  getInquiries,
  getInquiryById,
  exportInquiries,
  updateInquiryStatus,
  deleteInquiry,
} from "../controllers/inquiryController.js";
import {
  getAdminReviews,
  updateReviewStatus,
  toggleReviewActive,
  toggleReviewFeatured,
  updateAdminReview,
  deleteAdminReview,
  createAdminReview,
  uploadReviewPhoto,
  getAdminReviewSettings,
  updateAdminReviewSettings,
  uploadReviewBackground,
  deleteReviewBackground,
} from "../controllers/reviewController.js";
import {
  getAdminBanners,
  createBanner,
  updateBanner,
  toggleBannerActive,
  deleteBanner,
  uploadBannerImage,
  uploadBannerMedia,
} from "../controllers/bannerController.js";
import {
  getAdminLogo,
  uploadLogo,
  updateLogo,
  restoreDefaultLogo,
} from "../controllers/settingsController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public auth endpoints
router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);

// Protected routes (Admin access only)
router.use(requireAdmin);

// Account & Profile
router.get("/account", getAccount);
router.put("/account", updateAccount);
router.patch("/account/password", updatePassword);
router.patch("/profile", updateAccount);
router.get("/dashboard-stats", getDashboardStats);

// Dynamic Tabs
router.get("/dynamic-tabs", getAdminTabs);
router.post("/dynamic-tabs", createTab);
router.put("/dynamic-tabs", updateTab);
router.delete("/dynamic-tabs", deleteTab);

// Dynamic Form Builder
router.get("/form-builder", getAdminFormConfig);
router.put("/form-builder", updateAdminFormConfig);

// Solutions & Residential Products
router.get("/solutions", getAdminSolutions);
router.post("/solutions", createSolution);
router.put("/solutions", updateSolution);
router.delete("/solutions", deleteSolution);

// Product aliases for ResidentialClient
router.get("/products", getAdminSolutions);
router.post("/products", createSolution);
router.put("/products", updateSolution);
router.delete("/products", deleteSolution);

// Highlights
router.get("/highlights", getAdminHighlights);
router.post("/highlights", createHighlight);
router.put("/highlights", updateHighlight);
router.delete("/highlights", deleteHighlight);
router.post("/highlights/upload", upload.any(), uploadHighlightImage);

// Media & Videos
router.get("/media", getAdminMedia);
router.post("/media", upload.any(), createMedia);
router.put("/media", upload.any(), updateMedia);
router.patch("/media", patchMedia);
router.delete("/media", deleteMedia);

// Banner Management
router.get("/banners", getAdminBanners);
router.post("/banners", upload.any(), createBanner);
router.post("/banners/upload", upload.any(), uploadBannerMedia);
router.post("/banners/upload-media", upload.any(), uploadBannerMedia);
router.post("/banners/upload-image", upload.any(), uploadBannerMedia);
router.put("/banners/:id", upload.any(), updateBanner);
router.patch("/banners/:id/toggle-active", toggleBannerActive);
router.patch("/banners/:id/active", toggleBannerActive);
router.delete("/banners/:id", deleteBanner);

// Footer & Assistance
router.get("/footer", getFooter);
router.put("/footer", updateFooter);
router.get("/assistance", getAssistance);
router.put("/assistance", updateAssistance);

// Website Logo Management (Account Settings)
router.get("/settings/logo", getAdminLogo);
router.get("/logo", getAdminLogo);
router.post("/logo/upload", upload.any(), uploadLogo);
router.put("/logo", upload.any(), updateLogo);
router.post("/logo/restore-default", restoreDefaultLogo);
router.delete("/logo", restoreDefaultLogo);

// About Us Management
router.get("/about", getAdminAbout);
router.put("/about", updateAdminAbout);
router.post("/about/image", upload.any(), uploadAboutImage);
router.delete("/about/image", deleteAboutImage);

// Customer Inquiries
router.get("/inquiries", getInquiries);
router.get("/inquiries/export", exportInquiries);
router.get("/inquiries/:id", getInquiryById);
router.patch("/inquiries/:id", updateInquiryStatus);
router.delete("/inquiries/:id", deleteInquiry);

// Customer Reviews & Feedback Management
router.get("/reviews", getAdminReviews);
router.post("/reviews", upload.any(), createAdminReview);
router.put("/reviews/settings", updateAdminReviewSettings);
router.get("/reviews/settings", getAdminReviewSettings);
router.post("/reviews/background", upload.any(), uploadReviewBackground);
router.delete("/reviews/background", deleteReviewBackground);
router.put("/reviews/:id/status", updateReviewStatus);
router.patch("/reviews/:id/toggle-active", toggleReviewActive);
router.patch("/reviews/:id/toggle-featured", toggleReviewFeatured);
router.post("/reviews/:id/photo", upload.any(), uploadReviewPhoto);
router.put("/reviews/:id", updateAdminReview);
router.delete("/reviews/:id", deleteAdminReview);

export default router;

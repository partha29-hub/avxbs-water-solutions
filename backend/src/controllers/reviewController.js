import { Readable } from "stream";
import Review from "../models/Review.js";
import ReviewSettings from "../models/ReviewSettings.js";
import cloudinary from "../config/cloudinary.js";

// Helper: Stream a multer buffer to Cloudinary
function uploadBufferToCloudinary(buffer, folder = "avxbs/reviews") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        timeout: 120000,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

// Helper: Get or create singleton ReviewSettings
async function getOrCreateReviewSettings() {
  let settings = await ReviewSettings.findOne();
  if (!settings) {
    settings = await ReviewSettings.create({
      heading: "REVIEWS",
      subtitle: "From our clients",
      backgroundImageUrl: "",
      backgroundPublicId: "",
      feedbackHeading: "Share Your Experience",
      feedbackSubtitle:
        "We value your trust and feedback. Tell us about your journey with AVXBS water solutions.",
      enablePublicSubmissions: true,
    });
  }
  return settings;
}

// ============================================================================
// PUBLIC CONTROLLERS
// ============================================================================

/**
 * Public GET: Fetch approved and active reviews + section settings
 */
export const getPublicReviews = async (req, res, next) => {
  try {
    const settings = await getOrCreateReviewSettings();

    const reviews = await Review.find({
      status: "approved",
      isActive: true,
    })
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .select("name company rating message photoUrl isFeatured isVerified category order createdAt");

    return res.json({
      success: true,
      settings: {
        heading: settings.heading || "REVIEWS",
        subtitle: settings.subtitle || "From our clients",
        backgroundImageUrl: settings.backgroundImageUrl || "",
        feedbackHeading: settings.feedbackHeading || "Share Your Experience",
        feedbackSubtitle: settings.feedbackSubtitle || "",
        enablePublicSubmissions: settings.enablePublicSubmissions !== false,
      },
      reviews: reviews || [],
    });
  } catch (error) {
    console.error("[getPublicReviews Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch reviews",
      reviews: [],
    });
  }
};

/**
 * Public POST: Submit customer feedback
 */
export const submitPublicFeedback = async (req, res, next) => {
  try {
    const { name, email, company, rating, message, consent } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Please provide your name." });
    }
    if (!email || !email.trim() || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5 stars." });
    }
    if (!message || message.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please write a feedback message (at least 5 characters).",
      });
    }

    // Consent check
    const consentGiven = consent === true || consent === "true" || consent === "on";
    if (!consentGiven) {
      return res.status(400).json({
        success: false,
        message: "You must consent to displaying your review publicly.",
      });
    }

    let photoUrl = "";
    let photoPublicId = "";

    // Optional photo upload
    const file = req.file || (req.files && req.files[0]);
    if (file && file.buffer) {
      try {
        const uploadResult = await uploadBufferToCloudinary(file.buffer, "avxbs/reviews/customers");
        photoUrl = uploadResult.secure_url || uploadResult.url;
        photoPublicId = uploadResult.public_id;
      } catch (uploadErr) {
        console.error("[Customer Review Photo Upload Error]", uploadErr);
        // Continue saving review even if optional photo upload fails
      }
    }

    const review = await Review.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company ? company.trim() : "",
      rating: numRating,
      message: message.trim(),
      photoUrl,
      photoPublicId,
      status: "pending",
      isActive: true,
      isFeatured: false,
      consentGiven: true,
    });

    return res.status(201).json({
      success: true,
      message:
        "Thank you! Your feedback has been submitted successfully and will appear on the website once approved by our team.",
      reviewId: review._id,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADMIN CONTROLLERS
// ============================================================================

/**
 * Admin GET: Fetch all reviews with filters & status counters
 */
export const getAdminReviews = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const query = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { email: regex }, { company: regex }, { message: regex }];
    }

    const reviews = await Review.find(query).sort({
      createdAt: -1,
    });

    // Counts across all statuses
    const [total, pending, approved, rejected] = await Promise.all([
      Review.countDocuments({}),
      Review.countDocuments({ status: "pending" }),
      Review.countDocuments({ status: "approved" }),
      Review.countDocuments({ status: "rejected" }),
    ]);

    const settings = await getOrCreateReviewSettings();

    return res.json({
      success: true,
      stats: { total, pending, approved, rejected },
      reviews,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin PUT: Update review status (approve / reject / pending)
 */
export const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    return res.json({
      success: true,
      message: `Review status updated to ${status}.`,
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin PATCH: Toggle active state of a review
 */
export const toggleReviewActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    review.isActive = !review.isActive;
    await review.save();

    return res.json({
      success: true,
      message: `Review marked as ${review.isActive ? "active" : "inactive"}.`,
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin PATCH: Toggle featured state of a review
 */
export const toggleReviewFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    review.isFeatured = !review.isFeatured;
    await review.save();

    return res.json({
      success: true,
      message: `Review ${review.isFeatured ? "marked as featured" : "unfeatured"}.`,
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin PUT: Update full review details
 */
export const updateAdminReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      company,
      rating,
      message,
      status,
      isActive,
      isFeatured,
      order,
      category,
      isVerified,
      photoUrl,
      photoPublicId,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (company !== undefined) updateData.company = company.trim();
    if (rating !== undefined) updateData.rating = Number(rating);
    if (message !== undefined) updateData.message = message.trim();
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (category !== undefined) updateData.category = category;
    if (isVerified !== undefined) updateData.isVerified = Boolean(isVerified);
    if (order !== undefined) updateData.order = Number(order) || 0;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (photoPublicId !== undefined) updateData.photoPublicId = photoPublicId;

    const review = await Review.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    return res.json({
      success: true,
      message: "Review updated successfully.",
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin DELETE: Remove review and cleanup Cloudinary photo
 */
export const deleteAdminReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    if (review.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(review.photoPublicId, { resource_type: "image" });
      } catch (cErr) {
        console.error("Cloudinary photo delete warning:", cErr);
      }
    }

    await Review.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin POST: Manually create review (approved by default)
 */
export const createAdminReview = async (req, res, next) => {
  try {
    const {
      name,
      email,
      company,
      rating,
      message,
      status,
      isActive,
      isFeatured,
      order,
      category,
      isVerified,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    let photoUrl = "";
    let photoPublicId = "";

    const file = req.file || (req.files && req.files[0]);
    if (file && file.buffer) {
      const uploadResult = await uploadBufferToCloudinary(file.buffer, "avxbs/reviews/customers");
      photoUrl = uploadResult.secure_url || uploadResult.url;
      photoPublicId = uploadResult.public_id;
    }

    const isActiveVal =
      isActive !== undefined ? isActive === true || isActive === "true" : true;
    const isVerifiedVal =
      isVerified !== undefined ? isVerified === true || isVerified === "true" : true;

    const review = await Review.create({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : "",
      company: company ? company.trim() : "",
      rating: Number(rating) || 5,
      message: message.trim(),
      photoUrl,
      photoPublicId,
      status: status || "approved",
      isActive: isActiveVal,
      isFeatured: isFeatured === true || isFeatured === "true",
      category: category || "Residential",
      isVerified: isVerifiedVal,
      order: Number(order) || 0,
      consentGiven: true,
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully.",
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin POST: Upload or replace customer photo for a review
 */
export const uploadReviewPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = req.file || (req.files && req.files[0]);
    if (!file || !file.buffer) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    // Destroy old photo
    if (review.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(review.photoPublicId, { resource_type: "image" });
      } catch (cErr) {
        console.error("Cleanup old customer photo error:", cErr);
      }
    }

    const uploadResult = await uploadBufferToCloudinary(file.buffer, "avxbs/reviews/customers");
    review.photoUrl = uploadResult.secure_url || uploadResult.url;
    review.photoPublicId = uploadResult.public_id;
    await review.save();

    return res.json({
      success: true,
      message: "Customer photo uploaded successfully.",
      photoUrl: review.photoUrl,
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin GET: Get reviews section settings
 */
export const getAdminReviewSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateReviewSettings();
    return res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin PUT: Update reviews section settings (heading, subtitle, etc.)
 */
export const updateAdminReviewSettings = async (req, res, next) => {
  try {
    const { heading, subtitle, feedbackHeading, feedbackSubtitle, enablePublicSubmissions } =
      req.body;

    const settings = await getOrCreateReviewSettings();
    if (heading !== undefined) settings.heading = heading.trim();
    if (subtitle !== undefined) settings.subtitle = subtitle.trim();
    if (feedbackHeading !== undefined) settings.feedbackHeading = feedbackHeading.trim();
    if (feedbackSubtitle !== undefined) settings.feedbackSubtitle = feedbackSubtitle.trim();
    if (enablePublicSubmissions !== undefined) {
      settings.enablePublicSubmissions = Boolean(enablePublicSubmissions);
    }

    await settings.save();

    return res.json({
      success: true,
      message: "Review section settings updated successfully.",
      settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin POST: Upload or replace background photograph for Reviews section
 */
export const uploadReviewBackground = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file || !file.buffer) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    const settings = await getOrCreateReviewSettings();

    // Destroy old background photo if exists
    if (settings.backgroundPublicId) {
      try {
        await cloudinary.uploader.destroy(settings.backgroundPublicId, { resource_type: "image" });
      } catch (cErr) {
        console.error("Cleanup old background image error:", cErr);
      }
    }

    const uploadResult = await uploadBufferToCloudinary(file.buffer, "avxbs/reviews/backgrounds");
    settings.backgroundImageUrl = uploadResult.secure_url || uploadResult.url;
    settings.backgroundPublicId = uploadResult.public_id;
    await settings.save();

    return res.json({
      success: true,
      message: "Reviews background photograph uploaded successfully.",
      backgroundImageUrl: settings.backgroundImageUrl,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin DELETE: Remove custom background photo
 */
export const deleteReviewBackground = async (req, res, next) => {
  try {
    const settings = await getOrCreateReviewSettings();

    if (settings.backgroundPublicId) {
      try {
        await cloudinary.uploader.destroy(settings.backgroundPublicId, { resource_type: "image" });
      } catch (cErr) {
        console.error("Cleanup background image error:", cErr);
      }
    }

    settings.backgroundImageUrl = "";
    settings.backgroundPublicId = "";
    await settings.save();

    return res.json({
      success: true,
      message: "Reviews background photo removed successfully.",
      settings,
    });
  } catch (error) {
    next(error);
  }
};


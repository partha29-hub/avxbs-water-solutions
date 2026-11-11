import { Readable } from "stream";
import WebsiteSettings from "../models/WebsiteSettings.js";
import cloudinary from "../config/cloudinary.js";

const DEFAULT_LOGO_URL = "/assets/logo/avxbs-logo.png";

// Helper: Get or initialize singleton WebsiteSettings document
export async function getOrCreateWebsiteSettings() {
  let settings = await WebsiteSettings.findOne();
  if (!settings) {
    settings = await WebsiteSettings.create({
      logoUrl: DEFAULT_LOGO_URL,
      logoPublicId: "",
      siteName: "AVXBS Water Solutions",
    });
  }
  return settings;
}

// Helper: Stream file buffer to Cloudinary
function uploadBufferToCloudinary(buffer, folder = "avxbs/logo", filename = "avxbs-brand-logo") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${filename}-${Date.now()}`,
        resource_type: "auto", // Automatically detects image / svg
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

// Helper: Safely delete asset from Cloudinary
async function deleteCloudinaryAsset(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });
  } catch (error) {
    console.warn("[Cloudinary Logo Cleanup Warning]", publicId, error?.message || error);
  }
}

/**
 * Public GET: Fetch current active website logo URL
 * Used across the public website and headers
 */
export const getPublicLogo = async (req, res, next) => {
  try {
    const settings = await getOrCreateWebsiteSettings();
    const logoUrl = settings.logoUrl || DEFAULT_LOGO_URL;
    const isDefault = !settings.logoPublicId || logoUrl === DEFAULT_LOGO_URL;

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");

    return res.json({
      success: true,
      logoUrl,
      isDefault,
      siteName: settings.siteName || "AVXBS Water Solutions",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin GET: Fetch website logo details for Settings
 */
export const getAdminLogo = async (req, res, next) => {
  try {
    const settings = await getOrCreateWebsiteSettings();
    const logoUrl = settings.logoUrl || DEFAULT_LOGO_URL;
    const isDefault = !settings.logoPublicId || logoUrl === DEFAULT_LOGO_URL;

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    return res.json({
      success: true,
      logoUrl,
      logoPublicId: settings.logoPublicId || "",
      isDefault,
      siteName: settings.siteName || "AVXBS Water Solutions",
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin POST: Upload new logo file to Cloudinary
 */
export const uploadLogo = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file || !file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No logo file provided. Please choose a PNG, JPG, JPEG, WEBP, or SVG file.",
      });
    }

    const mimetype = (file.mimetype || "").toLowerCase();
    const originalName = (file.originalname || "").toLowerCase();
    const isValidFormat =
      mimetype.startsWith("image/") ||
      /\.(png|jpe?g|webp|svg)$/i.test(originalName);

    if (!isValidFormat) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file format. Please upload a PNG, JPG, JPEG, WEBP, or SVG image.",
      });
    }

    const uploadResult = await uploadBufferToCloudinary(file.buffer);
    const uploadedUrl = uploadResult.secure_url || uploadResult.url;
    const uploadedPublicId = uploadResult.public_id;

    return res.json({
      success: true,
      message: "Logo uploaded to Cloudinary successfully.",
      logoUrl: uploadedUrl,
      logoPublicId: uploadedPublicId,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin PUT: Save / update logo (handles direct file upload OR already uploaded logoUrl/publicId)
 */
export const updateLogo = async (req, res, next) => {
  try {
    const settings = await getOrCreateWebsiteSettings();
    let newLogoUrl = req.body?.logoUrl;
    let newLogoPublicId = req.body?.logoPublicId;

    // If file was attached directly in multipart request
    const file = req.file || (req.files && req.files[0]);
    if (file && file.buffer) {
      const uploadResult = await uploadBufferToCloudinary(file.buffer);
      newLogoUrl = uploadResult.secure_url || uploadResult.url;
      newLogoPublicId = uploadResult.public_id;
    }

    if (!newLogoUrl) {
      return res.status(400).json({
        success: false,
        message: "Logo URL or file is required to save changes.",
      });
    }

    // Clean up previous Cloudinary asset if being replaced by a different custom logo
    if (
      settings.logoPublicId &&
      newLogoPublicId &&
      settings.logoPublicId !== newLogoPublicId
    ) {
      await deleteCloudinaryAsset(settings.logoPublicId);
    }

    settings.logoUrl = newLogoUrl;
    settings.logoPublicId = newLogoPublicId || "";
    if (req.body?.siteName) {
      settings.siteName = String(req.body.siteName).trim();
    }
    await settings.save();

    return res.json({
      success: true,
      message: "Website logo updated successfully across the entire site.",
      logoUrl: settings.logoUrl,
      logoPublicId: settings.logoPublicId,
      isDefault: !settings.logoPublicId || settings.logoUrl === DEFAULT_LOGO_URL,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin POST: Restore default AVXBS brand logo
 */
export const restoreDefaultLogo = async (req, res, next) => {
  try {
    const settings = await getOrCreateWebsiteSettings();

    // Clean up custom asset from Cloudinary if existed
    if (settings.logoPublicId) {
      await deleteCloudinaryAsset(settings.logoPublicId);
    }

    settings.logoUrl = DEFAULT_LOGO_URL;
    settings.logoPublicId = "";
    await settings.save();

    return res.json({
      success: true,
      message: "Default AVXBS logo restored successfully.",
      logoUrl: DEFAULT_LOGO_URL,
      logoPublicId: "",
      isDefault: true,
    });
  } catch (error) {
    next(error);
  }
};


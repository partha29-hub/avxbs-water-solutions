import { Readable } from "stream";
import Banner from "../models/Banner.js";
import cloudinary from "../config/cloudinary.js";

// Helper: Stream buffer to Cloudinary with explicit resource_type (image or video)
function uploadBufferToCloudinary(buffer, resourceType = "image", folder = "avxbs/banners") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType === "video" ? "video" : "image",
        timeout: 600000, // 10 minutes timeout for large files
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

// Helper: Safely destroy asset from Cloudinary (image or video)
async function deleteCloudinaryAsset(publicId, resourceType = "image") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === "video" ? "video" : "image",
      invalidate: true,
    });
  } catch (err) {
    console.warn("[Cloudinary Delete Warning]", publicId, err.message);
  }
}

// Helper: Detect media type from mimetype or requested type
function detectMediaType(mimetype, fallbackType = "image") {
  if (!mimetype) return fallbackType;
  if (mimetype.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/i.test(mimetype)) {
    return "video";
  }
  if (mimetype.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(mimetype)) {
    return "image";
  }
  return fallbackType;
}

// Helper: Generate video poster URL from Cloudinary video URL
function generateVideoPoster(videoUrl) {
  if (!videoUrl) return "";
  if (videoUrl.includes("res.cloudinary.com") && videoUrl.includes("/video/upload/")) {
    return videoUrl
      .replace(/\.(mp4|webm|mov|mkv)(\?.*)?$/i, ".jpg")
      .replace("/video/upload/", "/video/upload/so_0/");
  }
  return "";
}

// ============================================================================
// PUBLIC CONTROLLERS
// ============================================================================

/**
 * Public GET: Fetch all active homepage hero banners
 * Strictly controls the homepage hero slider, sorted by order ascending.
 */
export const getPublicBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Sanitize output to guarantee mediaUrl, mediaType, and posterUrl
    const sanitized = (banners || []).map((b) => {
      const url = b.mediaUrl || b.desktopImageUrl || "";
      const isVid =
        b.mediaType === "video" ||
        /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url);
      return {
        _id: b._id,
        title: b.title || "",
        subtitle: b.subtitle || "",
        description: b.description || "",
        buttonText: b.buttonText || "",
        buttonLink: b.buttonLink || "",
        mediaUrl: url,
        desktopImageUrl: url,
        mediaType: isVid ? "video" : "image",
        posterUrl: b.posterUrl || (isVid ? generateVideoPoster(url) : ""),
        order: b.order || 0,
        isActive: b.isActive,
        createdAt: b.createdAt,
      };
    });

    // Disable caching on client & proxy to ensure direct admin-to-homepage sync
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.json({
      success: true,
      banners: sanitized,
    });
  } catch (error) {
    console.error("[getPublicBanners Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch banners",
      banners: [],
    });
  }
};

// ============================================================================
// ADMIN CONTROLLERS
// ============================================================================

/**
 * Admin GET: Fetch all banners with filters and statistics
 */
export const getAdminBanners = async (req, res, next) => {
  try {
    const { status, mediaType, search } = req.query;

    const query = {};

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    if (mediaType === "image" || mediaType === "video") {
      query.mediaType = mediaType;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ title: regex }, { subtitle: regex }, { description: regex }];
    }

    const banners = await Banner.find(query).sort({ order: 1, createdAt: -1 }).lean();

    const [total, active, inactive, images, videos] = await Promise.all([
      Banner.countDocuments(),
      Banner.countDocuments({ isActive: true }),
      Banner.countDocuments({ isActive: false }),
      Banner.countDocuments({ mediaType: "image" }),
      Banner.countDocuments({ mediaType: "video" }),
    ]);

    // Sanitize media fields
    const sanitized = (banners || []).map((b) => {
      const url = b.mediaUrl || b.desktopImageUrl || "";
      const isVid =
        b.mediaType === "video" ||
        /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url);
      return {
        ...b,
        mediaUrl: url,
        desktopImageUrl: url,
        mediaType: isVid ? "video" : "image",
        posterUrl: b.posterUrl || (isVid ? generateVideoPoster(url) : ""),
      };
    });

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    return res.json({
      success: true,
      banners: sanitized,
      stats: {
        total,
        active,
        inactive,
        images,
        videos,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin POST: Quick upload preview endpoint for image or video
 */
export const uploadBannerMedia = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file || !file.buffer) {
      return res.status(400).json({ success: false, message: "No media file provided." });
    }

    const mimetype = file.mimetype || "";
    const isVideo =
      mimetype.startsWith("video/") ||
      /\.(mp4|webm|mov|mkv)$/i.test(file.originalname || "");
    const isImage =
      mimetype.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.originalname || "");

    if (!isVideo && !isImage) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file format. Please upload JPG, JPEG, PNG, WEBP, MP4, or WEBM.",
      });
    }

    const mediaType = isVideo ? "video" : "image";
    const uploadResult = await uploadBufferToCloudinary(file.buffer, mediaType, "avxbs/banners");

    const mediaUrl = uploadResult.secure_url || uploadResult.url;
    const publicId = uploadResult.public_id;
    const posterUrl = isVideo ? generateVideoPoster(mediaUrl) : "";

    return res.json({
      success: true,
      mediaUrl,
      mediaType,
      publicId,
      posterUrl,
      message: `${isVideo ? "Video" : "Image"} uploaded successfully to Cloudinary.`,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadBannerImage = uploadBannerMedia;

/**
 * Admin POST: Create new banner (Unified file upload + MongoDB save in one step)
 */
export const createBanner = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      isActive,
      order,
    } = req.body;

    let mediaUrl = req.body.mediaUrl || req.body.desktopImageUrl || "";
    let mediaType = req.body.mediaType || "image";
    let publicId = req.body.publicId || req.body.desktopImagePublicId || "";
    let posterUrl = req.body.posterUrl || "";
    let posterPublicId = req.body.posterPublicId || "";

    // Upload files if provided directly in multipart/form-data
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.fieldname === "poster") {
          const result = await uploadBufferToCloudinary(file.buffer, "image", "avxbs/banners/posters");
          posterUrl = result.secure_url || result.url;
          posterPublicId = result.public_id;
        } else {
          // Primary media
          const detected = detectMediaType(file.mimetype || file.originalname, mediaType);
          const result = await uploadBufferToCloudinary(file.buffer, detected, "avxbs/banners");
          mediaUrl = result.secure_url || result.url;
          mediaType = detected;
          publicId = result.public_id;
          if (detected === "video" && !posterUrl) {
            posterUrl = generateVideoPoster(mediaUrl);
          }
        }
      }
    }

    if (!mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "Banner media (image or video) is required. Please select a file to upload.",
      });
    }

    if (mediaType === "video" && !posterUrl) {
      posterUrl = generateVideoPoster(mediaUrl);
    }

    const activeBool =
      isActive === undefined
        ? true
        : typeof isActive === "string"
        ? isActive === "true"
        : Boolean(isActive);

    const banner = await Banner.create({
      title: title ? title.trim() : "",
      subtitle: subtitle ? subtitle.trim() : "",
      description: description ? description.trim() : "",
      mediaUrl,
      mediaType,
      publicId,
      posterUrl,
      posterPublicId,
      desktopImageUrl: mediaUrl,
      desktopImagePublicId: publicId,
      buttonText: buttonText ? buttonText.trim() : "",
      buttonLink: buttonLink ? buttonLink.trim() : "",
      isActive: activeBool,
      order: Number(order) || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Banner created and published directly to homepage slider.",
      banner,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin PUT: Update existing banner (File replacement + MongoDB save)
 */
export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found." });
    }

    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      isActive,
      order,
    } = req.body;

    let mediaUrl = req.body.mediaUrl || req.body.desktopImageUrl;
    let mediaType = req.body.mediaType || banner.mediaType;
    let publicId = req.body.publicId || req.body.desktopImagePublicId;
    let posterUrl = req.body.posterUrl;
    let posterPublicId = req.body.posterPublicId;

    // Handle file replacement if uploaded
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.fieldname === "poster") {
          const result = await uploadBufferToCloudinary(file.buffer, "image", "avxbs/banners/posters");
          posterUrl = result.secure_url || result.url;
          posterPublicId = result.public_id;
        } else {
          // Primary media replacement
          const detected = detectMediaType(file.mimetype || file.originalname, mediaType);
          const result = await uploadBufferToCloudinary(file.buffer, detected, "avxbs/banners");
          mediaUrl = result.secure_url || result.url;
          mediaType = detected;
          publicId = result.public_id;
          if (detected === "video" && !posterUrl) {
            posterUrl = generateVideoPoster(mediaUrl);
          }
        }
      }
    }

    // Clean up replaced media in Cloudinary
    if (publicId && banner.publicId && publicId !== banner.publicId) {
      await deleteCloudinaryAsset(banner.publicId, banner.mediaType);
    }
    if (posterPublicId && banner.posterPublicId && posterPublicId !== banner.posterPublicId) {
      await deleteCloudinaryAsset(banner.posterPublicId, "image");
    }

    if (title !== undefined) banner.title = title.trim();
    if (subtitle !== undefined) banner.subtitle = subtitle.trim();
    if (description !== undefined) banner.description = description.trim();
    if (buttonText !== undefined) banner.buttonText = buttonText.trim();
    if (buttonLink !== undefined) banner.buttonLink = buttonLink.trim();
    if (isActive !== undefined) {
      banner.isActive =
        typeof isActive === "string" ? isActive === "true" : Boolean(isActive);
    }
    if (order !== undefined) banner.order = Number(order) || 0;

    if (mediaUrl) {
      banner.mediaUrl = mediaUrl;
      banner.mediaType = mediaType || banner.mediaType;
      banner.publicId = publicId || banner.publicId;
      banner.desktopImageUrl = mediaUrl;
      banner.desktopImagePublicId = publicId || banner.desktopImagePublicId;
    }

    if (posterUrl !== undefined) {
      banner.posterUrl = posterUrl;
      banner.posterPublicId = posterPublicId || banner.posterPublicId;
    } else if (banner.mediaType === "video" && !banner.posterUrl && banner.mediaUrl) {
      banner.posterUrl = generateVideoPoster(banner.mediaUrl);
    }

    await banner.save();

    return res.json({
      success: true,
      message: "Banner updated successfully.",
      banner,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin PATCH: Toggle active status
 */
export const toggleBannerActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found." });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    return res.json({
      success: true,
      message: `Banner ${banner.isActive ? "activated" : "deactivated"} successfully.`,
      banner,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin DELETE: Remove banner and cleanup Cloudinary media
 */
export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found." });
    }

    // Clean up primary media
    if (banner.publicId) {
      await deleteCloudinaryAsset(banner.publicId, banner.mediaType);
    } else if (banner.desktopImagePublicId) {
      await deleteCloudinaryAsset(banner.desktopImagePublicId, "image");
    }

    // Clean up poster if uploaded separately
    if (banner.posterPublicId) {
      await deleteCloudinaryAsset(banner.posterPublicId, "image");
    }

    await Banner.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Banner deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

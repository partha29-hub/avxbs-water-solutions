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

// Helper: Resequence all banners in ascending order (1, 2, 3...)
// Guarantees zero duplicate order values and strict 1-based sequential ordering without gaps.
async function resequenceBanners() {
  try {
    const banners = await Banner.find().sort({ order: 1, updatedAt: -1, createdAt: -1 });
    const bulkOps = banners.map((b, idx) => ({
      updateOne: {
        filter: { _id: b._id },
        update: { $set: { order: idx + 1 } },
      },
    }));
    if (bulkOps.length > 0) {
      await Banner.bulkWrite(bulkOps);
    }
  } catch (err) {
    console.error("[resequenceBanners Error]", err);
  }
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
        order: Number(b.order) || 1,
        isActive: b.isActive,
        audioEnabled: b.audioEnabled !== undefined ? b.audioEnabled : (b.enableAudio !== undefined ? b.enableAudio : true),
        enableAudio: b.audioEnabled !== undefined ? b.audioEnabled : (b.enableAudio !== undefined ? b.enableAudio : true),
        defaultSound: b.defaultSound || "muted",
        autoplay: b.autoplay !== undefined ? b.autoplay : true,
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
        order: Number(b.order) || 1,
        audioEnabled: b.audioEnabled !== undefined ? b.audioEnabled : (b.enableAudio !== undefined ? b.enableAudio : true),
        enableAudio: b.audioEnabled !== undefined ? b.audioEnabled : (b.enableAudio !== undefined ? b.enableAudio : true),
        defaultSound: b.defaultSound || "muted",
        autoplay: b.autoplay !== undefined ? b.autoplay : true,
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
      audioEnabled,
      enableAudio,
      defaultSound,
      autoplay,
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

    const rawAudioEnabled = audioEnabled !== undefined ? audioEnabled : enableAudio;
    const audioEnabledBool =
      rawAudioEnabled === undefined
        ? true
        : typeof rawAudioEnabled === "string"
        ? rawAudioEnabled === "true"
        : Boolean(rawAudioEnabled);

    const autoplayBool =
      autoplay === undefined
        ? true
        : typeof autoplay === "string"
        ? autoplay === "true"
        : Boolean(autoplay);

    const defaultSoundVal = defaultSound === "unmuted" ? "unmuted" : "muted";

    // Auto-reorder: If order specified, shift existing banners at or after targetOrder up by 1
    const totalCount = await Banner.countDocuments();
    const targetOrder = Math.max(1, order !== undefined && !isNaN(Number(order)) ? Number(order) : totalCount + 1);

    await Banner.updateMany({ order: { $gte: targetOrder } }, { $inc: { order: 1 } });

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
      order: targetOrder,
      audioEnabled: audioEnabledBool,
      enableAudio: audioEnabledBool,
      defaultSound: defaultSoundVal,
      autoplay: autoplayBool,
    });

    // Ensure completely unique continuous sequential ordering 1, 2, 3...
    await resequenceBanners();
    const savedBanner = await Banner.findById(banner._id);

    return res.status(201).json({
      success: true,
      message: "Banner created and published directly to homepage slider.",
      banner: savedBanner || banner,
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
      audioEnabled,
      enableAudio,
      defaultSound,
      autoplay,
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

    // Auto-reorder: If order changed, shift other banners automatically
    const oldOrder = Number(banner.order) || 1;
    if (order !== undefined && !isNaN(Number(order))) {
      const targetOrder = Math.max(1, Number(order));
      if (targetOrder !== oldOrder) {
        if (targetOrder < oldOrder) {
          // Moving up (e.g. 3 -> 1): shift intermediate banners up by +1
          await Banner.updateMany(
            { _id: { $ne: banner._id }, order: { $gte: targetOrder, $lt: oldOrder } },
            { $inc: { order: 1 } }
          );
        } else {
          // Moving down (e.g. 1 -> 3): shift intermediate banners down by -1
          await Banner.updateMany(
            { _id: { $ne: banner._id }, order: { $gt: oldOrder, $lte: targetOrder } },
            { $inc: { order: -1 } }
          );
        }
        banner.order = targetOrder;
      }
    }

    const rawAudioEnabled = audioEnabled !== undefined ? audioEnabled : enableAudio;
    if (rawAudioEnabled !== undefined) {
      const boolVal =
        typeof rawAudioEnabled === "string" ? rawAudioEnabled === "true" : Boolean(rawAudioEnabled);
      banner.audioEnabled = boolVal;
      banner.enableAudio = boolVal;
    }
    if (defaultSound !== undefined) {
      banner.defaultSound = defaultSound === "unmuted" ? "unmuted" : "muted";
    }
    if (autoplay !== undefined) {
      banner.autoplay =
        typeof autoplay === "string" ? autoplay === "true" : Boolean(autoplay);
    }

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
    await resequenceBanners();
    const refreshedBanner = await Banner.findById(banner._id);

    return res.json({
      success: true,
      message: "Banner updated successfully.",
      banner: refreshedBanner || banner,
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
 * Admin PATCH: Toggle audioEnabled status for video banner
 */
export const toggleBannerAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found." });
    }

    let newAudio;
    if (req.body && (req.body.audioEnabled !== undefined || req.body.enableAudio !== undefined)) {
      const val = req.body.audioEnabled !== undefined ? req.body.audioEnabled : req.body.enableAudio;
      newAudio = typeof val === "string" ? val === "true" : Boolean(val);
    } else {
      const current = banner.audioEnabled !== false && banner.enableAudio !== false;
      newAudio = !current;
    }

    banner.audioEnabled = newAudio;
    banner.enableAudio = newAudio;
    await banner.save();

    return res.json({
      success: true,
      message: `Audio controls ${newAudio ? "enabled" : "disabled"} successfully.`,
      banner,
      audioEnabled: newAudio,
      enableAudio: newAudio,
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
    await resequenceBanners();

    return res.json({
      success: true,
      message: "Banner deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

import { Readable } from "stream";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Media from "../models/Media.js";

function getMediaType(file) {
  if (file?.mimetype?.startsWith("image/")) return "image";
  if (file?.mimetype?.startsWith("video/")) return "video";
  return null;
}

const uploadToCloudinary = (fileBuffer, mediaType) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: mediaType,
        folder: `avxbs/${mediaType === "image" ? "images" : "videos"}`,
        timeout: 600000,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ ...result, mediaType });
      }
    );

    Readable.from(fileBuffer).pipe(stream);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = "video") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === "image" ? "image" : "video",
      invalidate: true,
    });
  } catch (error) {
    console.error("Cloudinary cleanup error:", error);
  }
};

// Public: GET active media
export const getPublicMedia = async (req, res, next) => {
  try {
    const media = await Media.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      media,
      videos: media,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: GET all media
export const getAdminMedia = async (req, res, next) => {
  try {
    const media = await Media.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      media,
      videos: media,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: POST upload new media
export const createMedia = async (req, res, next) => {
  const uploaded = [];

  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }

    const files = req.files || (req.file ? [req.file] : []);

    // Check if direct videoUrl was provided instead of file
    if (!files.length && req.body.videoUrl) {
      const item = await Media.create({
        title,
        description,
        videoUrl: req.body.videoUrl,
        publicId: req.body.publicId || "",
        resourceType: req.body.mediaType || "video",
        mediaType: req.body.mediaType || "video",
        isActive: true,
        order: Date.now(),
      });

      return res.status(201).json({
        success: true,
        message: "Media created successfully.",
        media: [item],
        videos: [item],
      });
    }

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "Select at least one photo or video file.",
      });
    }

    const created = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = getMediaType(file);

      if (!mediaType) {
        throw new Error("Only image and video files are supported.");
      }

      const asset = await uploadToCloudinary(file.buffer, mediaType);
      uploaded.push(asset);

      const item = await Media.create({
        title: files.length > 1 ? `${title} ${i + 1}` : title,
        description,
        videoUrl: asset.secure_url,
        publicId: asset.public_id,
        resourceType: asset.mediaType,
        mediaType: asset.mediaType,
        isActive: true,
        order: Date.now() + i,
      });

      created.push(item);
    }

    return res.status(201).json({
      success: true,
      message: `${created.length} media file(s) uploaded successfully.`,
      media: created,
      videos: created,
    });
  } catch (error) {
    for (const asset of uploaded) {
      await deleteFromCloudinary(asset.public_id, asset.mediaType);
    }
    next(error);
  }
};

// Admin: PUT update media
export const updateMedia = async (req, res, next) => {
  let newAsset = null;

  try {
    const id = req.body.id || req.params.id;
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "");

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Valid media ID is required." });
    }

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }

    const item = await Media.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Media not found." });
    }

    const oldPublicId = item.publicId;
    const oldType = item.mediaType || item.resourceType || "video";

    const file = req.file || (req.files && req.files[0]);
    if (file && file.size > 0) {
      const mediaType = getMediaType(file);
      if (!mediaType) {
        return res.status(400).json({ success: false, message: "Only image and video files are allowed." });
      }

      newAsset = await uploadToCloudinary(file.buffer, mediaType);
      item.videoUrl = newAsset.secure_url;
      item.publicId = newAsset.public_id;
      item.resourceType = newAsset.mediaType;
      item.mediaType = newAsset.mediaType;
    }

    item.title = title;
    item.description = description.trim();
    await item.save();

    if (newAsset && oldPublicId) {
      await deleteFromCloudinary(oldPublicId, oldType);
    }

    return res.json({
      success: true,
      message: newAsset ? "Media replaced successfully." : "Media details updated successfully.",
      media: item,
      video: item,
    });
  } catch (error) {
    if (newAsset?.public_id) {
      await deleteFromCloudinary(newAsset.public_id, newAsset.mediaType);
    }
    next(error);
  }
};

// Admin: PATCH media (status or reorder)
export const patchMedia = async (req, res, next) => {
  try {
    const { action, id, isActive, media, videos } = req.body;

    if (action === "status") {
      if (!mongoose.isValidObjectId(id) || typeof isActive !== "boolean") {
        return res.status(400).json({ success: false, message: "Invalid status request." });
      }

      const item = await Media.findByIdAndUpdate(
        id,
        { $set: { isActive } },
        { new: true, runValidators: true }
      );

      if (!item) {
        return res.status(404).json({ success: false, message: "Media not found." });
      }

      return res.json({ success: true, message: "Media status updated.", media: item, video: item });
    }

    if (action === "reorder") {
      const items = media || videos;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, message: "Invalid ordering data." });
      }

      const operations = items.map((item, index) => {
        if (!mongoose.isValidObjectId(item.id)) throw new Error("Invalid media ID.");
        return {
          updateOne: {
            filter: { _id: item.id },
            update: { $set: { order: index } },
          },
        };
      });

      if (operations.length) await Media.bulkWrite(operations);

      return res.json({ success: true, message: "Media order saved." });
    }

    return res.status(400).json({ success: false, message: "Invalid action." });
  } catch (error) {
    next(error);
  }
};

// Admin: DELETE media
export const deleteMedia = async (req, res, next) => {
  try {
    const id = req.query.id || req.body.id || req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Valid media ID is required." });
    }

    const item = await Media.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Media not found." });
    }

    await Media.findByIdAndDelete(id);
    await deleteFromCloudinary(item.publicId, item.mediaType || item.resourceType || "video");

    return res.json({ success: true, message: "Media deleted successfully." });
  } catch (error) {
    next(error);
  }
};


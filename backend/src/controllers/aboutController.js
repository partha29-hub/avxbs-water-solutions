import { Readable } from "stream";
import About from "../models/About.js";
import cloudinary from "../config/cloudinary.js";

// Helper: Get or initialize singleton About document
async function getOrCreateAbout() {
  let doc = await About.findOne();
  if (!doc) {
    doc = await About.create({});
  }
  return doc;
}

// Public: GET /api/public/about
export const getPublicAbout = async (req, res, next) => {
  try {
    const about = await getOrCreateAbout();

    // Filter to active statistics sorted by order
    const activeStatistics = (about.statistics || [])
      .filter((s) => s.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Formatted establishment text (only if establishmentYear is provided)
    let formattedEstablishment = "";
    if (about.establishmentYear && String(about.establishmentYear).trim()) {
      const year = String(about.establishmentYear).trim();
      const template =
        about.establishmentStatement ||
        "Established in [YEAR], AVXBS is committed to delivering innovative water treatment and purification solutions for homes and industries.";
      formattedEstablishment = template.replace(/\[YEAR\]/gi, year);
    }

    return res.json({
      success: true,
      about: {
        heading: about.heading,
        tagline: about.tagline,
        introductionHeading: about.introductionHeading,
        introductionParagraphs: about.introductionParagraphs || [],
        establishmentStatement: about.establishmentStatement,
        establishmentYear: about.establishmentYear || "",
        formattedEstablishment,
        imageUrl: about.imageUrl || "",
        statistics: activeStatistics,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: GET /api/admin/about
export const getAdminAbout = async (req, res, next) => {
  try {
    const about = await getOrCreateAbout();

    // Return all statistics sorted by order for admin management
    const sortedStats = [...(about.statistics || [])].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    return res.json({
      success: true,
      about: {
        ...about.toObject(),
        statistics: sortedStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: PUT /api/admin/about
export const updateAdminAbout = async (req, res, next) => {
  try {
    const about = await getOrCreateAbout();

    const {
      heading,
      tagline,
      introductionHeading,
      introductionParagraphs,
      establishmentStatement,
      establishmentYear,
      imageUrl,
      imagePublicId,
      statistics,
    } = req.body;

    if (heading !== undefined) about.heading = String(heading).trim();
    if (tagline !== undefined) about.tagline = String(tagline).trim();
    if (introductionHeading !== undefined)
      about.introductionHeading = String(introductionHeading).trim();

    if (Array.isArray(introductionParagraphs)) {
      about.introductionParagraphs = introductionParagraphs
        .map((p) => String(p).trim())
        .filter(Boolean);
    }

    if (establishmentStatement !== undefined)
      about.establishmentStatement = String(establishmentStatement).trim();

    if (establishmentYear !== undefined)
      about.establishmentYear = String(establishmentYear).trim();

    if (imageUrl !== undefined) about.imageUrl = String(imageUrl).trim();
    if (imagePublicId !== undefined)
      about.imagePublicId = String(imagePublicId).trim();

    if (Array.isArray(statistics)) {
      about.statistics = statistics.map((stat, idx) => ({
        value: String(stat.value || "").trim(),
        suffix: String(stat.suffix ?? "%").trim(),
        label: String(stat.label || "").trim(),
        order: Number.isFinite(Number(stat.order)) ? Number(stat.order) : idx,
        isActive: stat.isActive !== false,
      }));
    }

    await about.save();

    return res.json({
      success: true,
      message: "About Us content updated successfully.",
      about,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: POST /api/admin/about/image
export const uploadAboutImage = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file provided." });
    }

    const about = await getOrCreateAbout();

    // Stream upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "avxbs/about",
        timeout: 120000,
      },
      async (error, result) => {
        if (error) return next(error);

        // Delete old image if it existed in Cloudinary
        if (about.imagePublicId && about.imagePublicId !== result.public_id) {
          try {
            await cloudinary.uploader.destroy(about.imagePublicId, {
              resource_type: "image",
            });
          } catch (delErr) {
            console.error("Cleanup old about image error:", delErr);
          }
        }

        // Save new image URL and publicId
        about.imageUrl = result.secure_url || result.url;
        about.imagePublicId = result.public_id;
        await about.save();

        return res.json({
          success: true,
          message: "Image uploaded and saved successfully.",
          imageUrl: about.imageUrl,
          imagePublicId: about.imagePublicId,
          about,
        });
      }
    );

    Readable.from(file.buffer).pipe(stream);
  } catch (error) {
    next(error);
  }
};

// Admin: DELETE /api/admin/about/image
export const deleteAboutImage = async (req, res, next) => {
  try {
    const about = await getOrCreateAbout();

    if (about.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(about.imagePublicId, {
          resource_type: "image",
        });
      } catch (delErr) {
        console.error("Cloudinary delete error:", delErr);
      }
    }

    about.imageUrl = "";
    about.imagePublicId = "";
    await about.save();

    return res.json({
      success: true,
      message: "About image removed successfully.",
      about,
    });
  } catch (error) {
    next(error);
  }
};


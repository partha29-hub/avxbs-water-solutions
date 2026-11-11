import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
import Solution from "../models/Solution.js";
import Highlight from "../models/Highlight.js";

// Public: GET solutions
export const getPublicSolutions = async (req, res, next) => {
  try {
    const { audience, category } = req.query;
    const query = { isActive: true };

    if (audience && ["Residential", "Commercial"].includes(audience)) {
      query.audience = { $in: [audience, "Both"] };
    }

    if (category) {
      query.category = {
        $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      };
    }

    const solutions = await Solution.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      solutions,
    });
  } catch (error) {
    next(error);
  }
};

// Public: GET highlights
export const getPublicHighlights = async (req, res, next) => {
  try {
    const { audience } = req.query;
    const query = { isActive: true };

    if (audience && ["Residential", "Commercial"].includes(audience)) {
      query.audience = { $in: [audience, "Both"] };
    }

    const highlights = await Highlight.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      highlights,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: GET solutions
export const getAdminSolutions = async (req, res, next) => {
  try {
    const solutions = await Solution.find()
      .sort({ audience: 1, category: 1, order: 1 })
      .lean();

    return res.json({
      success: true,
      solutions,
      products: solutions, // compatibility alias
    });
  } catch (error) {
    next(error);
  }
};

// Admin: POST create solution (also handles /api/admin/products)
export const createSolution = async (req, res, next) => {
  try {
    const {
      name,
      description,
      audience = "Residential",
      category = "General",
      image,
      badge,
      benefits,
      isFeatured,
      order,
      price,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Solution/Product name is required",
      });
    }

    const solution = await Solution.create({
      name: name.trim(),
      description: description || "",
      audience: ["Residential", "Commercial", "Both"].includes(audience) ? audience : "Residential",
      category: category || "General",
      image: image || "",
      badge: badge || "",
      benefits: Array.isArray(benefits) ? benefits : [],
      isFeatured: Boolean(isFeatured),
      order: Number(order) || 0,
      price: price ? Number(price) : undefined,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Solution created successfully",
      solution,
      product: solution, // compatibility alias
    });
  } catch (error) {
    next(error);
  }
};

// Admin: PUT update solution
export const updateSolution = async (req, res, next) => {
  try {
    const { id, ...updates } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Solution ID is required",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "audience",
      "category",
      "image",
      "badge",
      "benefits",
      "isFeatured",
      "isActive",
      "order",
      "price",
    ];

    const sanitizedUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const solution = await Solution.findByIdAndUpdate(
      id,
      { $set: sanitizedUpdates },
      { new: true, runValidators: true }
    );

    if (!solution) {
      return res.status(404).json({
        success: false,
        message: "Solution not found",
      });
    }

    return res.json({
      success: true,
      message: "Solution updated successfully",
      solution,
      product: solution, // compatibility alias
    });
  } catch (error) {
    next(error);
  }
};

// Admin: DELETE solution
export const deleteSolution = async (req, res, next) => {
  try {
    const id = req.body?.id || req.query?.id || req.params?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Solution ID is required",
      });
    }

    const solution = await Solution.findByIdAndDelete(id);
    if (!solution) {
      return res.status(404).json({
        success: false,
        message: "Solution not found",
      });
    }

    return res.json({
      success: true,
      message: "Solution deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Admin: GET highlights
export const getAdminHighlights = async (req, res, next) => {
  try {
    const highlights = await Highlight.find().sort({ order: 1, createdAt: -1 }).lean();
    return res.json({ success: true, highlights });
  } catch (error) {
    next(error);
  }
};

// Admin: POST highlight
export const createHighlight = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      label,
      description,
      icon,
      image,
      buttonText,
      buttonAction,
      buttonLink,
      audience,
      order,
      isActive,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }

    const highlight = await Highlight.create({
      title: title.trim(),
      subtitle: subtitle || label || "",
      label: label || subtitle || "",
      description: description || "",
      icon: icon || "Sparkles",
      image: image || "",
      buttonText: buttonText || "Explore",
      buttonAction: buttonAction || "inquiry",
      buttonLink: buttonLink || "",
      audience: ["Residential", "Commercial", "Both"].includes(audience) ? audience : "Both",
      order: Number(order) || 0,
      isActive: isActive !== false,
    });

    return res.status(201).json({ success: true, message: "Highlight created.", highlight });
  } catch (error) {
    next(error);
  }
};

// Admin: PUT highlight
export const updateHighlight = async (req, res, next) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required." });
    }

    if (updates.subtitle && !updates.label) updates.label = updates.subtitle;
    if (updates.label && !updates.subtitle) updates.subtitle = updates.label;
    if (updates.order !== undefined) updates.order = Number(updates.order) || 0;

    const highlight = await Highlight.findByIdAndUpdate(id, updates, { new: true });
    if (!highlight) {
      return res.status(404).json({ success: false, message: "Highlight not found." });
    }

    return res.json({ success: true, message: "Highlight updated.", highlight });
  } catch (error) {
    next(error);
  }
};

// Admin: DELETE highlight
export const deleteHighlight = async (req, res, next) => {
  try {
    const id = req.body?.id || req.query?.id || req.params?.id;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required." });
    }

    const highlight = await Highlight.findByIdAndDelete(id);
    if (!highlight) {
      return res.status(404).json({ success: false, message: "Highlight not found." });
    }

    return res.json({ success: true, message: "Highlight deleted." });
  } catch (error) {
    next(error);
  }
};

// Admin: POST upload highlight image to Cloudinary
export const uploadHighlightImage = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "avxbs/highlights",
        timeout: 120000,
      },
      (error, result) => {
        if (error) return next(error);
        return res.json({
          success: true,
          imageUrl: result.secure_url || result.url,
          publicId: result.public_id,
        });
      }
    );

    Readable.from(file.buffer).pipe(stream);
  } catch (error) {
    next(error);
  }
};

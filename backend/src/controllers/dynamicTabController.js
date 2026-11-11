import DynamicTab from "../models/DynamicTab.js";

// Public: Get active dynamic tabs
export const getPublicTabs = async (req, res, next) => {
  try {
    const { category, audience } = req.query;
    const filter = { isActive: true };

    const targetAudience = audience || category;
    if (targetAudience && ["Residential", "Commercial"].includes(targetAudience)) {
      filter.category = { $in: [targetAudience, "Both"] };
    }

    const tabs = await DynamicTab.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      tabs,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all dynamic tabs
export const getAdminTabs = async (req, res, next) => {
  try {
    const tabs = await DynamicTab.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      tabs,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create dynamic tab
export const createTab = async (req, res, next) => {
  try {
    const { title, category, isActive, order } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tab title is required",
      });
    }

    if (!["Residential", "Commercial", "Both"].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid audience",
      });
    }

    const tab = await DynamicTab.create({
      title: title.trim(),
      category,
      isActive: isActive ?? true,
      order: Number(order) || 0,
      fields: [],
    });

    return res.status(201).json({
      success: true,
      message: "Tab created successfully",
      tab,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update dynamic tab
export const updateTab = async (req, res, next) => {
  try {
    const { id, title, category, isActive, order } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Tab ID is required",
      });
    }

    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (category !== undefined) {
      if (!["Residential", "Commercial", "Both"].includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid audience",
        });
      }
      update.category = category;
    }
    if (isActive !== undefined) update.isActive = Boolean(isActive);
    if (order !== undefined) update.order = Number(order) || 0;

    const tab = await DynamicTab.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!tab) {
      return res.status(404).json({
        success: false,
        message: "Tab not found",
      });
    }

    return res.json({
      success: true,
      message: "Tab updated successfully",
      tab,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete dynamic tab
export const deleteTab = async (req, res, next) => {
  try {
    const id = req.body?.id || req.query?.id || req.params?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Tab ID is required",
      });
    }

    const tab = await DynamicTab.findByIdAndDelete(id);
    if (!tab) {
      return res.status(404).json({
        success: false,
        message: "Tab not found",
      });
    }

    return res.json({
      success: true,
      message: "Tab deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


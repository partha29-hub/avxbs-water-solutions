import mongoose from "mongoose";
import DynamicTab from "../models/DynamicTab.js";
import Solution from "../models/Solution.js";
import FormConfig from "../models/FormConfig.js";

const defaultFields = (audience) => [
  {
    id: `${audience}-full-name`,
    name: "name",
    label: "Full Name",
    type: "text",
    placeholder: "Enter your full name",
    required: true,
    enabled: true,
    options: [],
    order: 0,
  },
  {
    id: `${audience}-mobile`,
    name: "phone",
    label: "Mobile Number",
    type: "phone",
    placeholder: "Enter mobile number",
    required: true,
    enabled: true,
    options: [],
    order: 1,
  },
  {
    id: `${audience}-email`,
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "Enter email address",
    required: false,
    enabled: true,
    options: [],
    order: 2,
  },
  {
    id: `${audience}-remarks`,
    name: "remarks",
    label: "Remarks / Notes",
    type: "textarea",
    placeholder: "Tell us about your requirements",
    required: false,
    enabled: true,
    options: [],
    order: 3,
  },
];

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeFields(fields) {
  return (fields || []).map((field, index) => ({
    ...field,
    id: String(field.id || field._id || `${field.name}-${index}`),
    type:
      field.type === "select"
        ? "dropdown"
        : field.type === "tel"
        ? "phone"
        : field.type,
    enabled: field.enabled !== false,
    order: Number.isFinite(Number(field.order))
      ? Number(field.order)
      : index,
  }));
}

// Public: GET form configuration for drawer
export const getFormConfig = async (req, res, next) => {
  try {
    const { solutionId, solutionName, tabId, tabName, category, audience } = req.query;

    const targetAudience =
      audience === "Commercial" ? "Commercial" : "Residential";

    // 1. Resolve Solution (via ObjectId or Safe Name Fallback)
    let solution = null;
    if (solutionId && mongoose.Types.ObjectId.isValid(solutionId)) {
      solution = await Solution.findOne({
        _id: solutionId,
        isActive: true,
      }).lean();
    }

    if (!solution && solutionName) {
      const cleanName = solutionName.trim();
      solution = await Solution.findOne({
        name: {
          $regex: `^${escapeRegex(cleanName)}$`,
          $options: "i",
        },
        isActive: true,
      }).lean();

      // If not matched exactly, try keyword match if available
      if (!solution) {
        const firstWord = cleanName.split(/\s+/)[0];
        if (firstWord && firstWord.length > 3) {
          solution = await Solution.findOne({
            name: {
              $regex: escapeRegex(firstWord),
              $options: "i",
            },
            isActive: true,
          }).lean();
        }
      }
    }

    // 2. Resolve Dynamic Tab (via ObjectId, Solution Category, or Name)
    let dynamicTab = null;

    if (tabId && mongoose.Types.ObjectId.isValid(tabId)) {
      dynamicTab = await DynamicTab.findOne({
        _id: tabId,
        isActive: true,
      }).lean();
    }

    // Try solution category
    if (!dynamicTab && solution?.category) {
      dynamicTab = await DynamicTab.findOne({
        title: {
          $regex: `^${escapeRegex(solution.category.trim())}$`,
          $options: "i",
        },
        category: { $in: [targetAudience, "Both"] },
        isActive: true,
      }).lean();
    }

    // Try tabName or category parameter
    const queryCategory = (tabName || category || "").trim();
    if (!dynamicTab && queryCategory) {
      dynamicTab = await DynamicTab.findOne({
        title: {
          $regex: `^${escapeRegex(queryCategory)}$`,
          $options: "i",
        },
        category: { $in: [targetAudience, "Both"] },
        isActive: true,
      }).lean();
    }

    // Try solutionName
    if (!dynamicTab && solutionName) {
      dynamicTab = await DynamicTab.findOne({
        title: {
          $regex: `^${escapeRegex(solutionName.trim())}$`,
          $options: "i",
        },
        category: { $in: [targetAudience, "Both"] },
        isActive: true,
      }).lean();
    }

    // Try semantic partial match (e.g. "soften" in "Commercial Softening Plant" -> "Water Softening")
    if (!dynamicTab) {
      const searchTerms = [solutionName, queryCategory, solution?.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (searchTerms.includes("soften")) {
        dynamicTab = await DynamicTab.findOne({
          title: { $regex: /soften/i },
          category: { $in: [targetAudience, "Both"] },
          isActive: true,
        }).lean();
      } else if (searchTerms.includes("wtp") || searchTerms.includes("purif")) {
        dynamicTab = await DynamicTab.findOne({
          title: { $regex: /wtp/i },
          category: { $in: [targetAudience, "Both"] },
          isActive: true,
        }).lean();
      }
    }

    // Safe fallback to the primary active DynamicTab for this audience if still not matched
    if (!dynamicTab) {
      dynamicTab = await DynamicTab.findOne({
        category: { $in: [targetAudience, "Both"] },
        isActive: true,
      })
        .sort({ order: 1, _id: 1 })
        .lean();
    }

    // If solution was not found but Dynamic Tab exists, attempt to find a related solution
    if (!solution && dynamicTab) {
      solution = await Solution.findOne({
        category: {
          $regex: `^${escapeRegex(dynamicTab.title.trim())}$`,
          $options: "i",
        },
        isActive: true,
      }).lean();
    }

    // 3. Resolve Form Builder Fields
    // Priority A: Custom Dynamic Tab fields configured in Form Builder
    let fields = [];
    let formSource = "Default";

    if (dynamicTab?.fields?.length > 0) {
      fields = dynamicTab.fields;
      formSource = "DynamicTab";
    }

    // Priority B: FormConfig collection (main-inquiry-form)
    if (fields.length === 0) {
      const config = await FormConfig.findOne({
        key: "main-inquiry-form",
      }).lean();

      if (config?.products?.length > 0) {
        // Find matching product config by solutionId or solutionName
        let productConfig = null;
        if (solution?._id) {
          productConfig = config.products.find(
            (p) => String(p.solutionId) === String(solution._id)
          );
        }
        if (!productConfig && (solution?.name || solutionName)) {
          const matchName = (solution?.name || solutionName).toLowerCase();
          productConfig = config.products.find(
            (p) => p.solutionName?.toLowerCase() === matchName
          );
        }
        // Fallback to first productConfig in the collection
        if (!productConfig) {
          productConfig = config.products[0];
        }

        // Find the form for targetAudience
        const selectedForm = productConfig?.forms?.find(
          (form) => form.audience === targetAudience
        );

        if (selectedForm?.fields?.length > 0) {
          fields = selectedForm.fields;
          formSource = "FormConfig";
        }
      }
    }

    // Priority C: Standard baseline default fields for target audience
    if (fields.length === 0) {
      fields = defaultFields(targetAudience);
      formSource = "DefaultBaseline";
    }

    const activeFields = normalizeFields(fields)
      .filter((field) => field.enabled !== false)
      .sort((a, b) => a.order - b.order);

    const resolvedProduct =
      solution?.name ||
      solutionName ||
      dynamicTab?.title ||
      (targetAudience === "Commercial"
        ? "Commercial Softening Plant"
        : "Water Softener");

    const resolvedTabName =
      dynamicTab?.title || solution?.category || "Water Softening";

    return res.json({
      success: true,
      source: formSource,
      tabId: dynamicTab ? String(dynamicTab._id) : "",
      tabName: resolvedTabName,
      solutionId: solution ? String(solution._id) : "",
      productName: resolvedProduct,
      category: resolvedTabName,
      audience: targetAudience,
      fields: activeFields,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: GET form builder tabs and fields
export const getAdminFormConfig = async (req, res, next) => {
  try {
    const tabs = await DynamicTab.find({ isActive: true })
      .sort({ order: 1, title: 1 })
      .lean();

    const result = tabs.map((tab) => ({
      tabId: String(tab._id),
      title: tab.title,
      category: tab.category,
      fields:
        tab.fields?.length > 0
          ? tab.fields
          : defaultFields(tab.category),
    }));

    return res.json({
      success: true,
      tabs: result,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: PUT update form builder fields
export const updateAdminFormConfig = async (req, res, next) => {
  try {
    const { tabId, fields } = req.body;

    if (!tabId || !Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        message: "Valid Tab ID and fields array are required.",
      });
    }

    const tab = await DynamicTab.findById(tabId);
    if (!tab) {
      return res.status(404).json({
        success: false,
        message: "Dynamic Tab not found.",
      });
    }

    tab.fields = fields.map((field, idx) => ({
      id: field.id || `field-${idx}-${Date.now()}`,
      label: field.label,
      name: field.name,
      type: field.type || "text",
      placeholder: field.placeholder || "",
      required: Boolean(field.required),
      enabled: field.enabled !== false,
      options: Array.isArray(field.options) ? field.options : [],
      order: Number(field.order) || idx,
    }));

    await tab.save();

    return res.json({
      success: true,
      message: "Form fields saved successfully.",
      tab,
    });
  } catch (error) {
    next(error);
  }
};


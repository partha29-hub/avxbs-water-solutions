import Assistance from "../models/Assistance.js";

const defaultAssistance = {
  enabled: true,
  buttonLabel: "Need Assistance?",
  openingMessage:
    "Hello AVXBS Team, I need assistance with your water treatment solutions. Please share more details.",
  departments: [
    {
      name: "General Enquiry",
      phone: "919692625703",
      isActive: true,
    },
  ],
  defaultDepartment: "General Enquiry",
};

// GET WhatsApp Assistance settings
export const getAssistance = async (req, res, next) => {
  try {
    let settings = await Assistance.findOne().lean();

    if (!settings) {
      settings = await Assistance.create(defaultAssistance);
    }

    return res.json(settings);
  } catch (error) {
    next(error);
  }
};

// Admin: PUT update WhatsApp Assistance settings
export const updateAssistance = async (req, res, next) => {
  try {
    const { enabled, buttonLabel, openingMessage, departments, defaultDepartment } = req.body;

    let settings = await Assistance.findOne();
    if (!settings) {
      settings = new Assistance(defaultAssistance);
    }

    if (typeof enabled === "boolean") settings.enabled = enabled;
    if (buttonLabel) settings.buttonLabel = buttonLabel;
    if (openingMessage) settings.openingMessage = openingMessage;
    if (defaultDepartment) settings.defaultDepartment = defaultDepartment;
    if (Array.isArray(departments)) settings.departments = departments;

    await settings.save();

    return res.json({
      success: true,
      message: "Assistance settings updated successfully.",
      settings,
    });
  } catch (error) {
    next(error);
  }
};


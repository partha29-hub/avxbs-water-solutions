import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Solution from "../models/Solution.js";
import Inquiry from "../models/Inquiry.js";
import Media from "../models/Media.js";
import DynamicTab from "../models/DynamicTab.js";
import Review from "../models/Review.js";

// Helper to set cookie
const setAdminCookie = (res, token) => {
  res.cookie("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

// Admin Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin._id.toString(),
        role: admin.role || "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    setAdminCookie(res, token);

    return res.json({
      success: true,
      message: "Admin login successful!",
      token,
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin Logout
export const logout = async (req, res) => {
  res.clearCookie("admin_token", {
    path: "/",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res.json({
    success: true,
    message: "Admin logged out successfully.",
  });
};

// Admin Register (bootstrap / create)
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const existing = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Admin with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "admin",
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully.",
      admin: {
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Admin Profile / Account
export const getAccount = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.adminId).select(
      "name email role createdAt"
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    return res.json({
      success: true,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

// Update Admin Profile
export const updateAccount = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    const existing = await Admin.findOne({
      email: normalizedEmail,
      _id: { $ne: req.admin.adminId },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This email is already in use.",
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.admin.adminId,
      {
        $set: {
          name: name.trim(),
          email: normalizedEmail,
        },
      },
      { new: true, runValidators: true }
    ).select("name email role createdAt");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      admin,
    });
  } catch (error) {
    next(error);
  }
};

// Update Password
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const admin = await Admin.findById(req.admin.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password.",
      });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard Stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const [totalSolutions, totalInquiries, totalVideos, activeTabs, totalReviews] =
      await Promise.all([
        Solution.countDocuments(),
        Inquiry.countDocuments(),
        Media.countDocuments(),
        DynamicTab.countDocuments({ isActive: true }),
        Review.countDocuments(),
      ]);

    return res.json({
      success: true,
      stats: {
        totalSolutions,
        totalInquiries,
        totalVideos,
        activeTabs,
        totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};


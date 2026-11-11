import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import connectDB from "../../../../lib/db";
import Admin from "../../../../models/Admin";

export const runtime = "nodejs";

export async function PATCH(request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Please login first." },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const {
      currentPassword,
      newEmail,
      newPassword,
      confirmPassword,
    } = await request.json();

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, message: "Current password is required." },
        { status: 400 }
      );
    }

    if (!newEmail && !newPassword) {
      return NextResponse.json(
        { success: false, message: "Enter a new email or password." },
        { status: 400 }
      );
    }

    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found." },
        { status: 404 }
      );
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    if (newEmail) {
      const email = newEmail.trim().toLowerCase();

      const existingAdmin = await Admin.findOne({
        email,
        _id: { $ne: admin._id },
      });

      if (existingAdmin) {
        return NextResponse.json(
          { success: false, message: "Email already in use." },
          { status: 409 }
        );
      }

      admin.email = email;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 8 characters." },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { success: false, message: "Passwords do not match." },
          { status: 400 }
        );
      }

      admin.password = await bcrypt.hash(newPassword, 12);
    }

    await admin.save();

    const newToken = jwt.sign(
      {
        adminId: admin._id.toString(),
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    cookieStore.set("admin_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({
      success: true,
      message: "Admin account updated successfully!",
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin Profile Update Error:", error);

    return NextResponse.json(
      { success: false, message: "Profile update failed. Please login again." },
      { status: 401 }
    );
  }
}
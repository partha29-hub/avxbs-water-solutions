import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "../../../../../lib/db";
import Admin from "../../../../../models/Admin";
import { verifyAdmin } from "../../../../../lib/adminAuth";

export const runtime = "nodejs";

export async function PATCH(request) {
  try {
    const session = await verifyAdmin();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Both password fields are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const admin = await Admin.findById(session.adminId);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin account not found." },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(currentPassword, admin.password);

    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Password PATCH:", error);
    return NextResponse.json(
      { success: false, message: "Unable to change password." },
      { status: 500 }
    );
  }
}
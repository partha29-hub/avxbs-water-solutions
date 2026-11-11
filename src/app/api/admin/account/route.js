import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Admin from "../../../../models/Admin";
import { verifyAdmin } from "../../../../lib/adminAuth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await verifyAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const admin = await Admin.findById(session.adminId).select(
      "name email role createdAt"
    );

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    console.error("Account GET:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load account." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await verifyAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, email } = await request.json();

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, message: "Name and email are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Admin.findOne({
      email: normalizedEmail,
      _id: { $ne: session.adminId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "This email is already in use." },
        { status: 409 }
      );
    }

    const admin = await Admin.findByIdAndUpdate(
      session.adminId,
      {
        $set: {
          name: name.trim(),
          email: normalizedEmail,
        },
      },
      { new: true, runValidators: true }
    ).select("name email role createdAt");

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully. Please log in again if your email changed.",
      admin,
    });
  } catch (error) {
    console.error("Account PUT:", error);
    return NextResponse.json(
      { success: false, message: "Unable to update profile." },
      { status: 500 }
    );
  }
}
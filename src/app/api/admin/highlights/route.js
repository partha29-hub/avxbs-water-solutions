
import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Highlight from "../../../../models/Highlight";
import { verifyAdmin } from "../../../../lib/adminAuth";

export const runtime = "nodejs";

// GET: Fetch highlights
export async function GET() {
  try {
    const admin = await verifyAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectDB();

    const highlights = await Highlight.find()
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      highlights,
    });
  } catch (error) {
    console.error("Get Highlights Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch highlights" },
      { status: 500 }
    );
  }
}

// POST: Create highlight
export async function POST(request) {
  try {
    const admin = await verifyAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 }
      );
    }

    const highlight = await Highlight.create({
      title: body.title,
      subtitle: body.subtitle || "",
      description: body.description || "",
      icon: body.icon || "",
      image: body.image || "",
      buttonText: body.buttonText || "Explore",
      buttonLink: body.buttonLink || "",
      isActive: body.isActive ?? true,
      order: Number(body.order) || 0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Highlight created successfully",
        highlight,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Highlight Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create highlight" },
      { status: 500 }
    );
  }
}

// PUT: Update highlight
export async function PUT(request) {
  try {
    const admin = await verifyAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Highlight ID is required" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "title", "subtitle", "description", "icon",
      "image", "buttonText", "buttonLink",
      "isActive", "order"
    ];

    const safeUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    const highlight = await Highlight.findByIdAndUpdate(
      id,
      safeUpdates,
      { new: true, runValidators: true }
    );

    if (!highlight) {
      return NextResponse.json(
        { success: false, message: "Highlight not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Highlight updated successfully",
      highlight,
    });
  } catch (error) {
    console.error("Update Highlight Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update highlight" },
      { status: 500 }
    );
  }
}

// DELETE: Remove highlight
export async function DELETE(request) {
  try {
    const admin = await verifyAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Highlight ID is required" },
        { status: 400 }
      );
    }

    const highlight = await Highlight.findByIdAndDelete(id);

    if (!highlight) {
      return NextResponse.json(
        { success: false, message: "Highlight not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Highlight deleted successfully",
    });
  } catch (error) {
    console.error("Delete Highlight Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete highlight" },
      { status: 500 }
    );
  }
}

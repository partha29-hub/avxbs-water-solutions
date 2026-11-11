import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { verifyAdmin } from "../../../../lib/adminAuth";
import DynamicTab from "../../../../models/DynamicTab";

export const runtime = "nodejs";

async function checkAdmin() {
  const admin = await verifyAdmin();
  return admin;
}

// GET: Fetch all tabs
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const tabs = await DynamicTab.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, tabs });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new tab
export async function POST(request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { title, category, isActive, order } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, message: "Tab title is required" },
        { status: 400 }
      );
    }

    if (!["Residential", "Commercial", "Both"].includes(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid audience" },
        { status: 400 }
      );
    }

    const tab = await DynamicTab.create({
      title: title.trim(),
      category,
      isActive: isActive ?? true,
      order: Number(order) || 0,
      fields: [],
    });

    return NextResponse.json(
      { success: true, message: "Tab created successfully", tab },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update tab
export async function PUT(request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { id, title, category, isActive, order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Tab ID is required" },
        { status: 400 }
      );
    }

    const update = {};

    if (title !== undefined) update.title = title.trim();
    if (category !== undefined) {
      if (!["Residential", "Commercial", "Both"].includes(category)) {
        return NextResponse.json(
          { success: false, message: "Invalid audience" },
          { status: 400 }
        );
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
      return NextResponse.json(
        { success: false, message: "Tab not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tab updated successfully",
      tab,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete tab
export async function DELETE(request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Tab ID is required" },
        { status: 400 }
      );
    }

    const tab = await DynamicTab.findByIdAndDelete(id);

    if (!tab) {
      return NextResponse.json(
        { success: false, message: "Tab not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tab deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


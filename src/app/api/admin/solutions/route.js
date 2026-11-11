
import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Solution from "../../../../models/Solution";
import { verifyAdmin } from "../../../../lib/adminAuth";

export const runtime = "nodejs";

// GET: Fetch all solutions
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

    const solutions = await Solution.find()
      .sort({ audience: 1, category: 1, order: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      solutions,
    });
  } catch (error) {
    console.error("Get Solutions Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch solutions" },
      { status: 500 }
    );
  }
}

// POST: Add a new solution
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

    const {
      name,
      description,
      audience,
      category,
      image,
      badge,
      benefits,
      isFeatured,
      order,
    } = body;

    if (!name || !audience || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, audience and category are required",
        },
        { status: 400 }
      );
    }

    if (!["Residential", "Commercial"].includes(audience)) {
      return NextResponse.json(
        { success: false, message: "Invalid audience" },
        { status: 400 }
      );
    }

    const solution = await Solution.create({
      name,
      description,
      audience,
      category,
      image,
      badge,
      benefits: Array.isArray(benefits) ? benefits : [],
      isFeatured: Boolean(isFeatured),
      order: Number(order) || 0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Solution added successfully",
        solution,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Solution Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create solution" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing solution
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

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Solution ID is required" },
        { status: 400 }
      );
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
    ];

    const safeUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    if (
      safeUpdates.audience &&
      !["Residential", "Commercial"].includes(safeUpdates.audience)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid audience" },
        { status: 400 }
      );
    }

    const solution = await Solution.findByIdAndUpdate(
      id,
      safeUpdates,
      { new: true, runValidators: true }
    );

    if (!solution) {
      return NextResponse.json(
        { success: false, message: "Solution not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Solution updated successfully",
      solution,
    });
  } catch (error) {
    console.error("Update Solution Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update solution" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a solution
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
        { success: false, message: "Solution ID is required" },
        { status: 400 }
      );
    }

    const solution = await Solution.findByIdAndDelete(id);

    if (!solution) {
      return NextResponse.json(
        { success: false, message: "Solution not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Solution deleted successfully",
    });
  } catch (error) {
    console.error("Delete Solution Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete solution" },
      { status: 500 }
    );
  }
}

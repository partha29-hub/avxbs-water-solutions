
import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Solution from "../../../../models/Solution";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const audience = searchParams.get("audience");

    const filter = {
      isActive: true,
    };

    if (audience) {
  if (!["Residential", "Commercial"].includes(audience)) {
    return NextResponse.json(
      { success: false, message: "Invalid audience" },
      { status: 400 }
    );
  }

  filter.audience = {
    $in: [audience, "Both"],
  };
}

    const solutions = await Solution.find(filter)
      .select(
        "name description audience category image badge benefits isFeatured order"
      )
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      solutions,
    });
  } catch (error) {
    console.error("Public Solutions API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load solutions",
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import DynamicTab from "../../../../models/DynamicTab";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const audience = searchParams.get("audience");

    const filter = { isActive: true };

    if (audience) {
      if (!["Residential", "Commercial"].includes(audience)) {
        return NextResponse.json(
          { success: false, message: "Invalid audience" },
          { status: 400 }
        );
      }

      filter.category = { $in: [audience, "Both"] };
    }

    const tabs = await DynamicTab.find(filter)
      .select("title category isActive order")
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      tabs,
    });
  } catch (error) {
    console.error("Public Dynamic Tabs Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load dynamic tabs" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";

import connectDB from "../../../../lib/db";
import { verifyAdmin } from "../../../../lib/adminAuth";

import Solution from "../../../../models/Solution";
import Inquiry from "../../../../models/Inquiry";
import Media from "../../../../models/Media";
import DynamicTab from "../../../../models/DynamicTab";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = await verifyAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 401 }
      );
    }

    await connectDB();

    const [
      totalSolutions,
      totalInquiries,
      totalVideos,
      activeTabs,
    ] = await Promise.all([
      Solution.countDocuments(),
      Inquiry.countDocuments(),
      Media.countDocuments(),
      DynamicTab.countDocuments({ isActive: true }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalSolutions,
        totalInquiries,
        totalVideos,
        activeTabs,
      },
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard statistics."
      },
      { status: 500 }
    );
  }
}

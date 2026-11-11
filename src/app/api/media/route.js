import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Media from "../../../models/Media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const media = await Media.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const items = media.map((item) => ({
      ...item,
      mediaType: item.mediaType || item.resourceType || "video",
    }));

    return NextResponse.json(
      { success: true, media: items, videos: items },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Public Media API Error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load media." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Footer from "../../../models/Footer";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    let footer = await Footer.findOne().lean();

    if (!footer) {
      footer = await Footer.create({});
      footer = footer.toObject();
    }

    return NextResponse.json(
      {
        success: true,
        footer: {
          ...footer,
          legalLinks: (footer.legalLinks || []).filter(
            (item) => item.isActive
          ),
          socialLinks: (footer.socialLinks || []).filter(
            (item) => item.isActive
          ),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Public Footer Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load footer" },
      { status: 500 }
    );
  }
}

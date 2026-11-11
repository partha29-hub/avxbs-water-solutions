
import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { verifyAdmin } from "../../../../lib/adminAuth";
import Footer from "../../../../models/Footer";

export const runtime = "nodejs";

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

    let footer = await Footer.findOne();

    if (!footer) footer = await Footer.create({});

    return NextResponse.json({ success: true, footer });
  } catch (error) {
    console.error("Admin Footer GET:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load footer settings" },
      { status: 500 }
    );
  }
}

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

    const allowedFields = [
      "brandTagline",
      "topMessage",
      "aboutHeading",
      "aboutDescription",
      "highlightText",
      "contactHeading",
      "contactDescription",
      "addressHeading",
      "address",
      "phoneHeading",
      "phone",
      "emailHeading",
      "email",
      "legalLinks",
      "socialLinks",
      "copyrightCompany",
      "rightsText",
      "showCopyrightYear",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (
      updates.legalLinks &&
      (!Array.isArray(updates.legalLinks) ||
        updates.legalLinks.some(
          (item) =>
            typeof item.label !== "string" ||
            typeof item.url !== "string"
        ))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid legal links" },
        { status: 400 }
      );
    }

    if (
      updates.socialLinks &&
      (!Array.isArray(updates.socialLinks) ||
        updates.socialLinks.some(
          (item) =>
            typeof item.platform !== "string" ||
            typeof item.url !== "string"
        ))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid social links" },
        { status: 400 }
      );
    }

    const footer = await Footer.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Footer settings saved successfully",
      footer,
    });
  } catch (error) {
    console.error("Admin Footer PUT:", error);
    return NextResponse.json(
      { success: false, message: "Unable to save footer settings" },
      { status: 500 }
    );
  }
}

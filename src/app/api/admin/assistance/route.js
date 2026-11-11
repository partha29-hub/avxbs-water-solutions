import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Assistance from "../../../../models/Assistance";
import { verifyAdmin } from "../../../../lib/adminAuth";

export const runtime = "nodejs";

const defaults = {
  enabled: true,
  buttonLabel: "Need Assistance?",
  openingMessage:
    "Hello AVXBS Team, I need assistance with your water treatment solutions. Please share more details.",
  departments: [
    {
      name: "General Enquiry",
      phone: "919692625703",
      isActive: true,
    },
  ],
  defaultDepartment: "General Enquiry",
};

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    let settings = await Assistance.findOne();
    if (!settings) settings = await Assistance.create(defaults);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Assistance GET:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (
      !Array.isArray(body.departments) ||
      body.departments.length === 0 ||
      body.departments.some(
        (item) =>
          !item.name?.trim() ||
          !/^\d{8,15}$/.test(String(item.phone).replace(/\D/g, ""))
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Add at least one department with a valid phone number.",
        },
        { status: 400 }
      );
    }

    const settingsData = {
      enabled: Boolean(body.enabled),
      buttonLabel: String(body.buttonLabel || "Need Assistance?").trim(),
      openingMessage: String(body.openingMessage || "").trim(),
      departments: body.departments.map((item) => ({
        name: String(item.name).trim(),
        phone: String(item.phone).replace(/\D/g, ""),
        isActive: Boolean(item.isActive),
      })),
      defaultDepartment: String(body.defaultDepartment || "").trim(),
    };

    const selected = settingsData.departments.find(
      (item) =>
        item.name === settingsData.defaultDepartment && item.isActive
    );

    if (!selected) {
      return NextResponse.json(
        {
          success: false,
          message: "Select an active default department.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const settings = await Assistance.findOneAndUpdate(
      {},
      { $set: settingsData },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Assistance settings saved successfully!",
      settings,
    });
  } catch (error) {
    console.error("Assistance PUT:", error);
    return NextResponse.json(
      { success: false, message: "Unable to save settings." },
      { status: 500 }
    );
  }
}
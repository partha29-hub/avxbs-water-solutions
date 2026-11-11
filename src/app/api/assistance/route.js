import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Assistance from "../../../models/Assistance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const settings = await Assistance.findOne().lean();

    if (!settings) {
      return NextResponse.json({
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
      });
    }

    return NextResponse.json({
      enabled: settings.enabled,
      buttonLabel: settings.buttonLabel,
      openingMessage: settings.openingMessage,
      departments: settings.departments.filter((item) => item.isActive),
      defaultDepartment: settings.defaultDepartment,
    });
  } catch (error) {
    console.error("Public Assistance API:", error);
    return NextResponse.json(
      { enabled: false, departments: [] },
      { status: 500 }
    );
  }
}
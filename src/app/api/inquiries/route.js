
import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Inquiry from "../../../models/Inquiry";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      name,
      email,
      phone,
      category,
      subject,
      message,
      product,
      formData,
      audience,
      tabId,
      tabName,
      solutionId,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, message: "Name is required." },
        { status: 400 }
      );
    }

    if (!phone || !String(phone).trim()) {
      return NextResponse.json(
        { success: false, message: "Phone number is required." },
        { status: 400 }
      );
    }

    if (String(name).trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid name." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim();

    if (!/^[+]?[0-9\s()-]{10,16}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid phone number." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email || "").trim().toLowerCase();

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email." },
        { status: 400 }
      );
    }

    const inquiry = await Inquiry.create({
      name: String(name).trim(),
      email: cleanEmail,
      phone: cleanPhone,

      audience: ["Residential", "Commercial"].includes(audience)
        ? audience
        : "",

      tabId: String(tabId || "").trim(),
      tabName: String(tabName || "").trim(),
      solutionId: String(solutionId || "").trim(),

      category: String(category || "").trim(),
      subject: String(subject || product || "").trim(),
      message: String(message || "").trim(),
      product: String(product || "").trim(),

      formData:
        formData &&
        typeof formData === "object" &&
        !Array.isArray(formData)
          ? formData
          : {},
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your inquiry has been submitted successfully!",
        inquiryId: inquiry._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Inquiry API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit inquiry. Please try again.",
      },
      { status: 500 }
    );
  }
}

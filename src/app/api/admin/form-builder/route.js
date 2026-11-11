import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import DynamicTab from "../../../../models/DynamicTab";
import { verifyAdmin } from "../../../../lib/adminAuth";

export const runtime = "nodejs";

const defaultFields = (audience) => [
  {
    id: `${audience}-full-name`,
    name: "name",
    label: "Full Name",
    type: "text",
    placeholder: "Enter your full name",
    required: true,
    enabled: true,
    options: [],
    order: 0,
  },
  {
    id: `${audience}-mobile`,
    name: "phone",
    label: "Mobile Number",
    type: "phone",
    placeholder: "Enter mobile number",
    required: true,
    enabled: true,
    options: [],
    order: 1,
  },
  {
    id: `${audience}-email`,
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "Enter email address",
    required: false,
    enabled: true,
    options: [],
    order: 2,
  },
  {
    id: `${audience}-remarks`,
    name: "remarks",
    label: "Remarks / Notes",
    type: "textarea",
    placeholder: "Tell us about your requirements",
    required: false,
    enabled: true,
    options: [],
    order: 3,
  },
];

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

    const tabs = await DynamicTab.find({ isActive: true })
      .sort({ order: 1, title: 1 })
      .lean();

    const result = tabs.map((tab) => ({
      tabId: String(tab._id),
      title: tab.title,
      category: tab.category,
      fields:
        tab.fields?.length > 0
          ? tab.fields
          : defaultFields(tab.category),
    }));

    return NextResponse.json({
      success: true,
      tabs: result,
    });
  } catch (error) {
    console.error("Form Builder GET Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load Dynamic Tabs." },
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

    const { tabId, fields } = await request.json();

    if (!tabId || !Array.isArray(fields) || fields.length > 50) {
      return NextResponse.json(
        { success: false, message: "Invalid tab form data." },
        { status: 400 }
      );
    }

    const validTypes = [
      "text", "number", "email", "phone", "textarea",
      "dropdown", "radio", "checkbox", "date",
    ];

    const ids = new Set();
    const names = new Set();

    for (const field of fields) {
      if (
        !field.id ||
        !field.label?.trim() ||
        !field.name?.trim() ||
        !validTypes.includes(field.type)
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid field configuration." },
          { status: 400 }
        );
      }

      if (ids.has(field.id) || names.has(field.name)) {
        return NextResponse.json(
          { success: false, message: "Field IDs and names must be unique." },
          { status: 400 }
        );
      }

      ids.add(field.id);
      names.add(field.name);

      if (
        ["dropdown", "radio", "checkbox"].includes(field.type) &&
        (!Array.isArray(field.options) ||
          !field.options.some((option) => String(option).trim()))
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Add at least one option for ${field.label}.`,
          },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const safeFields = fields.map((field, index) => ({
      id: String(field.id),
      label: String(field.label).trim(),
      name: String(field.name).trim(),
      type: field.type,
      placeholder: String(field.placeholder || ""),
      required: Boolean(field.required),
      enabled: field.enabled !== false,
      options: Array.isArray(field.options)
        ? field.options.map((option) => String(option).trim()).filter(Boolean)
        : [],
      order: index,
    }));

    const tab = await DynamicTab.findByIdAndUpdate(
      tabId,
      { $set: { fields: safeFields } },
      { new: true, runValidators: true }
    );

    if (!tab) {
      return NextResponse.json(
        { success: false, message: "Dynamic Tab not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tab form saved successfully.",
    });
  } catch (error) {
    console.error("Form Builder PUT Error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to save tab form." },
      { status: 500 }
    );
  }
}
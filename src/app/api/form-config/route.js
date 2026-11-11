
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "../../../lib/db";
import FormConfig from "../../../models/FormConfig";
import Solution from "../../../models/Solution";
import DynamicTab from "../../../models/DynamicTab";

export const runtime = "nodejs";

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDefaultFields(audience) {
  return [
    {
      id: `${audience}-property-type`,
      name: "type",
      label: "Property Type",
      type: "dropdown",
      placeholder: "Select property type",
      required: true,
      enabled: true,
      options: ["Residential", "Commercial"],
      order: 0,
    },
    {
      id: `${audience}-full-name`,
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter your full name",
      required: true,
      enabled: true,
      options: [],
      order: 1,
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
      order: 2,
    },
    {
      id: `${audience}-email`,
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "Enter email address",
      required: true,
      enabled: true,
      options: [],
      order: 3,
    },
    {
      id: `${audience}-remarks`,
      name: "remarks",
      label: "Remarks",
      type: "textarea",
      placeholder: "Tell us about your requirement",
      required: false,
      enabled: true,
      options: [],
      order: 4,
    },
  ];
}

function normalizeFields(fields) {
  return (fields || []).map((field, index) => ({
    ...field,
    id: String(field.id || field._id || `${field.name}-${index}`),
    type:
      field.type === "select"
        ? "dropdown"
        : field.type === "tel"
          ? "phone"
          : field.type,
    enabled: field.enabled !== false,
    order: Number.isFinite(Number(field.order))
      ? Number(field.order)
      : index,
  }));
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const solutionId = searchParams.get("solutionId");
    const solutionName = searchParams.get("solutionName")?.trim();
    const audience = searchParams.get("audience");

    if (!["Residential", "Commercial"].includes(audience)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid audience is required.",
        },
        { status: 400 }
      );
    }

    if (!solutionId && !solutionName) {
      return NextResponse.json(
        {
          success: false,
          message: "Solution selection is required.",
        },
        { status: 400 }
      );
    }

    // 1. Find the selected Solution first.
    let solution = null;

    if (solutionId && mongoose.Types.ObjectId.isValid(solutionId)) {
      solution = await Solution.findOne({
        _id: solutionId,
        isActive: true,
        audience: { $in: [audience, "Both"] },
      }).lean();
    }

    if (!solution && solutionName) {
      solution = await Solution.findOne({
        name: {
          $regex: `^${escapeRegex(solutionName)}$`,
          $options: "i",
        },
        isActive: true,
        audience: { $in: [audience, "Both"] },
      }).lean();
    }

    // 2. Find DynamicTab using the Solution category.
    // DynamicTab title represents the category, not the Solution name.
    let dynamicTab = null;

    if (solution?.category) {
      dynamicTab = await DynamicTab.findOne({
        title: {
          $regex: `^${escapeRegex(solution.category.trim())}$`,
          $options: "i",
        },
        category: { $in: [audience, "Both"] },
        isActive: true,
      }).lean();
    }

    // 3. Direct tab-name fallback for callers passing a tab title.
    if (!dynamicTab && solutionName) {
      dynamicTab = await DynamicTab.findOne({
        title: {
          $regex: `^${escapeRegex(solutionName)}$`,
          $options: "i",
        },
        category: { $in: [audience, "Both"] },
        isActive: true,
      }).lean();
    }

    // 4. If a matching DynamicTab exists, use its configured fields.
    if (dynamicTab) {
      const fields = dynamicTab.fields?.length
        ? normalizeFields(dynamicTab.fields)
        : getDefaultFields(audience);

      const activeFields = fields
        .filter((field) => field.enabled !== false)
        .sort((a, b) => a.order - b.order);

      return NextResponse.json({
        success: true,
        source: "DynamicTab",
        tabId: String(dynamicTab._id),
        solutionId: solution ? String(solution._id) : "",
        productName: solution?.name || solutionName || dynamicTab.title,
        tabName: dynamicTab.title,
        audience,
        fields: activeFields,
      });
    }

    // 5. Fallback to existing FormConfig.
    if (!solution) {
      return NextResponse.json(
        {
          success: false,
          message: "Matching Solution or Dynamic Tab not found.",
        },
        { status: 404 }
      );
    }

    const config = await FormConfig.findOne({
      key: "main-inquiry-form",
    }).lean();

    const productConfig = config?.products?.find(
      (item) => String(item.solutionId) === String(solution._id)
    );

    const selectedForm = productConfig?.forms?.find(
      (form) => form.audience === audience
    );

    const fields = selectedForm?.fields?.length
      ? selectedForm.fields
      : getDefaultFields(audience);

    const activeFields = normalizeFields(fields)
      .filter((field) => field.enabled !== false)
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({
      success: true,
      source: "Solution",
      solutionId: String(solution._id),
      productName: solution.name,
      audience,
      fields: activeFields,
    });
  } catch (error) {
    console.error("Public Form Config API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load form configuration.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

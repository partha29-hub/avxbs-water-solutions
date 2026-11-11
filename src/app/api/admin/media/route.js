import { NextResponse } from "next/server";
import { Readable } from "stream";
import mongoose from "mongoose";
import connectDB from "../../../../lib/db";
import { verifyAdmin } from "../../../../lib/adminAuth";
import cloudinary from "../../../../lib/cloudinary";
import Media from "../../../../models/Media";

export const runtime = "nodejs";

async function authorize() {
  return Boolean(await verifyAdmin());
}

function getType(file) {
  if (file?.type?.startsWith("image/")) return "image";
  if (file?.type?.startsWith("video/")) return "video";
  return null;
}

async function uploadAsset(file) {
  const mediaType = getType(file);

  if (!mediaType) throw new Error("Only image and video files are allowed.");
  if (!file.size) throw new Error("Selected file is empty.");

  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: mediaType,
        folder: `avxbs/${mediaType === "image" ? "images" : "videos"}`,
        timeout: 600000,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ ...result, mediaType });
      }
    );

    Readable.from(buffer).pipe(stream);
  });
}

async function deleteAsset(publicId, resourceType = "video") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === "image" ? "image" : "video",
      invalidate: true,
    });
  } catch (error) {
    console.error("Cloudinary cleanup error:", error);
  }
}

export async function GET() {
  try {
    if (!(await authorize())) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const media = await Media.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, media, videos: media });
  } catch (error) {
    console.error("Admin Media GET:", error);
    return NextResponse.json({ success: false, message: "Unable to fetch media." }, { status: 500 });
  }
}

export async function POST(request) {
  const uploaded = [];

  try {
    if (!(await authorize())) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const formData = await request.formData();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();

    const files = [
      ...formData.getAll("media"),
      ...formData.getAll("videos"),
      ...(formData.get("video") ? [formData.get("video")] : []),
    ].filter((file) => file && typeof file.arrayBuffer === "function" && file.size > 0);

    if (!title) {
      return NextResponse.json({ success: false, message: "Title is required." }, { status: 400 });
    }

    if (!files.length) {
      return NextResponse.json({ success: false, message: "Select at least one photo or video." }, { status: 400 });
    }

    const created = [];

    for (let i = 0; i < files.length; i++) {
      const asset = await uploadAsset(files[i]);
      uploaded.push(asset);

      const item = await Media.create({
        title: files.length > 1 ? `${title} ${i + 1}` : title,
        description,
        videoUrl: asset.secure_url,
        publicId: asset.public_id,
        resourceType: asset.mediaType,
        mediaType: asset.mediaType,
        isActive: true,
        order: Date.now() + i,
      });

      created.push(item);
    }

    return NextResponse.json({
      success: true,
      message: `${created.length} media file(s) uploaded successfully.`,
      media: created,
      videos: created,
    }, { status: 201 });
  } catch (error) {
    console.error("Admin Media POST:", error);
    for (const asset of uploaded) {
      await deleteAsset(asset.public_id, asset.mediaType);
    }
    return NextResponse.json({
      success: false,
      message: error.message || "Unable to upload media.",
    }, { status: 500 });
  }
}

export async function PUT(request) {
  let newAsset = null;

  try {
    if (!(await authorize())) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const formData = await request.formData();
    const id = String(formData.get("id") || "");
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "");
    const file = formData.get("media") || formData.get("video");

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: "Valid media ID is required." }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ success: false, message: "Title is required." }, { status: 400 });
    }

    const item = await Media.findById(id);
    if (!item) {
      return NextResponse.json({ success: false, message: "Media not found." }, { status: 404 });
    }

    const oldPublicId = item.publicId;
    const oldType = item.mediaType || item.resourceType || "video";

    if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
      newAsset = await uploadAsset(file);
      item.videoUrl = newAsset.secure_url;
      item.publicId = newAsset.public_id;
      item.resourceType = newAsset.mediaType;
      item.mediaType = newAsset.mediaType;
    }

    item.title = title;
    item.description = description.trim();
    await item.save();

    if (newAsset && oldPublicId) {
      await deleteAsset(oldPublicId, oldType);
    }

    return NextResponse.json({
      success: true,
      message: newAsset ? "Media replaced successfully." : "Media details updated successfully.",
      media: item,
      video: item,
    });
  } catch (error) {
    console.error("Admin Media PUT:", error);
    if (newAsset?.public_id) {
      await deleteAsset(newAsset.public_id, newAsset.mediaType);
    }
    return NextResponse.json({ success: false, message: error.message || "Unable to update media." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!(await authorize())) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    if (body.action === "status") {
      if (!mongoose.isValidObjectId(body.id) || typeof body.isActive !== "boolean") {
        return NextResponse.json({ success: false, message: "Invalid status request." }, { status: 400 });
      }

      const item = await Media.findByIdAndUpdate(
        body.id,
        { $set: { isActive: body.isActive } },
        { new: true, runValidators: true }
      );

      if (!item) {
        return NextResponse.json({ success: false, message: "Media not found." }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Media status updated.", media: item, video: item });
    }

    if (body.action === "reorder") {
      if (!Array.isArray(body.media || body.videos)) {
        return NextResponse.json({ success: false, message: "Invalid ordering data." }, { status: 400 });
      }

      const items = body.media || body.videos;
      const operations = items.map((item, index) => {
        if (!mongoose.isValidObjectId(item.id)) throw new Error("Invalid media ID.");
        return {
          updateOne: {
            filter: { _id: item.id },
            update: { $set: { order: index } },
          },
        };
      });

      if (operations.length) await Media.bulkWrite(operations);

      return NextResponse.json({ success: true, message: "Media order saved." });
    }

    return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Admin Media PATCH:", error);
    return NextResponse.json({ success: false, message: error.message || "Unable to update media." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!(await authorize())) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const id = new URL(request.url).searchParams.get("id");
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: "Valid media ID is required." }, { status: 400 });
    }

    const item = await Media.findById(id);
    if (!item) {
      return NextResponse.json({ success: false, message: "Media not found." }, { status: 404 });
    }

    await Media.findByIdAndDelete(id);
    await deleteAsset(item.publicId, item.mediaType || item.resourceType || "video");

    return NextResponse.json({ success: true, message: "Media deleted successfully." });
  } catch (error) {
    console.error("Admin Media DELETE:", error);
    return NextResponse.json({ success: false, message: "Unable to delete media." }, { status: 500 });
  }
}
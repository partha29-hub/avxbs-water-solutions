import mongoose from "mongoose";
import * as XLSX from "xlsx";
import Inquiry from "../models/Inquiry.js";
import DynamicTab from "../models/DynamicTab.js";

// Helper: Classify inquiry into Residential or Commercial
export function getInquirySection(inquiry) {
  if (inquiry.section) {
    const s = String(inquiry.section).toLowerCase().trim();
    if (s.includes("commercial")) return "Commercial";
    if (s.includes("residential")) return "Residential";
  }

  const audience = String(
    inquiry.audience ||
    inquiry.formData?.audience ||
    inquiry.category ||
    ""
  ).toLowerCase().trim();

  // Commercial inquiries
  if (
    audience === "commercial" ||
    String(inquiry.category || "").toLowerCase().trim() === "commercial"
  ) {
    return "Commercial";
  }

  // All other residential submissions (Hero, Header, Plumbing, Modular Kitchen, Water Softening, etc.)
  return "Residential";
}

// Public: Submit inquiry
export const submitInquiry = async (req, res, next) => {
  try {
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
      section: rawSection,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required.",
      });
    }

    if (!phone || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    if (String(name).trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid customer name.",
      });
    }

    const cleanPhone = String(phone).trim();
    if (!/^[+]?[0-9\s()-]{10,16}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number (10-16 digits).",
      });
    }

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const determinedAudience = ["Residential", "Commercial"].includes(audience)
      ? audience
      : cleanEmail.includes("enterprise") || cleanEmail.includes("corp")
      ? "Commercial"
      : "Residential";

    const computedSection =
      rawSection ||
      getInquirySection({
        audience: determinedAudience,
        category,
        tabName,
        product,
        formData,
      });

    const inquiry = await Inquiry.create({
      name: String(name).trim(),
      email: cleanEmail,
      phone: cleanPhone,
      audience: determinedAudience,
      section: computedSection,
      tabId: String(tabId || "").trim(),
      tabName: String(tabName || "").trim(),
      solutionId: String(solutionId || "").trim(),
      category: String(category || determinedAudience).trim(),
      subject: String(subject || product || "").trim(),
      message: String(message || "").trim(),
      product: String(product || subject || tabName || "Water Treatment Solution").trim(),
      formData:
        formData && typeof formData === "object" && !Array.isArray(formData)
          ? formData
          : {},
      status: "New",
    });

    return res.status(201).json({
      success: true,
      message: "Your inquiry has been submitted successfully!",
      inquiryId: inquiry._id,
      inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get Inquiries with Search, Filter & Section Classification
export const getInquiries = async (req, res, next) => {
  try {
    const {
      section,
      audience,
      status,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { product: { $regex: s, $options: "i" } },
        { subject: { $regex: s, $options: "i" } },
        { tabName: { $regex: s, $options: "i" } },
      ];
    }

    // Fetch all inquiries matching basic search/status query
    const allMatching = await Inquiry.find(query).sort({ createdAt: -1 }).lean();

    // Map each inquiry to ensure its section is computed
    const enriched = allMatching.map((item) => {
      const resolvedSection = item.section || getInquirySection(item);
      return {
        ...item,
        section: resolvedSection,
      };
    });

    // Compute live metric counts for all tabs
    const counts = {
      total: enriched.length,
      residential: enriched.filter((i) => i.section === "Residential").length,
      commercial: enriched.filter((i) => i.section === "Commercial").length,
      new: enriched.filter((i) => i.status === "New").length,
      contacted: enriched.filter((i) => i.status === "Contacted").length,
      completed: enriched.filter((i) => i.status === "Completed").length,
    };

    // Filter by category/section if specified
    let filtered = enriched;
    if (section && section !== "All") {
      const matchKey = section.toLowerCase();
      filtered = enriched.filter((item) =>
        item.section.toLowerCase().includes(matchKey)
      );
    } else if (audience && audience !== "All") {
      const matchAud = audience.toLowerCase();
      filtered = enriched.filter(
        (item) =>
          item.section.toLowerCase().includes(matchAud) ||
          String(item.audience || "").toLowerCase().includes(matchAud) ||
          String(item.category || "").toLowerCase().includes(matchAud)
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const totalFiltered = filtered.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedInquiries = filtered.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      inquiries: paginatedInquiries,
      counts,
      pagination: {
        total: totalFiltered,
        page: pageNum,
        pages: Math.ceil(totalFiltered / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get Single Inquiry Details
export const getInquiryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry ID format.",
      });
    }

    const inquiry = await Inquiry.findById(id).lean();
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Customer inquiry record not found.",
      });
    }

    const resolvedSection = inquiry.section || getInquirySection(inquiry);

    return res.json({
      success: true,
      inquiry: {
        ...inquiry,
        section: resolvedSection,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update Status
export const updateInquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry ID format.",
      });
    }

    if (!["New", "Contacted", "Completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: New, Contacted, Completed.",
      });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Customer inquiry record not found.",
      });
    }

    return res.json({
      success: true,
      message: `Inquiry status updated to ${status}.`,
      inquiry: {
        ...inquiry.toObject(),
        section: inquiry.section || getInquirySection(inquiry),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete Inquiry
export const deleteInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry ID format.",
      });
    }

    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Customer inquiry not found or already deleted.",
      });
    }

    return res.json({
      success: true,
      message: "Customer inquiry deleted permanently.",
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Export to Real Excel (.xlsx) File
export const exportInquiries = async (req, res, next) => {
  try {
    const { section, search, status } = req.query;

    const query = {};
    if (status && status !== "All") {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { product: { $regex: s, $options: "i" } },
      ];
    }

    const rawInquiries = await Inquiry.find(query).sort({ createdAt: -1 }).lean();

    let list = rawInquiries.map((item) => ({
      ...item,
      section: item.section || getInquirySection(item),
    }));

    if (section && section !== "All") {
      const matchKey = section.toLowerCase();
      list = list.filter((item) => item.section.toLowerCase().includes(matchKey));
    }

    // Identify all unique dynamic form field keys across all items
    const dynamicKeys = new Set();
    list.forEach((item) => {
      if (item.formData && typeof item.formData === "object") {
        Object.keys(item.formData).forEach((k) => {
          if (!["audience", "tabId", "tabName", "solutionId", "name", "email", "phone"].includes(k)) {
            dynamicKeys.add(k);
          }
        });
      }
    });

    const dynamicKeysArray = Array.from(dynamicKeys);

    // Build structured data rows for Excel sheet
    const rows = list.map((item, index) => {
      const row = {
        "S.No": index + 1,
        "Submission Date": new Date(item.createdAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        "Section": item.section,
        "Customer Name": item.name,
        "Phone Number": item.phone,
        "Email Address": item.email || "N/A",
        "Audience": item.audience || "Residential",
        "Product / Solution": item.product || item.subject || "Water Treatment",
        "Tab Name": item.tabName || "General",
        "Status": item.status || "New",
        "Message / Remarks": item.message || "",
      };

      // Append all dynamic answers with clean formatted labels
      dynamicKeysArray.forEach((key) => {
        const val = item.formData ? item.formData[key] : "";
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        row[label] = Array.isArray(val) ? val.join(", ") : val !== undefined && val !== null ? String(val) : "";
      });

      return row;
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    const colWidths = Object.keys(rows[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...rows.map((r) => String(r[key] || "").length)
      );
      return { wch: Math.min(45, Math.max(12, maxLen + 3)) };
    });
    worksheet["!cols"] = colWidths;

    const sheetName = (section && section !== "All" ? section.replace(/\s+/g, "_") : "All_Inquiries").slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const filename = `AVXBS_${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

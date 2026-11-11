"use client";

import React, { useState, useEffect, useRef } from "react";
import "./about.css";
import {
  ArrowLeft,
  UploadCloud,
  Trash2,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Image as ImageIcon,
} from "lucide-react";

const initialForm = {
  heading: "About AVXBS",
  tagline:
    "Delivering advanced, unique solutions for residential and commercial infrastructure.",
  introductionHeading: "Company Introduction & Overview",
  introductionParagraphs: [
    "AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.",
    "Water hardness causes persistent scale deposition, plumbing deterioration, reduced thermal efficiency in water heaters, and premature appliance failure. At AVXBS, we merge precision chemical engineering with intelligent automated flow sensing to eliminate calcium and magnesium hardness at the point of entry.",
    "From luxury residences and high-rise apartments to industrial boiler feeds and commercial hospitality complexes, our engineered solutions protect equipment, elevate water quality, and optimize resource efficiency.",
  ],
  establishmentStatement:
    "Established in [YEAR], AVXBS is committed to delivering innovative water treatment and purification solutions for homes and industries.",
  establishmentYear: "",
  imageUrl: "",
  imagePublicId: "",
  statistics: [
    { value: "99.8", suffix: "%", label: "Scale Reduction", order: 0, isActive: true },
    { value: "50", suffix: "%", label: "Lower Salt Consumption", order: 1, isActive: true },
    { value: "100", suffix: "%", label: "Food-Grade Resins", order: 2, isActive: true },
  ],
};

export default function AboutClient({ admin }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const fileInputRef = useRef(null);

  // Load current About content
  useEffect(() => {
    let isMounted = true;

    async function loadAboutData() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/about", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Unable to load About Us content.");
        }

        if (isMounted && data.about) {
          setForm({
            ...initialForm,
            ...data.about,
            introductionParagraphs:
              data.about.introductionParagraphs?.length > 0
                ? data.about.introductionParagraphs
                : initialForm.introductionParagraphs,
            statistics:
              data.about.statistics?.length > 0
                ? data.about.statistics
                : initialForm.statistics,
          });
        }
      } catch (err) {
        if (isMounted) {
          setNotice({ type: "error", message: err.message });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAboutData();

    return () => {
      isMounted = false;
    };
  }, []);

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Field updates
  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Paragraphs
  const handleParagraphChange = (index, value) => {
    const nextParagraphs = [...(form.introductionParagraphs || [])];
    nextParagraphs[index] = value;
    setForm((prev) => ({ ...prev, introductionParagraphs: nextParagraphs }));
  };

  const handleAddParagraph = () => {
    setForm((prev) => ({
      ...prev,
      introductionParagraphs: [...(prev.introductionParagraphs || []), ""],
    }));
  };

  const handleRemoveParagraph = (index) => {
    setForm((prev) => ({
      ...prev,
      introductionParagraphs: prev.introductionParagraphs.filter((_, i) => i !== index),
    }));
  };

  // Statistics
  const handleStatChange = (index, field, value) => {
    const nextStats = [...form.statistics];
    nextStats[index] = { ...nextStats[index], [field]: value };
    setForm((prev) => ({ ...prev, statistics: nextStats }));
  };

  const handleAddStat = () => {
    setForm((prev) => ({
      ...prev,
      statistics: [
        ...prev.statistics,
        {
          value: "100",
          suffix: "%",
          label: "New Metric",
          order: prev.statistics.length,
          isActive: true,
        },
      ],
    }));
  };

  const handleDeleteStat = (index) => {
    setForm((prev) => ({
      ...prev,
      statistics: prev.statistics.filter((_, i) => i !== index),
    }));
  };

  // Image Upload via Cloudinary
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotice("error", "Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    try {
      setUploadingImage(true);
      setNotice({ type: "", message: "" });

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/admin/about/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Image upload failed.");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
      }));

      showNotice("success", "Image uploaded successfully to Cloudinary!");
    } catch (err) {
      showNotice("error", err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove Image
  const handleRemoveImage = async () => {
    if (!window.confirm("Are you sure you want to remove this About Us image?")) {
      return;
    }

    try {
      setUploadingImage(true);
      const res = await fetch("/api/admin/about/image", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to remove image.");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: "",
        imagePublicId: "",
      }));

      showNotice("success", "Image removed successfully.");
    } catch (err) {
      showNotice("error", err.message || "Failed to remove image.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Save all changes
  const handleSaveAll = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setNotice({ type: "", message: "" });

      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save About Us changes.");
      }

      showNotice("success", "About Us content saved successfully!");
    } catch (err) {
      showNotice("error", err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="about-admin-main">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "40px 0" }}>
          <Loader2 className="animate-spin" size={24} color="#ff4657" />
          <span>Loading About Us content...</span>
        </div>
      </main>
    );
  }

  // Active statistics for preview
  const previewStats = (form.statistics || [])
    .filter((s) => s.isActive !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  return (
    <main className="about-admin-main">
      {/* Header */}
      <header className="about-admin-header">
        <div>
          <span className="about-header-badge">WEBSITE CONTENT</span>
          <h1>About Management</h1>
          <p>Manage the public About AVXBS heading, overview paragraphs, establishment details, image, and statistics.</p>
        </div>
        <a href="/admin/dashboard" className="back-dash-link">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </a>
      </header>

      {/* Notifications */}
      {notice.message && (
        <div className={`about-notice ${notice.type}`} role="alert">
          {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notice.message}</span>
        </div>
      )}

      <form onSubmit={handleSaveAll}>
        <div className="about-admin-grid">
          {/* Left Column: Form Sections */}
          <div className="about-forms-column">
            {/* SECTION A: ABOUT HEADER */}
            <section className="about-admin-card">
              <div className="card-title-row">
                <div>
                  <h2>Section A: About Header</h2>
                  <p>Main title and introductory tagline at the top of the About page.</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="about-heading">About Page Title</label>
                <input
                  id="about-heading"
                  type="text"
                  className="form-input"
                  value={form.heading || ""}
                  onChange={(e) => handleFieldChange("heading", e.target.value)}
                  placeholder="e.g. About AVXBS"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="about-tagline">About Page Tagline</label>
                <textarea
                  id="about-tagline"
                  rows={2}
                  className="form-textarea"
                  value={form.tagline || ""}
                  onChange={(e) => handleFieldChange("tagline", e.target.value)}
                  placeholder="Delivering advanced, unique solutions for residential and commercial infrastructure."
                  required
                />
                <span className="field-hint">
                  Displayed directly below the "About AVXBS" heading with centered responsive typography.
                </span>
              </div>
            </section>

            {/* SECTION B: COMPANY INTRODUCTION & OVERVIEW */}
            <section className="about-admin-card">
              <div className="card-title-row">
                <div>
                  <h2>Section B: Company Introduction & Overview</h2>
                  <p>Manage section heading, paragraphs, and establishment statement.</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="intro-heading">Section Heading</label>
                <input
                  id="intro-heading"
                  type="text"
                  className="form-input"
                  value={form.introductionHeading || ""}
                  onChange={(e) =>
                    handleFieldChange("introductionHeading", e.target.value)
                  }
                  placeholder="e.g. Company Introduction & Overview"
                  required
                />
              </div>

              <div className="form-group">
                <label>Introduction Paragraphs</label>
                {(form.introductionParagraphs || []).map((paragraph, index) => (
                  <div key={index} style={{ marginBottom: "12px" }}>
                    <div className="paragraph-header-row">
                      <span>Paragraph {index + 1}</span>
                      {form.introductionParagraphs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParagraph(index)}
                          className="btn-remove-paragraph"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      className="form-textarea"
                      value={paragraph}
                      onChange={(e) => handleParagraphChange(index, e.target.value)}
                      placeholder={`Enter text for paragraph ${index + 1}`}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddParagraph}
                  className="btn-add-stat"
                  style={{ marginTop: "4px" }}
                >
                  <Plus size={15} />
                  <span>Add Another Paragraph</span>
                </button>
              </div>

              <div className="establishment-fields-grid">
                <div className="form-group">
                  <label htmlFor="est-statement">Establishment Statement Template</label>
                  <input
                    id="est-statement"
                    type="text"
                    className="form-input"
                    value={form.establishmentStatement || ""}
                    onChange={(e) =>
                      handleFieldChange("establishmentStatement", e.target.value)
                    }
                    placeholder="Established in [YEAR], AVXBS is committed to..."
                  />
                  <span className="field-hint">
                    Use <code>[YEAR]</code> as placeholder. Only displayed when Establishment Year is filled.
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="est-year">Establishment Year</label>
                  <input
                    id="est-year"
                    type="text"
                    className="form-input"
                    value={form.establishmentYear || ""}
                    onChange={(e) =>
                      handleFieldChange("establishmentYear", e.target.value)
                    }
                    placeholder="e.g. 2018 (or blank)"
                  />
                  <span className="field-hint">Leave blank until officially provided.</span>
                </div>
              </div>
            </section>

            {/* SECTION C: ABOUT IMAGE MANAGEMENT */}
            <section className="about-admin-card">
              <div className="card-title-row">
                <div>
                  <h2>Section C: About Image Management</h2>
                  <p>Replaces the old blue "Engineered Purity at Scale" box with a professional uploaded image.</p>
                </div>
              </div>

              <div className="image-upload-box">
                {form.imageUrl ? (
                  <div className="current-image-preview">
                    <img src={form.imageUrl} alt="About AVXBS Image" />
                    <div className="image-actions-overlay">
                      <button
                        type="button"
                        className="btn-remove-img"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                      >
                        <Trash2 size={13} />
                        <span>Remove Image</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="image-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="dropzone-content">
                      <UploadCloud size={36} className="dropzone-icon" />
                      <p className="dropzone-title">Click to upload About Us Image</p>
                      <p className="dropzone-subtitle">PNG, JPG, or WEBP up to 10MB. Stored on Cloudinary.</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageFileChange}
                />

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="btn-add-stat"
                    style={{ flex: 1 }}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="animate-spin" size={15} />
                        <span>Uploading to Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={15} />
                        <span>{form.imageUrl ? "Replace Image via Cloudinary" : "Upload Image to Cloudinary"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* SECTION D: STATISTICS MANAGEMENT */}
            <section className="about-admin-card">
              <div className="card-title-row">
                <div>
                  <h2>Section D: Statistics Management</h2>
                  <p>Manage dynamic percentage and performance metrics displayed on the About page.</p>
                </div>
              </div>

              <div className="stats-table-wrapper">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th style={{ width: "100px" }}>Value</th>
                      <th style={{ width: "65px" }}>Suffix</th>
                      <th>Label / Title</th>
                      <th style={{ width: "65px", textAlign: "center" }}>Order</th>
                      <th style={{ width: "70px", textAlign: "center" }}>Active</th>
                      <th style={{ width: "45px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.statistics || []).map((stat, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            className="form-input stat-input-val"
                            value={stat.value || ""}
                            onChange={(e) =>
                              handleStatChange(index, "value", e.target.value)
                            }
                            placeholder="e.g. 99.8"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input stat-input-suffix"
                            value={stat.suffix ?? "%"}
                            onChange={(e) =>
                              handleStatChange(index, "suffix", e.target.value)
                            }
                            placeholder="%"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input stat-input-label"
                            value={stat.label || ""}
                            onChange={(e) =>
                              handleStatChange(index, "label", e.target.value)
                            }
                            placeholder="e.g. Scale Reduction"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input stat-input-order"
                            value={stat.order ?? index}
                            onChange={(e) =>
                              handleStatChange(
                                index,
                                "order",
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={stat.isActive !== false}
                            onChange={(e) =>
                              handleStatChange(index, "isActive", e.target.checked)
                            }
                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn-icon-delete"
                            onClick={() => handleDeleteStat(index)}
                            title="Delete statistic"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="btn-add-stat"
                onClick={handleAddStat}
              >
                <Plus size={16} />
                <span>Add New Statistic</span>
              </button>
            </section>

            {/* SAVE ACTION BAR */}
            <div className="save-action-bar">
              <button
                type="submit"
                className="btn-save-main"
                disabled={saving || uploadingImage}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={17} />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Card Preview */}
          <div className="about-preview-column">
            <div className="preview-card">
              <span className="preview-badge">Live Preview</span>

              <div className="preview-hero-box">
                <h3 className="preview-hero-title">
                  {form.heading || "About AVXBS"}
                </h3>
                <p className="preview-hero-tagline">
                  {form.tagline || "Delivering advanced, unique solutions for residential and commercial infrastructure."}
                </p>
              </div>

              <div className="preview-image-box">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Uploaded About Preview" />
                ) : (
                  <div className="preview-image-empty">
                    <ImageIcon size={28} style={{ margin: "0 auto 6px", opacity: 0.6, display: "block" }} />
                    <span>No image uploaded yet. Upload an image in Section C.</span>
                  </div>
                )}
              </div>

              {form.establishmentYear && (
                <div className="preview-est-note">
                  {(form.establishmentStatement || "Established in [YEAR]...").replace(
                    /\[YEAR\]/gi,
                    form.establishmentYear
                  )}
                </div>
              )}

              <div className="preview-stats-row">
                {previewStats.slice(0, 3).map((st, i) => (
                  <div className="preview-stat-item" key={i}>
                    <span className="preview-stat-val">
                      {st.value}
                      {st.suffix}
                    </span>
                    <span className="preview-stat-label">{st.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}


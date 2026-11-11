"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./banners.css";
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Eye,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Video,
  Image as ImageIcon,
  Film,
  Play,
  X,
  Layers,
} from "lucide-react";

const initialForm = {
  order: 0,
  isActive: true,
  mediaType: "image", // "image" | "video"
  mediaUrl: "",
  publicId: "",
  posterUrl: "",
  posterPublicId: "",
};

export default function BannersClient({ admin }) {
  const [banners, setBanners] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    images: 0,
    videos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: "", message: "" });

  // Filters (Independent of audience)
  const [statusFilter, setStatusFilter] = useState("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");

  // Add / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staged files for unified upload + save
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [localMediaPreview, setLocalMediaPreview] = useState("");
  const [selectedPosterFile, setSelectedPosterFile] = useState(null);
  const [localPosterPreview, setLocalPosterPreview] = useState("");

  // File input refs
  const mediaFileRef = useRef(null);
  const posterFileRef = useRef(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview modal state
  const [previewTarget, setPreviewTarget] = useState(null);

  const showNotice = (type, message) => {
    setNotice({ type, message });
    setTimeout(() => {
      setNotice({ type: "", message: "" });
    }, 5000);
  };

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isFormOpen || deleteTarget || previewTarget) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFormOpen, deleteTarget, previewTarget]);

  // Broadcast updates to open homepage tabs
  const broadcastUpdate = () => {
    try {
      window.localStorage.setItem("avxbs_banner_updated", Date.now().toString());
    } catch (e) {
      // ignore
    }
  };

  // Fetch banners from backend
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (mediaTypeFilter !== "all") params.append("mediaType", mediaTypeFilter);

      const res = await fetch(`/api/admin/banners?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch banners.");
      }

      setBanners(data.banners || []);
      if (data.stats) {
        setStats({
          total: data.stats.total || 0,
          active: data.stats.active || 0,
          inactive: data.stats.inactive || 0,
          images: data.stats.images || 0,
          videos: data.stats.videos || 0,
        });
      }
    } catch (err) {
      showNotice("error", err.message || "Failed to load banners.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, mediaTypeFilter]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Open Add modal
  const openAddModal = (presetType = "image") => {
    setEditingBanner(null);
    setSelectedMediaFile(null);
    setLocalMediaPreview("");
    setSelectedPosterFile(null);
    setLocalPosterPreview("");
    setFormData({
      ...initialForm,
      mediaType: presetType,
      order:
        banners.length > 0
          ? Math.max(...banners.map((b) => Number(b.order) || 0)) + 1
          : 0,
    });
    setIsFormOpen(true);
  };

  // Open Edit modal
  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setSelectedMediaFile(null);
    setLocalMediaPreview("");
    setSelectedPosterFile(null);
    setLocalPosterPreview("");
    setFormData({
      order: banner.order !== undefined ? banner.order : 0,
      isActive: banner.isActive !== undefined ? banner.isActive : true,
      mediaType: banner.mediaType || "image",
      mediaUrl: banner.mediaUrl || banner.desktopImageUrl || "",
      publicId: banner.publicId || banner.desktopImagePublicId || "",
      posterUrl: banner.posterUrl || "",
      posterPublicId: banner.posterPublicId || "",
    });
    setIsFormOpen(true);
  };

  // Toggle active status
  const handleToggleActive = async (banner) => {
    const originalBanners = [...banners];
    const newStatus = !banner.isActive;

    // Optimistic UI update
    setBanners((prev) =>
      prev.map((b) => (b._id === banner._id ? { ...b, isActive: newStatus } : b))
    );
    setStats((prev) => ({
      ...prev,
      active: newStatus ? prev.active + 1 : prev.active - 1,
      inactive: newStatus ? prev.inactive - 1 : prev.inactive + 1,
    }));

    try {
      const res = await fetch(`/api/admin/banners/${banner._id}/toggle-active`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to toggle banner status.");
      }

      broadcastUpdate();
      showNotice(
        "success",
        data.message || `Banner ${newStatus ? "activated" : "deactivated"} successfully.`
      );
    } catch (err) {
      setBanners(originalBanners);
      showNotice("error", err.message || "Failed to toggle status.");
    }
  };

  // Select media file with instant local preview
  const handleMediaFileSelect = (file) => {
    if (!file) return;

    const isVideo =
      file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
    const isImage =
      file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.name);

    if (!isVideo && !isImage) {
      showNotice(
        "error",
        "Please select a valid media file: JPG, JPEG, PNG, WEBP, MP4, or WEBM."
      );
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      showNotice("error", "File size exceeds 100MB maximum limit.");
      return;
    }

    setSelectedMediaFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLocalMediaPreview(objectUrl);
    setFormData((prev) => ({
      ...prev,
      mediaType: isVideo ? "video" : "image",
    }));
  };

  // Select video poster file with instant preview
  const handlePosterFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotice("error", "Poster must be an image file (JPG, PNG, WEBP).");
      return;
    }

    setSelectedPosterFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLocalPosterPreview(objectUrl);
  };

  // Submit: uploads to Cloudinary and saves in MongoDB
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!selectedMediaFile && !formData.mediaUrl) {
      showNotice("error", "Please select an image or video file to upload.");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("mediaType", formData.mediaType || "image");
      submitData.append("order", formData.order !== undefined ? formData.order : 0);
      submitData.append("isActive", formData.isActive !== false ? "true" : "false");

      if (selectedMediaFile) {
        submitData.append("media", selectedMediaFile);
      } else if (formData.mediaUrl) {
        submitData.append("mediaUrl", formData.mediaUrl);
        submitData.append("publicId", formData.publicId || "");
      }

      if (selectedPosterFile) {
        submitData.append("poster", selectedPosterFile);
      } else if (formData.posterUrl) {
        submitData.append("posterUrl", formData.posterUrl);
        submitData.append("posterPublicId", formData.posterPublicId || "");
      }

      const url = editingBanner
        ? `/api/admin/banners/${editingBanner._id}`
        : "/api/admin/banners";
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        body: submitData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save banner.");
      }

      broadcastUpdate();
      showNotice("success", data.message || "Banner published directly to homepage slider.");
      setIsFormOpen(false);
      setSelectedMediaFile(null);
      setLocalMediaPreview("");
      setSelectedPosterFile(null);
      setLocalPosterPreview("");
      fetchBanners();
    } catch (err) {
      showNotice("error", err.message || "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/banners/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete banner.");
      }

      broadcastUpdate();
      showNotice("success", "Banner deleted successfully.");
      setDeleteTarget(null);
      fetchBanners();
    } catch (err) {
      showNotice("error", err.message || "Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="banners-admin-main">
      {/* Top Header */}
      <header className="banners-admin-header">
        <div>
          <span className="banners-header-badge">HERO SLIDER CONTROL</span>
          <h1>Banner Management</h1>
          <p>
            Upload image and video banners for the homepage hero slider.
            Media uploaded here appears directly in the hero carousel.
          </p>
        </div>
        <div className="banners-header-actions">
          <a href="/admin/dashboard" className="back-dash-link">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </a>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => openAddModal("image")}
          >
            <ImageIcon size={16} />
            <span>Add Image Banner</span>
          </button>
          <button
            type="button"
            className="btn-primary-action"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              boxShadow: "0 4px 18px rgba(139, 92, 246, 0.35)",
            }}
            onClick={() => openAddModal("video")}
          >
            <Film size={16} />
            <span>Add Video Banner</span>
          </button>
        </div>
      </header>

      {/* Notifications */}
      {notice.message && (
        <div className={`banners-notice ${notice.type}`} role="alert">
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Statistics Row: Total, Active, Inactive, Images, Videos */}
      <section className="banners-metrics-grid">
        <div className="metric-card">
          <div className="metric-val">{stats.total}</div>
          <div className="metric-label">Total Banners</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "#34d399" }}>
            {stats.active}
          </div>
          <div className="metric-label">Active on Homepage</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "#f87171" }}>
            {stats.inactive}
          </div>
          <div className="metric-label">Inactive</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "#60a5fa" }}>
            {stats.images}
          </div>
          <div className="metric-label">Image Banners</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "#c084fc" }}>
            {stats.videos}
          </div>
          <div className="metric-label">Video Banners</div>
        </div>
      </section>

      {/* Toolbar: Media Type Filter & Status Filter */}
      <section className="banners-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Layers size={18} color="#ff4657" />
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
            Hero Carousel Banners
          </span>
        </div>

        <div className="toolbar-filters">
          <select
            className="select-filter"
            value={mediaTypeFilter}
            onChange={(e) => setMediaTypeFilter(e.target.value)}
          >
            <option value="all">All Media Types</option>
            <option value="image">Images Only</option>
            <option value="video">Videos Only</option>
          </select>

          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </section>

      {/* Banners Grid */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "60px 0",
            justifyContent: "center",
          }}
        >
          <Loader2 className="animate-spin" size={28} color="#ff4657" />
          <span style={{ color: "#858b9b" }}>Loading hero banners...</span>
        </div>
      ) : banners.length === 0 ? (
        <div className="banners-empty-card">
          <div className="banners-empty-icon">
            <Layers size={28} />
          </div>
          <h3>No Banners Added</h3>
          <p>
            No banners match your active filter. Click below to upload your first image or video banner.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => openAddModal("image")}
            >
              <ImageIcon size={15} />
              <span>Add Image Banner</span>
            </button>
            <button
              type="button"
              className="btn-primary-action"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                boxShadow: "0 4px 18px rgba(139, 92, 246, 0.35)",
              }}
              onClick={() => openAddModal("video")}
            >
              <Film size={15} />
              <span>Add Video Banner</span>
            </button>
          </div>
        </div>
      ) : (
        <section className="banners-grid">
          {banners.map((banner) => {
            const isVideo = banner.mediaType === "video";
            const mediaSource = banner.mediaUrl || banner.desktopImageUrl;
            const posterSource = banner.posterUrl || "";

            return (
              <article
                key={banner._id}
                className={`banner-card ${!banner.isActive ? "is-inactive" : ""}`}
              >
                {/* Media Thumbnail / Preview */}
                <div className="banner-card-media">
                  {isVideo ? (
                    <div className="video-card-preview-wrap">
                      <img
                        src={
                          posterSource ||
                          "/assets/videos/hero-poster.jpg"
                        }
                        alt="Hero Video Banner"
                        loading="lazy"
                      />
                      <div className="video-play-indicator">
                        <Play size={20} fill="#ffffff" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={mediaSource}
                      alt="Hero Image Banner"
                      loading="lazy"
                    />
                  )}

                  <div className="banner-card-overlay-badge">
                    <span
                      className={`badge-pill ${
                        isVideo ? "badge-video" : "badge-image"
                      }`}
                    >
                      {isVideo ? <Film size={11} /> : <ImageIcon size={11} />}
                      <span>{isVideo ? "Video" : "Image"}</span>
                    </span>
                    <span className="badge-pill badge-order">
                      Order: {banner.order}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="banner-card-body">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#e2e4ea" }}>
                      {isVideo ? "Video Banner" : "Image Banner"}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: banner.isActive ? "#34d399" : "#f87171",
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      {banner.isActive ? "● Live on Site" : "○ Inactive"}
                    </span>
                  </div>

                  {/* Footer Actions */}
                  <div className="banner-card-footer">
                    <label
                      className="status-toggle-label"
                      title="Toggle visibility on website homepage"
                    >
                      <div
                        className={`status-toggle-switch ${
                          banner.isActive ? "is-active" : ""
                        }`}
                        onClick={() => handleToggleActive(banner)}
                      >
                        <div className="status-toggle-thumb" />
                      </div>
                      <span>{banner.isActive ? "Active" : "Inactive"}</span>
                    </label>

                    <div className="banner-card-btns">
                      <button
                        type="button"
                        className="btn-icon-action"
                        title="Preview banner in hero simulator"
                        onClick={() => setPreviewTarget(banner)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action btn-edit"
                        title="Edit banner media / order"
                        onClick={() => openEditModal(banner)}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action btn-delete"
                        title="Delete banner"
                        onClick={() => setDeleteTarget(banner)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* ==================================================================== */}
      {/* ADD / EDIT MODAL (CLEAN IMAGE & VIDEO UPLOADER)                      */}
      {/* ==================================================================== */}
      {isFormOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !isSubmitting && setIsFormOpen(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBanner ? "Edit Hero Banner" : "Add New Hero Banner"}</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="modal-body">
                {/* Media Type Toggle */}
                <div className="form-group">
                  <label>Banner Type</label>
                  <div className="media-type-selector">
                    <button
                      type="button"
                      className={`media-type-btn ${
                        formData.mediaType === "image" ? "is-selected" : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, mediaType: "image" }))
                      }
                    >
                      <ImageIcon size={16} />
                      <span>Image Banner</span>
                    </button>
                    <button
                      type="button"
                      className={`media-type-btn ${
                        formData.mediaType === "video" ? "is-selected" : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, mediaType: "video" }))
                      }
                    >
                      <Film size={16} />
                      <span>Video Banner</span>
                    </button>
                  </div>
                </div>

                {/* Primary Media Upload Area */}
                <div className="image-upload-card">
                  <div className="image-upload-card-header">
                    <h4>
                      {formData.mediaType === "video" ? (
                        <>
                          <Video size={16} color="#c084fc" />
                          <span>Select Video File (MP4, WEBM)</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={16} color="#60a5fa" />
                          <span>Select Image File (JPG, PNG, WEBP)</span>
                        </>
                      )}
                      <span className="required">*</span>
                    </h4>
                  </div>

                  {localMediaPreview || formData.mediaUrl ? (
                    <div className="media-live-preview-box">
                      {formData.mediaType === "video" ? (
                        <video
                          src={localMediaPreview || formData.mediaUrl}
                          poster={localPosterPreview || formData.posterUrl}
                          controls
                          className="uploaded-media-element"
                        />
                      ) : (
                        <img
                          src={localMediaPreview || formData.mediaUrl}
                          alt="Banner Preview"
                          className="uploaded-media-element"
                        />
                      )}
                      <div className="image-preview-actions">
                        <button
                          type="button"
                          className="btn-remove-preview"
                          onClick={() => {
                            setSelectedMediaFile(null);
                            setLocalMediaPreview("");
                            setFormData((prev) => ({
                              ...prev,
                              mediaUrl: "",
                              publicId: "",
                            }));
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Change File</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="dropzone-trigger"
                      onClick={() => mediaFileRef.current?.click()}
                    >
                      <UploadCloud size={32} />
                      <p className="dropzone-title">
                        Click to select{" "}
                        {formData.mediaType === "video" ? "video" : "image"}
                      </p>
                      <p className="dropzone-subtitle">
                        {formData.mediaType === "video"
                          ? "MP4 or WEBM up to 100MB (Uploads to Cloudinary on Save)"
                          : "JPG, JPEG, PNG, or WEBP up to 100MB (Uploads to Cloudinary on Save)"}
                      </p>
                    </div>
                  )}

                  <input
                    ref={mediaFileRef}
                    type="file"
                    accept={
                      formData.mediaType === "video"
                        ? "video/mp4,video/webm"
                        : "image/jpeg,image/png,image/webp,image/jpg"
                    }
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleMediaFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                {/* Optional Custom Poster for Video */}
                {formData.mediaType === "video" && (
                  <div className="image-upload-card">
                    <div className="image-upload-card-header">
                      <h4>
                        <ImageIcon size={15} color="#fbbf24" />
                        <span>Video Poster Image (Optional)</span>
                      </h4>
                      <span className="field-hint">
                        Displayed while the video buffers
                      </span>
                    </div>

                    {localPosterPreview || formData.posterUrl ? (
                      <div
                        className="media-live-preview-box"
                        style={{ maxHeight: "160px" }}
                      >
                        <img
                          src={localPosterPreview || formData.posterUrl}
                          alt="Video Poster"
                          className="uploaded-media-element"
                        />
                        <div className="image-preview-actions">
                          <button
                            type="button"
                            className="btn-remove-preview"
                            onClick={() => {
                              setSelectedPosterFile(null);
                              setLocalPosterPreview("");
                              setFormData((prev) => ({
                                ...prev,
                                posterUrl: "",
                                posterPublicId: "",
                              }));
                            }}
                          >
                            <Trash2 size={12} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="dropzone-trigger"
                        style={{ padding: "16px" }}
                        onClick={() => posterFileRef.current?.click()}
                      >
                        <ImageIcon size={22} color="#fbbf24" />
                        <p className="dropzone-title">
                          Upload custom poster image
                        </p>
                        <p className="dropzone-subtitle">
                          Optional. Cloudinary automatically extracts a poster
                          frame if omitted.
                        </p>
                      </div>
                    )}

                    <input
                      ref={posterFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handlePosterFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Display Order & Active Toggle */}
                <div className="form-row-2col">
                  <div className="form-group">
                    <label htmlFor="banner-order">
                      Display Order (Ascending)
                    </label>
                    <input
                      id="banner-order"
                      type="number"
                      className="form-input"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                    <span className="field-hint">
                      Lower order numbers appear first in the carousel.
                    </span>
                  </div>

                  <div
                    className="form-group"
                    style={{ justifyContent: "center" }}
                  >
                    <label style={{ display: "block", marginBottom: "8px" }}>
                      Visibility Status
                    </label>
                    <label
                      className="status-toggle-label"
                      style={{
                        padding: "10px 14px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className={`status-toggle-switch ${
                          formData.isActive ? "is-active" : ""
                        }`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            isActive: !formData.isActive,
                          })
                        }
                      >
                        <div className="status-toggle-thumb" />
                      </div>
                      <span>
                        {formData.isActive
                          ? "Active (Visible on Homepage)"
                          : "Inactive (Hidden)"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Saving to Homepage...</span>
                    </>
                  ) : (
                    <span>
                      {editingBanner ? "Update Banner" : "Publish to Homepage"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DELETE CONFIRMATION MODAL                                            */}
      {/* ==================================================================== */}
      {deleteTarget && (
        <div
          className="modal-backdrop"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-body">
              <div className="delete-confirm-box">
                <div className="delete-confirm-icon">
                  <Trash2 size={28} />
                </div>
                <h3>Delete Hero Banner?</h3>
                <p>
                  Are you sure you want to permanently delete this{" "}
                  <strong>{deleteTarget.mediaType === "video" ? "Video" : "Image"} Banner</strong>?
                </p>
                <span className="field-hint" style={{ color: "#ef4444" }}>
                  This will remove the banner from the hero slider immediately
                  and clean up associated Cloudinary assets.
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Loader2 className="animate-spin" size={16} />
                    <span>Deleting...</span>
                  </span>
                ) : (
                  <span>Yes, Delete Banner</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LIVE HERO SIMULATION MODAL                                           */}
      {/* ==================================================================== */}
      {previewTarget && (
        <div className="modal-backdrop" onClick={() => setPreviewTarget(null)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: "860px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Hero Banner Simulation</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPreviewTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="preview-modal-frame">
                {previewTarget.mediaType === "video" ? (
                  <video
                    src={previewTarget.mediaUrl || previewTarget.desktopImageUrl}
                    poster={previewTarget.posterUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="preview-modal-media"
                  />
                ) : (
                  <img
                    src={previewTarget.mediaUrl || previewTarget.desktopImageUrl}
                    alt="Hero Banner Preview"
                    className="preview-modal-media"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

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
  Volume2,
  VolumeX,
} from "lucide-react";

const initialForm = {
  order: 0,
  isActive: true,
  mediaType: "image", // "image" | "video"
  mediaUrl: "",
  publicId: "",
  posterUrl: "",
  posterPublicId: "",
  audioEnabled: true,
  enableAudio: true,
  defaultSound: "muted",
  autoplay: true,
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

  // Video preview audio state for Edit/Add modal
  const modalVideoTesterRef = useRef(null);
  const [modalVideoMuted, setModalVideoMuted] = useState(true);
  const primaryVideoRef = useRef(null);
  const [primaryVideoMuted, setPrimaryVideoMuted] = useState(true);

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
    setModalVideoMuted(true);
    setPrimaryVideoMuted(true);
    setFormData({
      ...initialForm,
      mediaType: presetType,
      audioEnabled: true,
      enableAudio: true,
      defaultSound: "muted",
      autoplay: true,
      order: banners.length > 0 ? banners.length + 1 : 1,
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
    setModalVideoMuted(true);
    setPrimaryVideoMuted(true);

    const isAudioOn =
      banner.audioEnabled !== undefined
        ? banner.audioEnabled !== false
        : banner.enableAudio !== false;

    setFormData({
      order: Number(banner.order) || 1,
      isActive: banner.isActive !== undefined ? banner.isActive : true,
      mediaType: banner.mediaType || "image",
      mediaUrl: banner.mediaUrl || banner.desktopImageUrl || "",
      publicId: banner.publicId || banner.desktopImagePublicId || "",
      posterUrl: banner.posterUrl || "",
      posterPublicId: banner.posterPublicId || "",
      audioEnabled: isAudioOn,
      enableAudio: isAudioOn,
      defaultSound: banner.defaultSound || "muted",
      autoplay: banner.autoplay !== undefined ? banner.autoplay : true,
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

  // Toggle video audio controls on public website directly from banner card
  const handleToggleAudio = async (banner) => {
    const currentAudio =
      banner.audioEnabled !== false && banner.enableAudio !== false;
    const newAudio = !currentAudio;
    const originalBanners = [...banners];

    // Optimistic UI update
    setBanners((prev) =>
      prev.map((b) =>
        b._id === banner._id
          ? { ...b, audioEnabled: newAudio, enableAudio: newAudio }
          : b
      )
    );

    try {
      const res = await fetch(`/api/admin/banners/${banner._id}/toggle-audio`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioEnabled: newAudio, enableAudio: newAudio }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to toggle audio controls.");
      }

      broadcastUpdate();
      showNotice(
        "success",
        `Website audio controls turned ${newAudio ? "ON (speaker icon visible on website)" : "OFF (forced muted on website)"}.`
      );
    } catch (err) {
      setBanners(originalBanners);
      showNotice("error", err.message || "Failed to toggle audio controls.");
    }
  };

  // Toggle audio directly inside the Edit/Add Hero Banner video preview without restarting
  const handleToggleModalVideoAudio = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!modalVideoTesterRef.current) return;
    const vid = modalVideoTesterRef.current;
    const nextMuted = !vid.muted;
    vid.muted = nextMuted;
    if (!nextMuted) {
      vid.volume = 1;
      if (vid.paused) {
        vid.play().catch(() => {});
      }
    }
    setModalVideoMuted(nextMuted);
  };

  const handleTogglePrimaryVideoAudio = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!primaryVideoRef.current) return;
    const vid = primaryVideoRef.current;
    const nextMuted = !vid.muted;
    vid.muted = nextMuted;
    if (!nextMuted) {
      vid.volume = 1;
      if (vid.paused) {
        vid.play().catch(() => {});
      }
    }
    setPrimaryVideoMuted(nextMuted);
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

      if (formData.mediaType === "video") {
        const audioState = formData.audioEnabled !== false && formData.enableAudio !== false;
        submitData.append("audioEnabled", audioState ? "true" : "false");
        submitData.append("enableAudio", audioState ? "true" : "false");
        submitData.append(
          "defaultSound",
          formData.defaultSound === "unmuted" ? "unmuted" : "muted"
        );
        submitData.append(
          "autoplay",
          formData.autoplay !== false ? "true" : "false"
        );
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

                  {isVideo && (
                    <div className="banner-audio-card-control">
                      <div className="audio-card-ctrl-header">
                        <span className="audio-card-ctrl-title">Website Audio Controls</span>
                        <span
                          className={`audio-status-pill ${
                            banner.audioEnabled !== false && banner.enableAudio !== false
                              ? "is-on"
                              : "is-off"
                          }`}
                        >
                          {banner.audioEnabled !== false && banner.enableAudio !== false
                            ? "ON (Speaker Visible)"
                            : "OFF (Forced Muted)"}
                        </span>
                      </div>
                      <div className="audio-card-toggle-row">
                        <label
                          className="audio-card-toggle-label"
                          title={
                            banner.audioEnabled !== false && banner.enableAudio !== false
                              ? "Audio controls enabled on website. Click to turn OFF (forces video muted and hides speaker icon)."
                              : "Audio controls disabled on website. Click to turn ON (shows speaker icon on website)."
                          }
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleAudio(banner);
                          }}
                        >
                          <div
                            className={`status-toggle-switch ${
                              banner.audioEnabled !== false && banner.enableAudio !== false
                                ? "is-active"
                                : ""
                            }`}
                          >
                            <div className="status-toggle-thumb" />
                          </div>
                          <span className="audio-card-toggle-action">
                            {banner.audioEnabled !== false && banner.enableAudio !== false ? (
                              <>
                                <Volume2 size={13} color="#10b981" />
                                <span>Audio Controls: ON</span>
                              </>
                            ) : (
                              <>
                                <VolumeX size={13} color="#94a3b8" />
                                <span>Audio Controls: OFF</span>
                              </>
                            )}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

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
                        <div className="video-player-frame-relative">
                          <video
                            ref={primaryVideoRef}
                            src={localMediaPreview || formData.mediaUrl}
                            poster={localPosterPreview || formData.posterUrl}
                            controls
                            playsInline
                            className="uploaded-media-element"
                            onVolumeChange={(e) => {
                              setPrimaryVideoMuted(e.target.muted || e.target.volume === 0);
                            }}
                          />
                          <button
                            type="button"
                            className={`modal-player-audio-toggle ${primaryVideoMuted ? "is-muted" : "is-unmuted"}`}
                            onClick={handleTogglePrimaryVideoAudio}
                            title={primaryVideoMuted ? "Click to hear original video sound" : "Click to mute sound"}
                            aria-label={primaryVideoMuted ? "Unmute video preview" : "Mute video preview"}
                          >
                            {primaryVideoMuted ? (
                              <>
                                <VolumeX size={15} />
                                <span>Muted – Click to Listen</span>
                              </>
                            ) : (
                              <>
                                <Volume2 size={15} />
                                <span>Unmuted – Playing Audio</span>
                              </>
                            )}
                          </button>
                        </div>
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

                {/* Video Audio & Playback Settings (Videos Only) */}
                {formData.mediaType === "video" && (
                  <div className="video-audio-settings-card">
                    <div className="video-audio-settings-header">
                      <div className="video-audio-badge-title">
                        <Volume2 size={17} className="audio-header-icon" />
                        <h4>VIDEO AUDIO &amp; PLAYBACK SETTINGS</h4>
                      </div>
                      <p className="video-audio-header-desc">
                        Manage original sound support, default playback volume, and autoplay behavior for the public hero banner.
                      </p>
                    </div>

                    {/* Dedicated Video Audio Tester with Playback Controls */}
                    <div className="video-audio-tester-container">
                      <div className="tester-header-row">
                        <span className="tester-header-label">Audio &amp; Video Live Tester</span>
                        <span className="tester-header-hint">
                          Preview audio track directly in admin before saving
                        </span>
                      </div>

                      {localMediaPreview || formData.mediaUrl ? (
                        <div className="tester-player-wrapper">
                          <div className="video-player-frame-relative">
                            <video
                              ref={modalVideoTesterRef}
                              src={localMediaPreview || formData.mediaUrl}
                              poster={localPosterPreview || formData.posterUrl}
                              controls
                              playsInline
                              className="tester-video-player"
                              onVolumeChange={(e) => {
                                setModalVideoMuted(e.target.muted || e.target.volume === 0);
                              }}
                            />
                            <button
                              type="button"
                              className={`modal-player-audio-toggle ${modalVideoMuted ? "is-muted" : "is-unmuted"}`}
                              onClick={handleToggleModalVideoAudio}
                              title={modalVideoMuted ? "Click to hear original video sound" : "Click to mute sound"}
                              aria-label={modalVideoMuted ? "Unmute video preview" : "Mute video preview"}
                            >
                              {modalVideoMuted ? (
                                <>
                                  <VolumeX size={15} />
                                  <span>Muted – Click to Listen</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 size={15} />
                                  <span>Unmuted – Playing Audio</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="tester-empty-box">
                          <Video size={24} color="#64748b" />
                          <span>Select or upload a video file above to preview audio playback controls</span>
                        </div>
                      )}
                    </div>

                    <div className="video-audio-settings-grid">
                      {/* 1. Enable Audio Controls on Website: ON / OFF */}
                      <div className="audio-setting-row">
                        <div className="audio-setting-info">
                          <div className="audio-setting-name">Enable Audio Controls on Website</div>
                          <div className="audio-setting-subtext">
                            {formData.audioEnabled !== false && formData.enableAudio !== false
                              ? "ON: Floating speaker icon appears on the website so visitors can unmute and hear original video audio."
                              : "OFF: Speaker icon is hidden completely on the website. Video is forced to remain muted."}
                          </div>
                        </div>
                        <div className="audio-setting-ctrl">
                          <label className="status-toggle-label" title="Toggle audio controls on website">
                            <div
                              className={`status-toggle-switch ${
                                formData.audioEnabled !== false && formData.enableAudio !== false
                                  ? "is-active"
                                  : ""
                              }`}
                              onClick={() => {
                                const nextState = !(
                                  formData.audioEnabled !== false && formData.enableAudio !== false
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  audioEnabled: nextState,
                                  enableAudio: nextState,
                                }));
                              }}
                            >
                              <div className="status-toggle-thumb" />
                            </div>
                            <span
                              className={`toggle-state-text ${
                                formData.audioEnabled !== false && formData.enableAudio !== false
                                  ? "is-on"
                                  : "is-off"
                              }`}
                            >
                              {formData.audioEnabled !== false && formData.enableAudio !== false
                                ? "ON"
                                : "OFF"}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* 2. Default Playback Sound: Muted/Unmuted */}
                      <div className="audio-setting-row">
                        <div className="audio-setting-info">
                          <div className="audio-setting-name">Default Playback Sound</div>
                          <div className="audio-setting-subtext">
                            Initial audio mode when visitor views this slide. Muted complies with browser autoplay restrictions. Unmuted attempts sound playback if permitted by browser policy.
                          </div>
                        </div>
                        <div className="audio-setting-ctrl">
                          <div className="segmented-sound-options">
                            <button
                              type="button"
                              className={`segmented-sound-btn ${
                                formData.defaultSound === "muted" || !formData.defaultSound
                                  ? "is-active"
                                  : ""
                              }`}
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, defaultSound: "muted" }))
                              }
                              disabled={formData.enableAudio === false}
                              title="Video starts silent (Instant autoplay across all browsers)"
                            >
                              <VolumeX size={14} />
                              <span>Muted (Recommended)</span>
                            </button>
                            <button
                              type="button"
                              className={`segmented-sound-btn ${
                                formData.defaultSound === "unmuted" ? "is-active" : ""
                              }`}
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, defaultSound: "unmuted" }))
                              }
                              disabled={formData.enableAudio === false}
                              title="Attempt to start with sound (Requires visitor interaction in some browsers)"
                            >
                              <Volume2 size={14} />
                              <span>Unmuted</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. Autoplay: ON/OFF */}
                      <div className="audio-setting-row">
                        <div className="audio-setting-info">
                          <div className="audio-setting-name">Autoplay Video</div>
                          <div className="audio-setting-subtext">
                            Automatically begin video playback when this banner slide transitions into view.
                          </div>
                        </div>
                        <div className="audio-setting-ctrl">
                          <label className="status-toggle-label" title="Toggle autoplay">
                            <div
                              className={`status-toggle-switch ${
                                formData.autoplay !== false ? "is-active" : ""
                              }`}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  autoplay: prev.autoplay === false ? true : false,
                                }))
                              }
                            >
                              <div className="status-toggle-thumb" />
                            </div>
                            <span className={`toggle-state-text ${formData.autoplay !== false ? "is-on" : "is-off"}`}>
                              {formData.autoplay !== false ? "ON" : "OFF"}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
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
                      min="1"
                      className="form-input banner-order-input"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      placeholder="1"
                    />
                    <span className="field-hint">
                      Sequential order (1, 2, 3...). Moving to an occupied position automatically shifts other banners.
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

"use client";

import React, { useState, useEffect, useRef } from "react";
import "./reviews.css";
import {
  ArrowLeft,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Plus,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Save,
  X,
  Sparkles,
  Home,
  Building2,
  Quote,
} from "lucide-react";

/**
 * Live Preview Component matching public website carousel card styling
 */
function ReviewCardPreview({ review, theme = "center", onToggleTheme }) {
  const isCenter = theme === "center";
  const initials = review?.name
    ? review.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "C";
  const ratingCount = Math.min(5, Math.max(1, review?.rating || 5));
  const isCommercial = review?.category?.toLowerCase() === "commercial";

  return (
    <div className="admin-live-preview-wrap">
      <div className="preview-top-bar">
        <span className="preview-badge-label">PUBLIC CAROUSEL PREVIEW</span>
        <div className="preview-theme-switch">
          <button
            type="button"
            className={`btn-preview-switch ${isCenter ? "active" : ""}`}
            onClick={() => onToggleTheme && onToggleTheme("center")}
          >
            Center Card (Dark Navy)
          </button>
          <button
            type="button"
            className={`btn-preview-switch ${!isCenter ? "active" : ""}`}
            onClick={() => onToggleTheme && onToggleTheme("neighbor")}
          >
            Neighbor Card (White)
          </button>
        </div>
      </div>

      <div className={`admin-preview-stage ${isCenter ? "theme-dark-bg" : "theme-light-bg"}`}>
        <article
          className={`review-carousel-card preview-card-item ${
            isCenter ? "card-center-active" : "card-neighbor-left"
          }`}
        >
          {/* 1. Card Top Header: Horizontally aligned in one row */}
          <div className="card-top-header">
            <div className="header-left-group">
              {/* Quote icon inside light-blue rounded square */}
              <div className="quote-square-box">
                <Quote size={20} className="quote-square-icon" />
              </div>

              {/* Customer profile image or circular initials avatar */}
              <div className="card-avatar-circle">
                {review?.photoUrl ? (
                  <img
                    src={review.photoUrl}
                    alt={review?.name || "Customer"}
                    className="card-avatar-img"
                  />
                ) : (
                  <span className="card-avatar-initials">{initials}</span>
                )}
              </div>

              {/* Customer Name & Customer Type */}
              <div className="customer-text-block">
                <h3 className="card-customer-name">
                  {review?.name || "Customer Name"}
                </h3>
                <p className="card-customer-type">
                  {review?.company || (isCommercial ? "Commercial Client" : "Residential Homeowner")}
                </p>
              </div>
            </div>

            {/* Header Right: Badges (Featured & Category) */}
            <div className="header-badges-group">
              {review?.isFeatured && (
                <span className="card-badge badge-featured">
                  <Sparkles size={11} className="badge-icon" />
                  <span>Featured</span>
                </span>
              )}

              <span className="card-badge badge-category">
                {isCommercial ? (
                  <>
                    <Building2 size={11} className="badge-icon" />
                    <span>Commercial</span>
                  </>
                ) : (
                  <>
                    <Home size={11} className="badge-icon" />
                    <span>Residential</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* 2. Card Middle: Feedback Message */}
          <div className="card-middle-body">
            <p className="card-review-text">
              “{review?.message || "Customer feedback text will appear here..."}”
            </p>
          </div>

          {/* 3. Card Bottom: Five Yellow Stars & Verified Badge */}
          <div className="card-bottom-footer">
            <div
              className="card-star-rating"
              aria-label={`${ratingCount} out of 5 stars`}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={
                    star <= ratingCount
                      ? "star-icon star-gold"
                      : "star-icon star-muted"
                  }
                />
              ))}
            </div>

            {review?.isVerified !== false && (
              <span className="card-badge badge-verified">
                <CheckCircle2 size={13} className="badge-icon" />
                <span>Verified</span>
              </span>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

export default function ReviewsClient({ admin }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });

  // Dedicated Preview Modal
  const [previewReview, setPreviewReview] = useState(null);
  const [previewTheme, setPreviewTheme] = useState("center");

  // Edit Review Modal
  const [editingReview, setEditingReview] = useState(null);
  const [editModalTab, setEditModalTab] = useState("form"); // 'form' | 'preview'
  const [savingEdit, setSavingEdit] = useState(false);
  const editPhotoInputRef = useRef(null);

  // Add Review Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalTab, setAddModalTab] = useState("form"); // 'form' | 'preview'
  const [newReview, setNewReview] = useState({
    name: "",
    email: "",
    company: "",
    category: "Residential",
    rating: 5,
    message: "",
    status: "approved",
    isActive: true,
    isFeatured: false,
    isVerified: true,
    order: 0,
  });
  const [addPhotoFile, setAddPhotoFile] = useState(null);
  const [addPhotoPreview, setAddPhotoPreview] = useState("");
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const addPhotoInputRef = useRef(null);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (showAddModal || editingReview || previewReview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddModal, editingReview, previewReview]);

  // Broadcast updates to open homepage tabs
  const broadcastReviewUpdate = () => {
    try {
      window.localStorage.setItem("avxbs_review_updated", Date.now().toString());
    } catch (e) {
      // ignore
    }
  };

  // Load reviews and settings from backend
  const loadReviewsData = async () => {
    try {
      setLoading(true);
      const url =
        activeTab === "all"
          ? "/api/admin/reviews"
          : `/api/admin/reviews?status=${activeTab}`;
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.reviews || []);
        if (data.stats) setStats(data.stats);
      } else {
        throw new Error(data.message || "Failed to load reviews data");
      }
    } catch (err) {
      showNotice("error", err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, [activeTab]);

  const showNotice = (type, message) => {
    setNotice({ type, message });
    setTimeout(() => {
      setNotice({ type: "", message: "" });
    }, 6000);
  };

  // Open Edit Modal
  const handleOpenEdit = (review) => {
    setEditingReview({
      ...review,
      category: review.category || "Residential",
      isVerified: review.isVerified !== false,
    });
    setEditModalTab("form");
  };

  // Status update (approved, pending, rejected)
  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      broadcastReviewUpdate();
      showNotice("success", `Review status changed to ${status}.`);
      loadReviewsData();
    } catch (err) {
      showNotice("error", err.message || "Failed to update review status.");
    }
  };

  // Toggle active / visible
  const handleToggleActive = async (id) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/toggle-active`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      broadcastReviewUpdate();
      showNotice("success", data.message);
      loadReviewsData();
    } catch (err) {
      showNotice("error", err.message || "Failed to toggle review visibility.");
    }
  };

  // Toggle featured
  const handleToggleFeatured = async (id) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/toggle-featured`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      broadcastReviewUpdate();
      showNotice("success", data.message);
      loadReviewsData();
    } catch (err) {
      showNotice("error", err.message || "Failed to toggle featured status.");
    }
  };

  // Delete review
  const handleDeleteReview = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the review from ${name}?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      broadcastReviewUpdate();
      showNotice("success", "Review deleted successfully.");
      loadReviewsData();
    } catch (err) {
      showNotice("error", err.message || "Failed to delete review.");
    }
  };

  // Save Edit Review Modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReview) return;

    try {
      setSavingEdit(true);
      const res = await fetch(`/api/admin/reviews/${editingReview._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...editingReview,
          category: editingReview.category || "Residential",
          isVerified: editingReview.isVerified !== false,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      broadcastReviewUpdate();
      showNotice("success", "Review updated successfully.");
      setEditingReview(null);
      loadReviewsData();
    } catch (err) {
      showNotice("error", err.message || "Failed to save review changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Upload/Replace Photo for existing review in Edit modal
  const handleUploadEditPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingReview) return;

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch(`/api/admin/reviews/${editingReview._id}/photo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setEditingReview((prev) => ({ ...prev, photoUrl: data.photoUrl }));
      broadcastReviewUpdate();
      showNotice("success", "Customer photo updated.");
      loadReviewsData();
    } catch (err) {
      showNotice("error", err.message || "Failed to upload photo.");
    } finally {
      if (editPhotoInputRef.current) editPhotoInputRef.current.value = "";
    }
  };

  // Submit Add Review Modal
  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.message.trim()) {
      showNotice("error", "Name and feedback message are required.");
      return;
    }

    try {
      setSubmittingAdd(true);
      const formData = new FormData();
      formData.append("name", newReview.name.trim());
      formData.append("email", newReview.email.trim());
      formData.append("company", newReview.company.trim());
      formData.append("category", newReview.category || "Residential");
      formData.append("rating", String(newReview.rating));
      formData.append("message", newReview.message.trim());
      formData.append("status", newReview.status);
      formData.append("isActive", String(newReview.isActive !== false));
      formData.append("isFeatured", String(newReview.isFeatured));
      formData.append("isVerified", String(newReview.isVerified !== false));
      formData.append("order", String(newReview.order));

      if (addPhotoFile) {
        formData.append("photo", addPhotoFile);
      }

      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      broadcastReviewUpdate();
      showNotice("success", "New review added successfully.");
      setShowAddModal(false);
      setNewReview({
        name: "",
        email: "",
        company: "",
        category: "Residential",
        rating: 5,
        message: "",
        status: "approved",
        isActive: true,
        isFeatured: false,
        isVerified: true,
        order: 0,
      });
      setAddPhotoFile(null);
      setAddPhotoPreview("");
      loadReviewsData();
    } catch (err) {
      showNotice("error", err.message || "Failed to create review.");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Filtered reviews by search term
  const filteredReviews = reviews.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.name?.toLowerCase().includes(term) ||
      r.company?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.message?.toLowerCase().includes(term) ||
      r.category?.toLowerCase().includes(term)
    );
  });

  return (
    <main className="admin-reviews-page">
      {/* Header */}
      <header className="admin-reviews-header">
        <div>
          <span className="reviews-header-badge">WEBSITE MANAGEMENT</span>
          <h1>Customer Reviews & Testimonials Carousel</h1>
          <p>
            Manage live client testimonials, ratings, categories, verified badges, and preview
            the public testimonial carousel.
          </p>
        </div>

        <div className="header-actions-group">
          <button
            type="button"
            className="btn-add-review-top"
            onClick={() => {
              setShowAddModal(true);
              setAddModalTab("form");
            }}
          >
            <Plus size={16} />
            <span>Add Review Manually</span>
          </button>

          <a href="/admin/dashboard" className="back-dash-btn">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </a>
        </div>
      </header>

      {/* Global Alerts */}
      {notice.message && (
        <div className={`admin-notice ${notice.type}`} role="alert">
          {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Section 1: Review Metrics Counters */}
      <section className="reviews-metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Submissions</span>
          <span className="metric-value">{stats.total}</span>
          <span className="metric-hint">All customer feedback</span>
        </div>

        <div className="metric-card warning-accent">
          <span className="metric-label">Pending Approval</span>
          <span className="metric-value pending-val">{stats.pending}</span>
          <span className="metric-hint">Awaiting admin review</span>
        </div>

        <div className="metric-card success-accent">
          <span className="metric-label">Approved & Active</span>
          <span className="metric-value approved-val">{stats.approved}</span>
          <span className="metric-hint">Visible on public carousel</span>
        </div>

        <div className="metric-card muted-accent">
          <span className="metric-label">Rejected</span>
          <span className="metric-value">{stats.rejected}</span>
          <span className="metric-hint">Hidden from website</span>
        </div>
      </section>

      {/* Section 2: Filters, Search & Tabs */}
      <section className="reviews-table-section">
        <div className="reviews-filter-bar table-controls-bar">
          <div className="filter-tabs-row status-tabs-row">
            <button
              type="button"
              className={`filter-tab-btn status-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Reviews ({stats.total})
            </button>
            <button
              type="button"
              className={`filter-tab-btn status-tab ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending ({stats.pending})
            </button>
            <button
              type="button"
              className={`filter-tab-btn status-tab ${activeTab === "approved" ? "active" : ""}`}
              onClick={() => setActiveTab("approved")}
            >
              Approved ({stats.approved})
            </button>
            <button
              type="button"
              className={`filter-tab-btn status-tab ${activeTab === "rejected" ? "active" : ""}`}
              onClick={() => setActiveTab("rejected")}
            >
              Rejected ({stats.rejected})
            </button>
          </div>

          <div className="search-box-wrapper search-filter-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer name, company, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="admin-loading-row">
            <Loader2 size={24} className="animate-spin" />
            <span>Loading reviews database...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="admin-empty-row">
            <p>No customer reviews found matching the current criteria.</p>
          </div>
        ) : (
          <div className="reviews-items-container">
            {filteredReviews.map((review) => {
              const isApproved = review.status === "approved";
              const isPending = review.status === "pending";
              const isRejected = review.status === "rejected";
              const isCommercial =
                review.category?.toLowerCase() === "commercial";

              return (
                <div key={review._id} className={`review-admin-item status-${review.status}`}>
                  <div className="item-header-row">
                    <div className="customer-info-box">
                      {/* Avatar */}
                      <div className="item-avatar-circle">
                        {review.photoUrl ? (
                          <img src={review.photoUrl} alt={review.name} />
                        ) : (
                          <span>{review.name?.charAt(0)?.toUpperCase() || "C"}</span>
                        )}
                      </div>

                      <div className="customer-details">
                        <div className="name-and-featured">
                          <h4>{review.name}</h4>

                          {/* Category Badge */}
                          <span className="scope-badge">
                            {isCommercial ? (
                              <>
                                <Building2 size={11} /> Commercial
                              </>
                            ) : (
                              <>
                                <Home size={11} /> Residential
                              </>
                            )}
                          </span>

                          {/* Verified Badge */}
                          {review.isVerified !== false && (
                            <span className="verified-indicator-tag">
                              <CheckCircle2 size={11} /> Verified
                            </span>
                          )}

                          {/* Featured Badge */}
                          {review.isFeatured && (
                            <span className="featured-pill">
                              <Sparkles size={11} /> Featured
                            </span>
                          )}
                        </div>

                        <p className="customer-sub-text">
                          {review.company && <span>{review.company} • </span>}
                          <span>{review.email || "No email"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status & Rating */}
                    <div className="item-status-rating">
                      <div className="star-display">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= review.rating ? "star-gold" : "star-dim"}
                          />
                        ))}
                      </div>

                      <span className={`status-badge badge-${review.status}`}>
                        {review.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  <div className="item-message-content">
                    <p>“{review.message}”</p>
                  </div>

                  {/* Footer & Action Controls */}
                  <div className="item-footer-actions">
                    <div className="item-meta-tags">
                      <span className="date-tag">
                        Submitted: {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      {isApproved && (
                        <span className={`active-status-tag ${review.isActive ? "on" : "off"}`}>
                          {review.isActive ? "● Publicly Visible" : "○ Paused / Hidden"}
                        </span>
                      )}
                      {review.order !== 0 && (
                        <span className="order-tag">Order: #{review.order}</span>
                      )}
                    </div>

                    <div className="actions-buttons-cluster">
                      {/* Preview Button */}
                      <button
                        type="button"
                        className="btn-ctrl-action preview-btn"
                        onClick={() => {
                          setPreviewReview(review);
                          setPreviewTheme("center");
                        }}
                        title="Preview in Website Carousel Style"
                      >
                        <Eye size={14} />
                        <span>Preview</span>
                      </button>

                      {/* Quick Approval / Rejection */}
                      {isPending && (
                        <>
                          <button
                            type="button"
                            className="btn-ctrl-action success"
                            onClick={() => handleUpdateStatus(review._id, "approved")}
                            title="Approve Review"
                          >
                            <CheckCircle size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            className="btn-ctrl-action danger"
                            onClick={() => handleUpdateStatus(review._id, "rejected")}
                            title="Reject Review"
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {/* Re-approve rejected */}
                      {isRejected && (
                        <button
                          type="button"
                          className="btn-ctrl-action success"
                          onClick={() => handleUpdateStatus(review._id, "approved")}
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                      )}

                      {/* Toggles for approved reviews */}
                      {isApproved && (
                        <>
                          <button
                            type="button"
                            className={`btn-ctrl-action ${review.isActive ? "" : "warning"}`}
                            onClick={() => handleToggleActive(review._id)}
                            title={review.isActive ? "Hide from website" : "Show on website"}
                          >
                            {review.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                            <span>{review.isActive ? "Pause" : "Activate"}</span>
                          </button>

                          <button
                            type="button"
                            className={`btn-ctrl-action ${
                              review.isFeatured ? "featured-active" : ""
                            }`}
                            onClick={() => handleToggleFeatured(review._id)}
                            title="Pin as featured review"
                          >
                            <Sparkles size={14} />
                            <span>{review.isFeatured ? "Unfeature" : "Feature"}</span>
                          </button>
                        </>
                      )}

                      {/* Edit review details */}
                      <button
                        type="button"
                        className="btn-ctrl-action"
                        onClick={() => handleOpenEdit(review)}
                        title="Edit Review Details"
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        className="btn-ctrl-action danger-icon"
                        onClick={() => handleDeleteReview(review._id, review.name)}
                        title="Delete Review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ======================================================================
          STANDALONE PUBLIC CAROUSEL PREVIEW MODAL
          ====================================================================== */}
      {previewReview && (
        <div className="admin-modal-backdrop" onClick={() => setPreviewReview(null)}>
          <div
            className="admin-modal-box admin-preview-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Client Reviews Carousel Preview</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPreviewReview(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-preview-content">
              <ReviewCardPreview
                review={previewReview}
                theme={previewTheme}
                onToggleTheme={(t) => setPreviewTheme(t)}
              />
            </div>

            <div className="modal-actions-row" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setPreviewReview(null)}
              >
                Close Preview
              </button>
              <button
                type="button"
                className="btn-save-modal"
                onClick={() => {
                  const r = previewReview;
                  setPreviewReview(null);
                  handleOpenEdit(r);
                }}
              >
                <Edit3 size={15} />
                <span>Edit This Review</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          EDIT REVIEW MODAL
          ====================================================================== */}
      {editingReview && (
        <div className="admin-modal-backdrop" onClick={() => setEditingReview(null)}>
          <div
            className="admin-modal-box admin-preview-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Edit Customer Review</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingReview(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs: Form vs Live Preview */}
            <div className="modal-tab-switch">
              <button
                type="button"
                className={`btn-modal-tab ${editModalTab === "form" ? "active" : ""}`}
                onClick={() => setEditModalTab("form")}
              >
                Review Form
              </button>
              <button
                type="button"
                className={`btn-modal-tab ${editModalTab === "preview" ? "active" : ""}`}
                onClick={() => setEditModalTab("preview")}
              >
                Live Preview
              </button>
            </div>

            {editModalTab === "preview" ? (
              <div className="modal-preview-content">
                <ReviewCardPreview
                  review={editingReview}
                  theme={previewTheme}
                  onToggleTheme={(t) => setPreviewTheme(t)}
                />
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className="modal-form">
                <div className="modal-two-col">
                  <div className="admin-field-group">
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={editingReview.name || ""}
                      onChange={(e) =>
                        setEditingReview({ ...editingReview, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="admin-field-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="admin-input"
                      value={editingReview.email || ""}
                      onChange={(e) =>
                        setEditingReview({ ...editingReview, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="modal-two-col">
                  <div className="admin-field-group">
                    <label>Company / Location</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={editingReview.company || ""}
                      onChange={(e) =>
                        setEditingReview({ ...editingReview, company: e.target.value })
                      }
                      placeholder="e.g. Bangalore, Villa 42"
                    />
                  </div>

                  <div className="admin-field-group">
                    <label>Category (Property Scope)</label>
                    <select
                      className="admin-input"
                      value={editingReview.category || "Residential"}
                      onChange={(e) =>
                        setEditingReview({
                          ...editingReview,
                          category: e.target.value,
                        })
                      }
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="modal-two-col">
                  <div className="admin-field-group">
                    <label>Rating (1–5 Stars)</label>
                    <select
                      className="admin-input"
                      value={editingReview.rating}
                      onChange={(e) =>
                        setEditingReview({
                          ...editingReview,
                          rating: Number(e.target.value),
                        })
                      }
                    >
                      <option value={5}>5 Stars ★★★★★</option>
                      <option value={4}>4 Stars ★★★★☆</option>
                      <option value={3}>3 Stars ★★★☆☆</option>
                      <option value={2}>2 Stars ★★☆☆☆</option>
                      <option value={1}>1 Star ★☆☆☆☆</option>
                    </select>
                  </div>

                  <div className="admin-field-group">
                    <label>Approval Status</label>
                    <select
                      className="admin-input"
                      value={editingReview.status}
                      onChange={(e) =>
                        setEditingReview({ ...editingReview, status: e.target.value })
                      }
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="admin-field-group">
                  <label>Feedback Message *</label>
                  <textarea
                    rows={4}
                    className="admin-input"
                    value={editingReview.message || ""}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, message: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Checkboxes Row: Active, Featured, Verified */}
                <div className="modal-three-col">
                  <div
                    className="admin-field-group"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editingReview.isActive !== false}
                        onChange={(e) =>
                          setEditingReview({
                            ...editingReview,
                            isActive: e.target.checked,
                          })
                        }
                      />
                      <span>Active / Visible</span>
                    </label>
                  </div>

                  <div
                    className="admin-field-group"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(editingReview.isFeatured)}
                        onChange={(e) =>
                          setEditingReview({
                            ...editingReview,
                            isFeatured: e.target.checked,
                          })
                        }
                      />
                      <span>Featured Review</span>
                    </label>
                  </div>

                  <div
                    className="admin-field-group"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editingReview.isVerified !== false}
                        onChange={(e) =>
                          setEditingReview({
                            ...editingReview,
                            isVerified: e.target.checked,
                          })
                        }
                      />
                      <span>Verified Customer</span>
                    </label>
                  </div>
                </div>

                {/* Customer Photo Upload in Modal */}
                <div className="admin-field-group">
                  <label>Customer Photo</label>
                  <div className="modal-photo-row">
                    {editingReview.photoUrl ? (
                      <img
                        src={editingReview.photoUrl}
                        alt="Customer"
                        className="modal-photo-preview"
                      />
                    ) : (
                      <div className="modal-photo-placeholder">No Photo</div>
                    )}

                    <input
                      ref={editPhotoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleUploadEditPhoto}
                    />

                    <button
                      type="button"
                      className="btn-ctrl-action"
                      onClick={() => editPhotoInputRef.current?.click()}
                    >
                      <UploadCloud size={14} />
                      <span>
                        {editingReview.photoUrl ? "Replace Photo" : "Upload Photo"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setEditingReview(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-save-modal"
                    disabled={savingEdit}
                  >
                    {savingEdit ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>Save Review</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          ADD REVIEW MODAL
          ====================================================================== */}
      {showAddModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="admin-modal-box admin-preview-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Add New Customer Review</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs: Form vs Live Preview */}
            <div className="modal-tab-switch">
              <button
                type="button"
                className={`btn-modal-tab ${addModalTab === "form" ? "active" : ""}`}
                onClick={() => setAddModalTab("form")}
              >
                Review Form
              </button>
              <button
                type="button"
                className={`btn-modal-tab ${addModalTab === "preview" ? "active" : ""}`}
                onClick={() => setAddModalTab("preview")}
              >
                Live Preview
              </button>
            </div>

            {addModalTab === "preview" ? (
              <div className="modal-preview-content">
                <ReviewCardPreview
                  review={{
                    ...newReview,
                    photoUrl: addPhotoPreview || "",
                  }}
                  theme={previewTheme}
                  onToggleTheme={(t) => setPreviewTheme(t)}
                />
              </div>
            ) : (
              <form onSubmit={handleCreateReview} className="modal-form">
                <div className="modal-two-col">
                  <div className="admin-field-group">
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={newReview.name}
                      onChange={(e) =>
                        setNewReview({ ...newReview, name: e.target.value })
                      }
                      placeholder="e.g. Robert Vance"
                      required
                    />
                  </div>

                  <div className="admin-field-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="admin-input"
                      value={newReview.email}
                      onChange={(e) =>
                        setNewReview({ ...newReview, email: e.target.value })
                      }
                      placeholder="e.g. robert@vance.com"
                    />
                  </div>
                </div>

                <div className="modal-two-col">
                  <div className="admin-field-group">
                    <label>Company / Location</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={newReview.company}
                      onChange={(e) =>
                        setNewReview({ ...newReview, company: e.target.value })
                      }
                      placeholder="e.g. Vance Refrigeration"
                    />
                  </div>

                  <div className="admin-field-group">
                    <label>Category (Property Scope)</label>
                    <select
                      className="admin-input"
                      value={newReview.category}
                      onChange={(e) =>
                        setNewReview({ ...newReview, category: e.target.value })
                      }
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="modal-two-col">
                  <div className="admin-field-group">
                    <label>Rating</label>
                    <select
                      className="admin-input"
                      value={newReview.rating}
                      onChange={(e) =>
                        setNewReview({
                          ...newReview,
                          rating: Number(e.target.value),
                        })
                      }
                    >
                      <option value={5}>5 Stars ★★★★★</option>
                      <option value={4}>4 Stars ★★★★☆</option>
                      <option value={3}>3 Stars ★★★☆☆</option>
                      <option value={2}>2 Stars ★★☆☆☆</option>
                      <option value={1}>1 Star ★☆☆☆☆</option>
                    </select>
                  </div>

                  <div className="admin-field-group">
                    <label>Approval Status</label>
                    <select
                      className="admin-input"
                      value={newReview.status}
                      onChange={(e) =>
                        setNewReview({ ...newReview, status: e.target.value })
                      }
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="admin-field-group">
                  <label>Feedback Message *</label>
                  <textarea
                    rows={4}
                    className="admin-input"
                    value={newReview.message}
                    onChange={(e) =>
                      setNewReview({ ...newReview, message: e.target.value })
                    }
                    placeholder="Enter the customer testimonial..."
                    required
                  />
                </div>

                {/* Photo Upload in Add Modal */}
                <div className="admin-field-group">
                  <label>Customer Profile Photo (optional)</label>
                  <div className="modal-photo-row">
                    {addPhotoPreview ? (
                      <img
                        src={addPhotoPreview}
                        alt="Preview"
                        className="modal-photo-preview"
                      />
                    ) : (
                      <div className="modal-photo-placeholder">No Photo</div>
                    )}

                    <input
                      ref={addPhotoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setAddPhotoFile(f);
                          setAddPhotoPreview(URL.createObjectURL(f));
                        }
                      }}
                    />

                    <button
                      type="button"
                      className="btn-ctrl-action"
                      onClick={() => addPhotoInputRef.current?.click()}
                    >
                      <UploadCloud size={14} />
                      <span>{addPhotoPreview ? "Change Photo" : "Upload Photo"}</span>
                    </button>
                  </div>
                </div>

                {/* Checkboxes: Active, Featured, Verified */}
                <div className="modal-three-col">
                  <div
                    className="admin-field-group"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newReview.isActive !== false}
                        onChange={(e) =>
                          setNewReview({
                            ...newReview,
                            isActive: e.target.checked,
                          })
                        }
                      />
                      <span>Active / Visible</span>
                    </label>
                  </div>

                  <div
                    className="admin-field-group"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newReview.isFeatured}
                        onChange={(e) =>
                          setNewReview({
                            ...newReview,
                            isFeatured: e.target.checked,
                          })
                        }
                      />
                      <span>Featured Review</span>
                    </label>
                  </div>

                  <div
                    className="admin-field-group"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newReview.isVerified !== false}
                        onChange={(e) =>
                          setNewReview({
                            ...newReview,
                            isVerified: e.target.checked,
                          })
                        }
                      />
                      <span>Verified Customer</span>
                    </label>
                  </div>
                </div>

                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-save-modal"
                    disabled={submittingAdd}
                  >
                    {submittingAdd ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>Create Review</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

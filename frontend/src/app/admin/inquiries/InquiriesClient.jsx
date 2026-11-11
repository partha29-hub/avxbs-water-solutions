"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "./inquiries.css";
import {
  Search,
  Download,
  RefreshCw,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  User,
  Layers,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";

const SECTIONS = [
  { key: "All", label: "All Inquiries", countKey: "total" },
  { key: "Residential", label: "Residential", countKey: "residential" },
  { key: "Commercial", label: "Commercial", countKey: "commercial" },
];

const STATUSES = ["All", "New", "Contacted", "Completed"];

function humanizeKey(str) {
  if (!str) return "";
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export default function InquiriesClient({ admin }) {
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // State
  const [inquiries, setInquiries] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    residential: 0,
    commercial: 0,
    new: 0,
    contacted: 0,
    completed: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  });

  const [activeSection, setActiveSection] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals state
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [deletingInquiry, setDeletingInquiry] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Inquiries
  const fetchInquiries = useCallback(
    async (pageToLoad = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (activeSection !== "All") params.set("section", activeSection);
        if (selectedStatus !== "All") params.set("status", selectedStatus);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        params.set("page", pageToLoad);
        params.set("limit", pagination.limit);

        const response = await fetch(`/api/admin/inquiries?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load inquiries");
        }

        setInquiries(data.inquiries || []);
        if (data.counts) setCounts(data.counts);
        if (data.pagination) setPagination(data.pagination);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [activeSection, selectedStatus, searchQuery, pagination.limit]
  );

  useEffect(() => {
    fetchInquiries(1);
  }, [fetchInquiries]);

  // Handle Export to Excel
  const handleExport = async (sectionToExport = activeSection) => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (sectionToExport && sectionToExport !== "All") {
        params.set("section", sectionToExport);
      }

      const response = await fetch(`/api/admin/inquiries/export?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Export failed.");
      }

      const blob = await response.blob();
      const filename = `AVXBS_Inquiries_${(sectionToExport || "All").replace(
        /\s+/g,
        "_"
      )}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showToast("Inquiries exported successfully to Excel!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setExporting(false);
    }
  };

  // Auto trigger export if opened with ?action=export
  useEffect(() => {
    if (searchParams.get("action") === "export") {
      handleExport("All");
    }
  }, [searchParams]);

  // Status Change Handler
  const handleStatusChange = async (inquiryId, newStatus) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      // Update in table
      setInquiries((prev) =>
        prev.map((item) =>
          item._id === inquiryId ? { ...item, status: newStatus } : item
        )
      );

      // Update in active modal if open
      if (selectedInquiry && selectedInquiry._id === inquiryId) {
        setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
      }

      // Update live status counts
      setCounts((prev) => {
        const next = { ...prev };
        if (next.new > 0) next.new = Math.max(0, next.new - 1);
        if (newStatus === "Contacted") next.contacted += 1;
        if (newStatus === "Completed") next.completed += 1;
        return next;
      });

      showToast(`Status updated to "${newStatus}"`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Inquiry Handler
  const handleDeleteConfirm = async () => {
    if (!deletingInquiry) return;
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/inquiries/${deletingInquiry._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete inquiry");
      }

      showToast("Inquiry deleted successfully");
      setDeletingInquiry(null);
      if (selectedInquiry && selectedInquiry._id === deletingInquiry._id) {
        setSelectedInquiry(null);
      }
      fetchInquiries(pagination.page);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const getSectionBadgeClass = (sec) => {
    const s = String(sec || "").toLowerCase();
    if (s.includes("commercial")) return "inq-sec-comm";
    return "inq-sec-res";
  };

  const formatCategory = (sec) => {
    const s = String(sec || "").toLowerCase();
    if (s.includes("commercial")) return "Commercial";
    return "Residential";
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "New":
        return "status-new";
      case "Contacted":
        return "status-contacted";
      case "Completed":
        return "status-completed";
      default:
        return "status-new";
    }
  };

  const adminName = admin?.name || "Administrator";
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <main className="inq-page">
      {/* Top Bar Navigation */}
      <div className="inq-topbar">
        <Link href="/admin/dashboard" className="inq-back-btn">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="inq-user-info">
          <div className="inq-user-avatar">{adminInitial}</div>
          <div className="inq-user-meta">
            <strong>{adminName}</strong>
            <small>{admin?.email || "Super Administrator"}</small>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <header className="inq-header">
        <div className="inq-title-wrap">
          <span className="inq-eyebrow">CUSTOMER RELATIONSHIP MANAGEMENT</span>
          <h1>Customer Inquiries</h1>
          <p>
            Review, categorize, and manage residential & commercial customer submissions.
          </p>
        </div>

        <div className="inq-header-actions">
          <button
            type="button"
            className="inq-btn inq-btn-secondary"
            onClick={() => fetchInquiries(pagination.page)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "inq-spinner" : ""} />
            Refresh
          </button>

          <button
            type="button"
            className="inq-btn inq-btn-success"
            onClick={() => handleExport(activeSection)}
            disabled={exporting}
          >
            <FileSpreadsheet size={16} />
            {exporting ? "Exporting..." : "Export to Excel (.xlsx)"}
          </button>
        </div>
      </header>

      {/* Metric Cards */}
      <section className="inq-metric-grid">
        <div className="inq-metric-card card-all">
          <div className="inq-metric-label">Total Inquiries</div>
          <div className="inq-metric-value">{counts.total}</div>
          <div className="inq-metric-sub">
            {counts.new} New · {counts.contacted} Contacted · {counts.completed} Completed
          </div>
        </div>

        <div className="inq-metric-card card-res">
          <div className="inq-metric-label">Residential</div>
          <div className="inq-metric-value">{counts.residential}</div>
          <div className="inq-metric-sub">All residential website submissions & forms</div>
        </div>

        <div className="inq-metric-card card-comm">
          <div className="inq-metric-label">Commercial</div>
          <div className="inq-metric-value">{counts.commercial}</div>
          <div className="inq-metric-sub">Enterprise, industrial & commercial inquiries</div>
        </div>

        <div className="inq-metric-card card-pending">
          <div className="inq-metric-label">New / Pending</div>
          <div className="inq-metric-value">{counts.new}</div>
          <div className="inq-metric-sub">Inquiries awaiting initial contact</div>
        </div>
      </section>

      {/* Section Filter Tabs */}
      <nav className="inq-section-tabs" aria-label="Inquiry Sections">
        {SECTIONS.map((sec) => {
          const count = counts[sec.countKey] || 0;
          const isActive = activeSection === sec.key;
          return (
            <button
              key={sec.key}
              type="button"
              className={`inq-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => {
                setActiveSection(sec.key);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <span>{sec.label}</span>
              <span className="inq-tab-count">{count}</span>
            </button>
          );
        })}
      </nav>

      {/* Toolbar: Search & Status Filter */}
      <div className="inq-toolbar">
        <div className="inq-toolbar-left">
          <div className="inq-search-box">
            <Search size={16} className="inq-search-icon" />
            <input
              type="text"
              className="inq-search-input"
              placeholder="Search customer name, phone, email, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchInquiries(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="inq-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="inq-filter-group">
            <select
              className="inq-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Statuses" : status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="inq-toolbar-right">
          <select
            className="inq-select"
            value={pagination.limit}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              setPagination((p) => ({ ...p, limit: newLimit, page: 1 }));
            }}
            aria-label="Items per page"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table Card */}
      <section className="inq-table-card">
        {loading ? (
          <div className="inq-loading-state">
            <div className="inq-spinner" />
            <p>Loading inquiries from database...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="inq-empty-state">
            <span className="inq-empty-icon">✉</span>
            <h3>No Inquiries Found</h3>
            <p>
              {searchQuery || selectedStatus !== "All" || activeSection !== "All"
                ? "No customer inquiries matched your current filter criteria. Try resetting your search or filters."
                : "No customer inquiries have been submitted yet. Inquiries received through the public website will appear here automatically."}
            </p>
            {(searchQuery || selectedStatus !== "All" || activeSection !== "All") && (
              <button
                type="button"
                className="inq-btn inq-btn-secondary"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("All");
                  setActiveSection("All");
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="inq-table-wrap">
            <table className="inq-table">
              <thead>
                <tr>
                  <th className="inq-sno">#</th>
                  <th>Customer</th>
                  <th>Contact Info</th>
                  <th>Category</th>
                  <th>Product / Subject</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq, idx) => {
                  const sno = (pagination.page - 1) * pagination.limit + idx + 1;
                  return (
                    <tr key={inq._id}>
                      <td className="inq-sno">{sno}</td>
                      <td>
                        <div className="inq-customer-cell">
                          <span className="inq-customer-name">{inq.name}</span>
                          <span className="inq-customer-sub">
                            {inq.audience || inq.category || "Residential"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="inq-contact-cell">
                          <a href={`tel:${inq.phone}`}>☎ {inq.phone}</a>
                          {inq.email && (
                            <span className="inq-contact-email">✉ {inq.email}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`inq-section-badge ${getSectionBadgeClass(
                            inq.section
                          )}`}
                        >
                          {formatCategory(inq.section)}
                        </span>
                      </td>
                      <td>
                        <div style={{ maxWidth: 220 }}>
                          <strong style={{ color: "#f3f4f6", display: "block" }}>
                            {inq.product || inq.subject || inq.tabName || "General Inquiry"}
                          </strong>
                          {inq.tabName && inq.tabName !== inq.product && (
                            <small style={{ color: "#9ca3af" }}>Tab: {inq.tabName}</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                          {formatDate(inq.createdAt)}
                        </span>
                      </td>
                      <td>
                        <select
                          className={`inq-status-select ${getStatusClass(inq.status)}`}
                          value={inq.status || "New"}
                          onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                          disabled={actionLoading}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td>
                        <div
                          className="inq-row-actions"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            type="button"
                            className="inq-action-btn btn-view"
                            title="View Full Details"
                            onClick={() => setSelectedInquiry(inq)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="inq-action-btn btn-delete"
                            title="Delete Inquiry"
                            onClick={() => setDeletingInquiry(inq)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="inq-pagination">
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} inquiries
            </span>

            <div className="inq-page-nav">
              <button
                type="button"
                className="inq-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchInquiries(pagination.page - 1)}
              >
                Previous
              </button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => {
                // Show condensed page numbers if many
                if (
                  p === 1 ||
                  p === pagination.pages ||
                  Math.abs(p - pagination.page) <= 1
                ) {
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`inq-page-btn ${p === pagination.page ? "active" : ""}`}
                      onClick={() => fetchInquiries(p)}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === 2 && pagination.page > 3) return <span key={p}>...</span>;
                if (
                  p === pagination.pages - 1 &&
                  pagination.page < pagination.pages - 2
                )
                  return <span key={p}>...</span>;
                return null;
              })}

              <button
                type="button"
                className="inq-page-btn"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchInquiries(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          VIEW INQUIRY DETAILS MODAL
         ================================================================ */}
      {selectedInquiry && (
        <div
          className="inq-modal-overlay"
          onClick={() => setSelectedInquiry(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="inq-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="inq-modal-header">
              <h2>
                <User size={18} color="#ef4444" />
                Inquiry Details — {selectedInquiry.name}
              </h2>
              <button
                type="button"
                className="inq-modal-close"
                onClick={() => setSelectedInquiry(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="inq-modal-body">
              {/* Customer Information Section */}
              <div className="inq-modal-section">
                <h4>Customer Information</h4>
                <div className="inq-info-grid">
                  <div className="inq-info-item">
                    <label>Full Name</label>
                    <strong>{selectedInquiry.name}</strong>
                  </div>

                  <div className="inq-info-item">
                    <label>Phone Number</label>
                    <strong>
                      <a href={`tel:${selectedInquiry.phone}`}>
                        ☎ {selectedInquiry.phone}
                      </a>
                    </strong>
                  </div>

                  <div className="inq-info-item">
                    <label>Email Address</label>
                    <strong>
                      {selectedInquiry.email ? (
                        <a href={`mailto:${selectedInquiry.email}`}>
                          ✉ {selectedInquiry.email}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </strong>
                  </div>

                  <div className="inq-info-item">
                    <label>Audience / Category</label>
                    <strong>
                      {selectedInquiry.audience ||
                        selectedInquiry.category ||
                        "Residential"}
                    </strong>
                  </div>

                  <div className="inq-info-item">
                    <label>Category</label>
                    <span
                      className={`inq-section-badge ${getSectionBadgeClass(
                        selectedInquiry.section
                      )}`}
                    >
                      {formatCategory(selectedInquiry.section)}
                    </span>
                  </div>

                  <div className="inq-info-item">
                    <label>Submitted At</label>
                    <strong>{formatDate(selectedInquiry.createdAt)}</strong>
                  </div>
                </div>
              </div>

              {/* Solution / Product Details */}
              <div className="inq-modal-section">
                <h4>Product & Solution Context</h4>
                <div className="inq-info-grid">
                  <div className="inq-info-item">
                    <label>Product / Solution</label>
                    <strong>
                      {selectedInquiry.product ||
                        selectedInquiry.subject ||
                        "General Solution"}
                    </strong>
                  </div>

                  <div className="inq-info-item">
                    <label>Source Tab Name</label>
                    <strong>{selectedInquiry.tabName || "Primary Tab"}</strong>
                  </div>

                  {selectedInquiry.solutionId && (
                    <div className="inq-info-item">
                      <label>Solution ID</label>
                      <small style={{ color: "#9ca3af" }}>
                        {selectedInquiry.solutionId}
                      </small>
                    </div>
                  )}

                  {selectedInquiry.tabId && (
                    <div className="inq-info-item">
                      <label>Tab ID</label>
                      <small style={{ color: "#9ca3af" }}>
                        {selectedInquiry.tabId}
                      </small>
                    </div>
                  )}
                </div>

                {selectedInquiry.message && (
                  <div style={{ marginTop: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11.5px",
                        color: "#9ca3af",
                        marginBottom: 4,
                      }}
                    >
                      Customer Message / Note
                    </label>
                    <div
                      style={{
                        background: "#141520",
                        padding: "10px 14px",
                        borderRadius: 8,
                        fontSize: "13px",
                        lineHeight: 1.5,
                      }}
                    >
                      {selectedInquiry.message}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Form Responses */}
              <div className="inq-modal-section">
                <h4>Submitted Dynamic Form Answers</h4>
                {selectedInquiry.formData &&
                Object.keys(selectedInquiry.formData).length > 0 ? (
                  <div className="inq-form-responses">
                    {Object.entries(selectedInquiry.formData).map(([k, val]) => {
                      return (
                        <div key={k} className="inq-field-row">
                          <span className="inq-field-key">{humanizeKey(k)}</span>
                          <div className="inq-field-val">
                            {Array.isArray(val) ? (
                              <div className="inq-tags-wrap">
                                {val.map((item, i) => (
                                  <span key={i} className="inq-val-tag">
                                    {String(item)}
                                  </span>
                                ))}
                              </div>
                            ) : typeof val === "boolean" ? (
                              <span className="inq-val-tag">
                                {val ? "Yes" : "No"}
                              </span>
                            ) : typeof val === "object" && val !== null ? (
                              <pre
                                style={{
                                  margin: 0,
                                  fontSize: 12,
                                  textAlign: "left",
                                }}
                              >
                                {JSON.stringify(val, null, 2)}
                              </pre>
                            ) : (
                              <strong>{String(val || "—")}</strong>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
                    No extra dynamic form builder answers were included with this submission.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="inq-modal-footer">
              <div className="inq-modal-status-edit">
                <label>Update Status:</label>
                <select
                  className={`inq-status-select ${getStatusClass(
                    selectedInquiry.status
                  )}`}
                  value={selectedInquiry.status || "New"}
                  onChange={(e) =>
                    handleStatusChange(selectedInquiry._id, e.target.value)
                  }
                  disabled={actionLoading}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="inq-btn inq-btn-secondary"
                  onClick={() => setSelectedInquiry(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="inq-btn inq-btn-primary"
                  onClick={() => {
                    const toDelete = selectedInquiry;
                    setSelectedInquiry(null);
                    setDeletingInquiry(toDelete);
                  }}
                >
                  <Trash2 size={15} />
                  Delete Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          DELETE CONFIRMATION MODAL
         ================================================================ */}
      {deletingInquiry && (
        <div
          className="inq-modal-overlay"
          onClick={() => setDeletingInquiry(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="inq-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="inq-confirm-icon">
              <AlertTriangle size={28} />
            </div>

            <h3>Delete Inquiry?</h3>
            <p>
              Are you sure you want to permanently delete the inquiry from{" "}
              <strong style={{ color: "#ffffff" }}>
                {deletingInquiry.name}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="inq-confirm-actions">
              <button
                type="button"
                className="inq-btn inq-btn-secondary"
                onClick={() => setDeletingInquiry(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inq-btn inq-btn-primary"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Yes, Delete Inquiry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`inq-toast toast-${toast.type}`}>
          <CheckCircle size={16} />
          <span>{toast.message}</span>
        </div>
      )}
    </main>
  );
}


"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import "./dynamic-tabs.css";
import {
  Sparkles,
  Layers,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Edit2,
  Upload,
  Eye,
  CheckCircle,
  Home,
  ClipboardCheck,
  Building2,
  Gauge,
  Droplets,
  ShieldCheck,
  Award,
  ArrowRight,
  Plus,
  Image as ImageIcon,
} from "lucide-react";

const emptyTabForm = {
  title: "",
  category: "Residential",
  order: 1,
  isActive: true,
};

const emptyHighlightForm = {
  title: "",
  subtitle: "",
  description: "",
  icon: "Sparkles",
  image: "",
  buttonText: "Explore",
  buttonAction: "inquiry",
  buttonLink: "",
  audience: "Residential",
  order: 1,
  isActive: true,
};

const AVAILABLE_ICONS = [
  { name: "Sparkles", label: "Sparkles (Default)", icon: Sparkles },
  { name: "Home", label: "Home / Residential", icon: Home },
  { name: "Building2", label: "Building / Commercial", icon: Building2 },
  { name: "ClipboardCheck", label: "Clipboard / Audit", icon: ClipboardCheck },
  { name: "Gauge", label: "Gauge / Testing", icon: Gauge },
  { name: "Droplets", label: "Droplets / Water", icon: Droplets },
  { name: "ShieldCheck", label: "Shield / Protection", icon: ShieldCheck },
  { name: "Award", label: "Award / Certified", icon: Award },
];

export default function DynamicTabsClient({ admin }) {
  // Navigation sub-tab: "tabs" | "highlights"
  const [activeSubTab, setActiveSubTab] = useState("tabs");

  // Tab State
  const [tabs, setTabs] = useState([]);
  const [tabForm, setTabForm] = useState(emptyTabForm);
  const [editingTabId, setEditingTabId] = useState(null);

  // Highlight State
  const [highlights, setHighlights] = useState([]);
  const [highlightForm, setHighlightForm] = useState(emptyHighlightForm);
  const [editingHighlightId, setEditingHighlightId] = useState(null);
  const [highlightAudienceFilter, setHighlightAudienceFilter] = useState("All");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Common UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  // Load Tabs
  async function loadTabs() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dynamic-tabs", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load tabs");
      }
      setTabs(data.tabs || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Load Highlights
  async function loadHighlights() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/highlights", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load highlights");
      }
      setHighlights(data.highlights || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTabs();
    loadHighlights();
  }, []);

  /* ============================================================
     TAB OPERATIONS
     ============================================================ */

  function handleTabChange(e) {
    const { name, value, type, checked } = e.target;
    setTabForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetTabForm() {
    setTabForm({ ...emptyTabForm, order: tabs.length + 1 });
    setEditingTabId(null);
  }

  async function handleTabSubmit(e) {
    e.preventDefault();
    if (!tabForm.title.trim()) {
      setMessage("Please enter a tab name.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch("/api/admin/dynamic-tabs", {
        method: editingTabId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tabForm,
          order: Number(tabForm.order) || 0,
          ...(editingTabId ? { id: editingTabId } : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save tab");
      }

      setMessage(data.message);
      resetTabForm();
      await loadTabs();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleTabEdit(tab) {
    setEditingTabId(tab._id);
    setTabForm({
      title: tab.title || "",
      category: tab.category || "Residential",
      order: tab.order ?? 0,
      isActive: tab.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleTabDelete(id) {
    if (!window.confirm("Are you sure you want to delete this tab?")) return;
    try {
      const response = await fetch("/api/admin/dynamic-tabs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete tab");
      }
      setMessage(data.message);
      await loadTabs();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function toggleTabStatus(tab) {
    try {
      const response = await fetch("/api/admin/dynamic-tabs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tab._id,
          isActive: !tab.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update status");
      }
      await loadTabs();
    } catch (error) {
      setMessage(error.message);
    }
  }

  /* ============================================================
     HIGHLIGHT OPERATIONS
     ============================================================ */

  function handleHighlightChange(e) {
    const { name, value, type, checked } = e.target;
    setHighlightForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetHighlightForm() {
    setHighlightForm({ ...emptyHighlightForm, order: highlights.length + 1 });
    setEditingHighlightId(null);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setMessage("Uploading image to Cloudinary...");

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/admin/highlights/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Image upload failed");
      }

      setHighlightForm((prev) => ({
        ...prev,
        image: data.imageUrl,
      }));
      setMessage("Image uploaded successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleHighlightSubmit(e) {
    e.preventDefault();
    if (!highlightForm.title.trim()) {
      setMessage("Please enter a highlight title.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        ...highlightForm,
        label: highlightForm.subtitle,
        order: Number(highlightForm.order) || 0,
        ...(editingHighlightId ? { id: editingHighlightId } : {}),
      };

      const response = await fetch("/api/admin/highlights", {
        method: editingHighlightId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save highlight");
      }

      setMessage(data.message);
      resetHighlightForm();
      await loadHighlights();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleHighlightEdit(item) {
    setEditingHighlightId(item._id);
    setHighlightForm({
      title: item.title || "",
      subtitle: item.subtitle || item.label || "",
      description: item.description || "",
      icon: item.icon || "Sparkles",
      image: item.image || "",
      buttonText: item.buttonText || "Explore",
      buttonAction: item.buttonAction || "inquiry",
      buttonLink: item.buttonLink || "",
      audience: item.audience || "Residential",
      order: item.order ?? 0,
      isActive: item.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleHighlightDelete(id) {
    if (!window.confirm("Are you sure you want to delete this highlight?")) return;
    try {
      const response = await fetch("/api/admin/highlights", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete highlight");
      }
      setMessage(data.message);
      await loadHighlights();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function toggleHighlightStatus(item) {
    try {
      const response = await fetch("/api/admin/highlights", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item._id,
          isActive: !item.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update status");
      }
      await loadHighlights();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const filteredHighlights = highlights.filter((h) => {
    if (highlightAudienceFilter === "All") return true;
    return h.audience === highlightAudienceFilter || h.audience === "Both";
  });

  const SelectedIconComp =
    AVAILABLE_ICONS.find((i) => i.name === highlightForm.icon)?.icon || Sparkles;

  return (
    <main className="dt-page">
      {/* Top Header */}
      <header className="dt-header">
        <div>
          <Link href="/admin/dashboard" className="dt-back-link">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <span className="dt-eyebrow">WEBSITE MANAGEMENT</span>
          <h1>Dynamic Tabs & Highlights</h1>
          <p>
            Manage public website categories, solution tabs, and showcase highlights.
          </p>
        </div>

        <div className="dt-stats-group">
          <div className="dt-count">
            <strong>{tabs.length}</strong>
            <span>Active Tabs</span>
          </div>
          <div className="dt-count">
            <strong>{highlights.length}</strong>
            <span>Highlights</span>
          </div>
        </div>
      </header>

      {/* Sub-Navigation Tabs */}
      <nav className="dt-subtabs-nav" aria-label="Module Navigation">
        <button
          type="button"
          className={`dt-subtab-btn ${activeSubTab === "tabs" ? "active" : ""}`}
          onClick={() => {
            setActiveSubTab("tabs");
            setMessage("");
          }}
        >
          <Layers size={16} />
          <span>Tabs Management</span>
          <span className="dt-subtab-badge">{tabs.length}</span>
        </button>

        <button
          type="button"
          className={`dt-subtab-btn ${activeSubTab === "highlights" ? "active" : ""}`}
          onClick={() => {
            setActiveSubTab("highlights");
            setMessage("");
          }}
        >
          <Sparkles size={16} />
          <span>Highlights Management</span>
          <span className="dt-subtab-badge">{highlights.length}</span>
        </button>
      </nav>

      {message && <div className="dt-message">{message}</div>}

      {/* ============================================================
          SECTION 1: TABS MANAGEMENT
         ============================================================ */}
      {activeSubTab === "tabs" && (
        <>
          <section className="dt-card">
            <h2>{editingTabId ? "Edit Tab" : "Create New Tab"}</h2>
            <form onSubmit={handleTabSubmit}>
              <div className="dt-grid">
                <label>
                  Tab Name
                  <input
                    name="title"
                    value={tabForm.title}
                    onChange={handleTabChange}
                    placeholder="e.g. Water Softening"
                    required
                  />
                </label>

                <label>
                  Audience
                  <select
                    name="category"
                    value={tabForm.category}
                    onChange={handleTabChange}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Both">Both</option>
                  </select>
                </label>

                <label>
                  Display Order
                  <input
                    type="number"
                    min="0"
                    name="order"
                    value={tabForm.order}
                    onChange={handleTabChange}
                  />
                </label>

                <label className="dt-checkbox">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={tabForm.isActive}
                    onChange={handleTabChange}
                  />
                  Active / Visible on Website
                </label>
              </div>

              <div className="dt-actions">
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingTabId ? "Update Tab" : "Add Tab"}
                </button>
                {editingTabId && (
                  <button type="button" className="dt-cancel" onClick={resetTabForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="dt-card">
            <div className="dt-list-heading">
              <h2>All Dynamic Tabs ({tabs.length})</h2>
              <button type="button" className="dt-refresh" onClick={loadTabs}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {loading ? (
              <p>Loading tabs...</p>
            ) : tabs.length === 0 ? (
              <p>No tabs created yet. Add your first tab above.</p>
            ) : (
              <div className="dt-table-wrap">
                <table className="dt-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Tab Name</th>
                      <th>Audience</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabs.map((tab) => (
                      <tr key={tab._id}>
                        <td>{tab.order}</td>
                        <td>
                          <strong>{tab.title}</strong>
                        </td>
                        <td>
                          <span
                            className={`dt-badge ${
                              tab.category === "Residential"
                                ? "badge-res"
                                : tab.category === "Commercial"
                                ? "badge-comm"
                                : "badge-both"
                            }`}
                          >
                            {tab.category}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`dt-status ${
                              tab.isActive ? "active" : "inactive"
                            }`}
                            onClick={() => toggleTabStatus(tab)}
                          >
                            {tab.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <div className="dt-row-actions">
                            <button
                              type="button"
                              className="dt-edit-btn"
                              onClick={() => handleTabEdit(tab)}
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="dt-delete"
                              onClick={() => handleTabDelete(tab._id)}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* ============================================================
          SECTION 2: HIGHLIGHTS MANAGEMENT
         ============================================================ */}
      {activeSubTab === "highlights" && (
        <>
          <section className="dt-card">
            <h2>{editingHighlightId ? "Edit Highlight" : "Create New Highlight"}</h2>
            <form onSubmit={handleHighlightSubmit}>
              <div className="dt-grid">
                <label>
                  Highlight Title *
                  <input
                    name="title"
                    value={highlightForm.title}
                    onChange={handleHighlightChange}
                    placeholder="e.g. Protect Your Home"
                    required
                  />
                </label>

                <label>
                  Subtitle / Label
                  <input
                    name="subtitle"
                    value={highlightForm.subtitle}
                    onChange={handleHighlightChange}
                    placeholder="e.g. Whole Home or Free Assessment"
                  />
                </label>

                <label style={{ gridColumn: "span 2" }}>
                  Description
                  <textarea
                    name="description"
                    rows="2"
                    value={highlightForm.description}
                    onChange={handleHighlightChange}
                    placeholder="Brief highlight description shown on the card..."
                  />
                </label>

                <label>
                  Card Icon
                  <select
                    name="icon"
                    value={highlightForm.icon}
                    onChange={handleHighlightChange}
                  >
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i.name} value={i.name}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Audience Target
                  <select
                    name="audience"
                    value={highlightForm.audience}
                    onChange={handleHighlightChange}
                  >
                    <option value="Residential">Residential Only</option>
                    <option value="Commercial">Commercial Only</option>
                    <option value="Both">Both Residential & Commercial</option>
                  </select>
                </label>

                <label>
                  Button Text
                  <input
                    name="buttonText"
                    value={highlightForm.buttonText}
                    onChange={handleHighlightChange}
                    placeholder="e.g. Explore, Book Test, Request Audit"
                  />
                </label>

                <label>
                  Button Action
                  <select
                    name="buttonAction"
                    value={highlightForm.buttonAction}
                    onChange={handleHighlightChange}
                  >
                    <option value="inquiry">Open Dynamic Inquiry Form</option>
                    <option value="whatsapp">Direct WhatsApp Contact</option>
                    <option value="link">Custom URL Navigation</option>
                  </select>
                </label>

                {highlightForm.buttonAction === "link" && (
                  <label style={{ gridColumn: "span 2" }}>
                    Button Link URL
                    <input
                      name="buttonLink"
                      value={highlightForm.buttonLink}
                      onChange={handleHighlightChange}
                      placeholder="e.g. /about or /contact"
                    />
                  </label>
                )}

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: 6 }}>
                    Highlight Image (Optional)
                  </label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="text"
                      name="image"
                      value={highlightForm.image}
                      onChange={handleHighlightChange}
                      placeholder="Cloudinary image URL or paste an external image link"
                      style={{ flex: 1 }}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      className="dt-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      <Upload size={14} />
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </button>
                  </div>
                </div>

                <label>
                  Display Order
                  <input
                    type="number"
                    min="0"
                    name="order"
                    value={highlightForm.order}
                    onChange={handleHighlightChange}
                  />
                </label>

                <label className="dt-checkbox">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={highlightForm.isActive}
                    onChange={handleHighlightChange}
                  />
                  Active / Visible on Highlights
                </label>
              </div>

              {/* Live Preview Box matching frontend (2 cards per row) */}
              <div className="dt-preview-box">
                <span className="dt-preview-tag">
                  <Eye size={13} /> Live Highlights Preview (2 Cards Per Row • 180–195px Width)
                </span>
                <div className="dt-highlights-preview-grid">
                  {/* Card 1: Currently Edited / Form Highlight */}
                  <div className="dt-highlight-preview-card">
                    <div className="dt-hl-image-wrap">
                      {highlightForm.image ? (
                        <img
                          src={highlightForm.image}
                          alt="Preview"
                          className="dt-hl-img"
                        />
                      ) : (
                        <div className="dt-hl-placeholder">
                          <ImageIcon size={32} color="#94a3b8" />
                        </div>
                      )}
                    </div>
                    <div className="dt-hl-content">
                      <strong className="dt-hl-title">
                        {highlightForm.title || "Highlight Title"}
                      </strong>
                      <p className="dt-hl-desc">
                        {highlightForm.description ||
                          "Short description will appear here directly underneath the title..."}
                      </p>
                      {highlightForm.buttonText && (
                        <span className="dt-hl-btn">
                          {highlightForm.buttonText} <ArrowRight size={11} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Companion Preview Card */}
                  <div className="dt-highlight-preview-card dt-companion-preview-card">
                    <div className="dt-hl-image-wrap">
                      <img
                        src={
                          (highlights.find((h) => h._id !== editingHighlightId && h.image)?.image) ||
                          "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80"
                        }
                        alt="Companion Preview"
                        className="dt-hl-img"
                      />
                    </div>
                    <div className="dt-hl-content">
                      <strong className="dt-hl-title">
                        {(highlights.find((h) => h._id !== editingHighlightId && h.title)?.title) || "Companion Card"}
                      </strong>
                      <p className="dt-hl-desc">
                        {(highlights.find((h) => h._id !== editingHighlightId && h.description)?.description) ||
                          "Second highlight displayed side-by-side in the same row."}
                      </p>
                      <span className="dt-hl-btn">
                        {(highlights.find((h) => h._id !== editingHighlightId && h.buttonText)?.buttonText) || "Explore"}{" "}
                        <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dt-actions">
                <button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingHighlightId
                    ? "Update Highlight"
                    : "Add Highlight"}
                </button>
                {editingHighlightId && (
                  <button
                    type="button"
                    className="dt-cancel"
                    onClick={resetHighlightForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Highlights List Section */}
          <section className="dt-card">
            <div className="dt-list-heading">
              <div>
                <h2>Configured Highlights ({filteredHighlights.length})</h2>
                <div className="dt-filter-pills">
                  {["All", "Residential", "Commercial", "Both"].map((aud) => (
                    <button
                      key={aud}
                      type="button"
                      className={`dt-filter-pill ${
                        highlightAudienceFilter === aud ? "active" : ""
                      }`}
                      onClick={() => setHighlightAudienceFilter(aud)}
                    >
                      {aud}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" className="dt-refresh" onClick={loadHighlights}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {loading ? (
              <p>Loading highlights...</p>
            ) : filteredHighlights.length === 0 ? (
              <p>No highlights configured for this category.</p>
            ) : (
              <div className="dt-table-wrap">
                <table className="dt-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Card Preview</th>
                      <th>Title & Label</th>
                      <th>Audience</th>
                      <th>Action</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHighlights.map((item) => {
                      const IconItem =
                        AVAILABLE_ICONS.find((i) => i.name === item.icon)?.icon ||
                        Sparkles;

                      return (
                        <tr key={item._id}>
                          <td>{item.order}</td>
                          <td>
                            <div className="dt-table-icon-wrap">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="dt-table-thumb"
                                />
                              ) : (
                                <IconItem size={18} color="#3b82f6" />
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>{item.title}</strong>
                              {(item.subtitle || item.label) && (
                                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                  {item.subtitle || item.label}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`dt-badge ${
                                item.audience === "Residential"
                                  ? "badge-res"
                                  : item.audience === "Commercial"
                                  ? "badge-comm"
                                  : "badge-both"
                              }`}
                            >
                              {item.audience || "Both"}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, color: "#cbd5e1" }}>
                              {item.buttonAction === "whatsapp"
                                ? "WhatsApp"
                                : item.buttonAction === "link"
                                ? "Link"
                                : "Inquiry Form"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`dt-status ${
                                item.isActive ? "active" : "inactive"
                              }`}
                              onClick={() => toggleHighlightStatus(item)}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td>
                            <div className="dt-row-actions">
                              <button
                                type="button"
                                className="dt-edit-btn"
                                onClick={() => handleHighlightEdit(item)}
                              >
                                <Edit2 size={13} /> Edit
                              </button>
                              <button
                                type="button"
                                className="dt-delete"
                                onClick={() => handleHighlightDelete(item._id)}
                              >
                                <Trash2 size={13} /> Delete
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
          </section>
        </>
      )}
    </main>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import "./settings.css";
import {
  UploadCloud,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import {
  DEFAULT_AVXBS_LOGO,
  notifyLogoChange,
} from "../../../utils/useWebsiteLogo";

const emptyAssistance = {
  enabled: true,
  buttonLabel: "Need Assistance?",
  openingMessage:
    "Hello AVXBS Team, I need assistance with your water treatment solutions. Please share more details.",
  departments: [
    { name: "General Enquiry", phone: "919692625703", isActive: true },
  ],
  defaultDepartment: "General Enquiry",
};

export default function SettingsClient() {
  const [tab, setTab] = useState("logo");
  const [admin, setAdmin] = useState({ name: "", email: "", role: "admin" });
  const [assistance, setAssistance] = useState(emptyAssistance);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Website Logo Management State
  const [logoData, setLogoData] = useState({
    logoUrl: DEFAULT_AVXBS_LOGO,
    logoPublicId: "",
    isDefault: true,
    siteName: "AVXBS Water Solutions",
  });
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_AVXBS_LOGO);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  useEffect(() => {
    async function loadSettings() {
      try {
        const [accountResponse, assistanceResponse, logoResponse] =
          await Promise.all([
            fetch("/api/admin/account"),
            fetch("/api/admin/assistance"),
            fetch("/api/admin/logo"),
          ]);

        const accountData = await accountResponse.json();
        const assistanceData = await assistanceResponse.json();
        const logoResData = await logoResponse.json().catch(() => null);

        if (accountData.success) setAdmin(accountData.admin);
        if (assistanceData.success) setAssistance(assistanceData.settings);
        if (logoResData?.success) {
          const currentUrl = logoResData.logoUrl || DEFAULT_AVXBS_LOGO;
          setLogoData({
            logoUrl: currentUrl,
            logoPublicId: logoResData.logoPublicId || "",
            isDefault: Boolean(logoResData.isDefault),
            siteName: logoResData.siteName || "AVXBS Water Solutions",
          });
          setPreviewUrl(currentUrl);
        }
      } catch {
        setNotice({ type: "error", message: "Unable to load settings." });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const notify = (type, message) => {
    setNotice({ type, message });
    if (type === "success") {
      setTimeout(() => {
        setNotice((current) => (current.message === message ? { type: "", message: "" } : current));
      }, 5000);
    }
  };

  // --------------------------------------------------------------------------
  // LOGO MANAGEMENT HANDLERS
  // --------------------------------------------------------------------------
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type or file extension
    const validExtensions = /\.(png|jpe?g|webp|svg)$/i;
    const validMimes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

    if (!validMimes.includes(file.type.toLowerCase()) && !validExtensions.test(file.name)) {
      notify("error", "Unsupported file format. Please upload a PNG, JPG, JPEG, WEBP, or SVG file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      notify("error", "File size exceeds 15MB. Please choose a smaller image or SVG.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);

    // Format human-readable size
    let formattedSize = `${(file.size / 1024).toFixed(1)} KB`;
    if (file.size > 1024 * 1024) {
      formattedSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    }

    const fileTypeLabel = file.type
      ? file.type.replace("image/", "").replace("+xml", "").toUpperCase()
      : file.name.split(".").pop().toUpperCase();

    setFileInfo({
      name: file.name,
      size: formattedSize,
      type: fileTypeLabel,
    });

    notify("info", "New logo selected. Click 'Save Changes' to apply it across the site.");
  }

  function handleCancelSelection() {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setFileInfo(null);
    setPreviewUrl(logoData.logoUrl || DEFAULT_AVXBS_LOGO);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSaveLogo() {
    if (!selectedFile) {
      notify("info", "No new logo file selected to save.");
      return;
    }

    setSaving(true);
    setNotice({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("logo", selectedFile);

      const response = await fetch("/api/admin/logo", {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update website logo.");
      }

      setLogoData({
        logoUrl: data.logoUrl,
        logoPublicId: data.logoPublicId,
        isDefault: false,
        siteName: logoData.siteName,
      });
      setPreviewUrl(data.logoUrl);
      setSelectedFile(null);
      setFileInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Instant global notification
      notifyLogoChange(data.logoUrl);

      notify("success", "Website logo updated successfully! Changes are active everywhere.");
    } catch (error) {
      notify("error", error.message || "Failed to save logo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRestoreDefault() {
    if (selectedFile && logoData.isDefault) {
      handleCancelSelection();
      notify("info", "Reverted unsaved file selection.");
      return;
    }

    const confirmRestore = window.confirm(
      "Restore the default AVXBS brand logo? This will remove the custom uploaded logo."
    );
    if (!confirmRestore) return;

    setRestoring(true);
    setNotice({ type: "", message: "" });

    try {
      const response = await fetch("/api/admin/logo/restore-default", {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to restore default logo.");
      }

      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setLogoData({
        logoUrl: DEFAULT_AVXBS_LOGO,
        logoPublicId: "",
        isDefault: true,
        siteName: logoData.siteName,
      });
      setPreviewUrl(DEFAULT_AVXBS_LOGO);
      setSelectedFile(null);
      setFileInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Instant global notification
      notifyLogoChange(DEFAULT_AVXBS_LOGO);

      notify("success", "Default AVXBS brand logo restored successfully.");
    } catch (error) {
      notify("error", error.message || "Failed to restore default logo.");
    } finally {
      setRestoring(false);
    }
  }

  // --------------------------------------------------------------------------
  // PROFILE & PASSWORD HANDLERS
  // --------------------------------------------------------------------------
  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setNotice({ type: "", message: "" });

    try {
      const response = await fetch("/api/admin/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: admin.name,
          email: admin.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);
      setAdmin(data.admin);
      notify("success", data.message);
    } catch (error) {
      notify("error", error.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      notify("error", "New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    setNotice({ type: "", message: "" });

    try {
      const response = await fetch("/api/admin/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      notify("success", data.message);
    } catch (error) {
      notify("error", error.message || "Password change failed.");
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------------------------------
  // ASSISTANCE HANDLERS
  // --------------------------------------------------------------------------
  async function saveAssistance(event) {
    event.preventDefault();
    setSaving(true);
    setNotice({ type: "", message: "" });

    try {
      const response = await fetch("/api/admin/assistance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assistance),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setAssistance(data.settings);
      notify("success", data.message);
    } catch (error) {
      notify("error", error.message || "Assistance settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function updateDepartment(index, field, value) {
    setAssistance((previous) => ({
      ...previous,
      departments: previous.departments.map((department, i) =>
        i === index ? { ...department, [field]: value } : department
      ),
    }));
  }

  function addDepartment() {
    setAssistance((previous) => ({
      ...previous,
      departments: [
        ...previous.departments,
        { name: "", phone: "", isActive: true },
      ],
    }));
  }

  function removeDepartment(index) {
    setAssistance((previous) => {
      const departments = previous.departments.filter((_, i) => i !== index);
      const defaultDepartment = departments.some(
        (item) =>
          item.name === previous.defaultDepartment && item.isActive
      )
        ? previous.defaultDepartment
        : departments.find((item) => item.isActive)?.name || "";

      return { ...previous, departments, defaultDepartment };
    });
  }

  if (loading) {
    return <div className="settings-loading">Loading account settings...</div>;
  }

  return (
    <div className="admin-settings-page">
      <div className="settings-heading">
        <div>
          <div className="settings-header-top">
            <Link href="/admin/dashboard" className="settings-back-link">
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <span className="settings-eyebrow">ADMIN CONTROL CENTER</span>
          <h1>Account Settings</h1>
          <p>Manage your company website logo, admin profile, security and customer assistance.</p>
        </div>
      </div>

      {notice.message && (
        <div className={`settings-notice ${notice.type}`}>
          {notice.type === "success" && <CheckCircle2 size={16} />}
          {notice.type === "error" && <AlertCircle size={16} />}
          {notice.type === "info" && <Sparkles size={16} />}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="settings-tabs">
        <button
          type="button"
          className={tab === "logo" ? "active" : ""}
          onClick={() => setTab("logo")}
        >
          <ImageIcon size={15} />
          <span>Website Logo</span>
        </button>
        <button
          type="button"
          className={tab === "account" ? "active" : ""}
          onClick={() => setTab("account")}
        >
          Admin Profile
        </button>
        <button
          type="button"
          className={tab === "password" ? "active" : ""}
          onClick={() => setTab("password")}
        >
          Password & Security
        </button>
        <button
          type="button"
          className={tab === "assistance" ? "active" : ""}
          onClick={() => setTab("assistance")}
        >
          WhatsApp Assistance
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: WEBSITE LOGO MANAGEMENT                                  */}
      {/* ==================================================================== */}
      {tab === "logo" && (
        <section className="settings-card settings-logo-card">
          <div className="settings-section-heading">
            <div>
              <h2>Website Logo Management</h2>
              <p>Upload and manage the official brand logo displayed across your website navbar, mobile drawer, footer, and admin dashboard.</p>
            </div>
            <div className="logo-badge-container">
              {selectedFile ? (
                <span className="logo-status-badge badge-pending">
                  <span className="badge-dot dot-pending" />
                  New Logo Preview (Unsaved)
                </span>
              ) : logoData.isDefault ? (
                <span className="logo-status-badge badge-default">
                  <span className="badge-dot dot-default" />
                  Default System Logo
                </span>
              ) : (
                <span className="logo-status-badge badge-custom">
                  <span className="badge-dot dot-custom" />
                  Active Custom Logo
                </span>
              )}
            </div>
          </div>

          {/* Current AVXBS Logo Preview Box */}
          <div className="logo-management-body">
            <div className="logo-preview-panel">
              <label className="logo-preview-label">Current AVXBS Logo Preview</label>
              
              <div className="logo-checkerboard-canvas">
                <img
                  src={previewUrl || DEFAULT_AVXBS_LOGO}
                  alt="AVXBS Logo Preview"
                  className="logo-display-img"
                  onError={(e) => {
                    if (e.currentTarget.src !== DEFAULT_AVXBS_LOGO) {
                      e.currentTarget.src = DEFAULT_AVXBS_LOGO;
                    }
                  }}
                />
              </div>

              <div className="logo-preview-footer">
                <div className="logo-file-details">
                  <span className="logo-file-name">
                    {selectedFile
                      ? selectedFile.name
                      : logoData.isDefault
                      ? "avxbs-logo.png (Default Asset)"
                      : "custom-brand-logo"}
                  </span>
                  <span className="logo-file-meta">
                    {fileInfo ? (
                      <>
                        <span className="meta-pill">{fileInfo.type}</span>
                        <span>{fileInfo.size}</span>
                      </>
                    ) : (
                      <>
                        <span className="meta-pill">BRAND</span>
                        <span>Original Ratio Preserved • No Distortion</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />

            {/* Actions Toolbar */}
            <div className="logo-actions-group">
              <div className="logo-primary-actions">
                {!selectedFile ? (
                  <button
                    type="button"
                    className="logo-action-btn btn-upload-new"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving || restoring}
                  >
                    <UploadCloud size={17} />
                    <span>Upload New Logo</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="logo-action-btn btn-replace"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving || restoring}
                  >
                    <RefreshCw size={16} />
                    <span>Replace Logo</span>
                  </button>
                )}

                {/* Remove/Restore Default Logo */}
                {(!logoData.isDefault || selectedFile) && (
                  <button
                    type="button"
                    className="logo-action-btn btn-restore-default"
                    onClick={handleRestoreDefault}
                    disabled={saving || restoring}
                  >
                    <RotateCcw size={16} />
                    <span>
                      {restoring ? "Restoring..." : "Restore Default Logo"}
                    </span>
                  </button>
                )}

                {/* Cancel pending file selection */}
                {selectedFile && (
                  <button
                    type="button"
                    className="logo-action-btn btn-cancel-selection"
                    onClick={handleCancelSelection}
                    disabled={saving || restoring}
                  >
                    <X size={16} />
                    <span>Cancel Selection</span>
                  </button>
                )}
              </div>

              {/* Format specifications */}
              <div className="logo-guidance-box">
                <div className="guidance-title">
                  <Sparkles size={14} />
                  <span>Logo Specifications & Recommendations</span>
                </div>
                <ul className="guidance-list">
                  <li>
                    <strong>Supported Formats:</strong> PNG, JPG, JPEG, WEBP, SVG.
                  </li>
                  <li>
                    <strong>Recommended:</strong> Transparent PNG or SVG for crystal-clear appearance across both dark and light navigation themes.
                  </li>
                  <li>
                    <strong>Aspect Ratio:</strong> Any natural aspect ratio is accepted; logos are rendered with <code>object-fit: contain</code> to strictly prevent stretching or compression.
                  </li>
                  <li>
                    <strong>Instant Propagation:</strong> Saving changes automatically propagates the new logo across the website navbar, footer, mobile navigation, and admin panel.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Changes button */}
          <div className="logo-save-bar">
            <button
              type="button"
              className="settings-save-btn logo-submit-btn"
              onClick={handleSaveLogo}
              disabled={saving || restoring || !selectedFile}
            >
              {saving ? (
                <>
                  <Loader2 className="btn-spinner" size={17} />
                  <span>Saving & Publishing Logo...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            {selectedFile && (
              <span className="logo-save-hint">
                Click &quot;Save Changes&quot; to upload to Cloudinary and update MongoDB.
              </span>
            )}
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: ADMIN PROFILE                                            */}
      {/* ==================================================================== */}
      {tab === "account" && (
        <section className="settings-card">
          <h2>Admin Profile</h2>
          <p>Update the name and email associated with your admin account.</p>

          <form onSubmit={saveProfile} className="settings-form">
            <label>
              Full Name
              <input
                value={admin.name}
                onChange={(e) =>
                  setAdmin({ ...admin, name: e.target.value })
                }
                required
              />
            </label>

            <label>
              Email Address
              <input
                type="email"
                value={admin.email}
                onChange={(e) =>
                  setAdmin({ ...admin, email: e.target.value })
                }
                required
              />
            </label>

            <label>
              Account Role
              <input value={admin.role} disabled readOnly />
            </label>

            <button className="settings-save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: PASSWORD & SECURITY                                      */}
      {/* ==================================================================== */}
      {tab === "password" && (
        <section className="settings-card">
          <h2>Password & Security</h2>
          <p>Update your password to keep your administration account secure.</p>

          <form onSubmit={changePassword} className="settings-form">
            <label>
              Current Password
              <input
                type="password"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    currentPassword: e.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    newPassword: e.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirmPassword: e.target.value,
                  })
                }
                required
              />
            </label>

            <button className="settings-save-btn" disabled={saving}>
              {saving ? "Updating..." : "Change Password"}
            </button>
          </form>
        </section>
      )}

      {/* ==================================================================== */}
      {/* SECTION 4: WHATSAPP ASSISTANCE                                      */}
      {/* ==================================================================== */}
      {tab === "assistance" && (
        <section className="settings-card">
          <div className="settings-section-heading">
            <div>
              <h2>WhatsApp Assistance</h2>
              <p>Control the floating customer support button on your website.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={assistance.enabled}
                onChange={(e) =>
                  setAssistance({
                    ...assistance,
                    enabled: e.target.checked,
                  })
                }
              />
              <span />
            </label>
          </div>

          <form onSubmit={saveAssistance} className="settings-form">
            <label>
              Floating Button Label
              <input
                value={assistance.buttonLabel}
                onChange={(e) =>
                  setAssistance({
                    ...assistance,
                    buttonLabel: e.target.value,
                  })
                }
                placeholder="Need Assistance?"
              />
            </label>

            <label>
              WhatsApp Opening Message
              <textarea
                rows={4}
                value={assistance.openingMessage}
                onChange={(e) =>
                  setAssistance({
                    ...assistance,
                    openingMessage: e.target.value,
                  })
                }
              />
            </label>

            <div className="settings-section-heading">
              <div>
                <h3>Support Departments</h3>
                <p>Add separate WhatsApp numbers for different enquiries.</p>
              </div>
              <button
                type="button"
                className="settings-add-btn"
                onClick={addDepartment}
              >
                + Add Department
              </button>
            </div>

            {assistance.departments.map((department, index) => (
              <div className="department-row" key={index}>
                <label>
                  Department Name
                  <input
                    value={department.name}
                    onChange={(e) =>
                      updateDepartment(index, "name", e.target.value)
                    }
                    placeholder="e.g. Sales"
                    required
                  />
                </label>

                <label>
                  WhatsApp Number
                  <input
                    value={department.phone}
                    onChange={(e) =>
                      updateDepartment(index, "phone", e.target.value)
                    }
                    placeholder="919XXXXXXXXX"
                    inputMode="numeric"
                    required
                  />
                  <small>Include country code, without + or spaces.</small>
                </label>

                <label className="department-active">
                  <input
                    type="checkbox"
                    checked={department.isActive}
                    onChange={(e) =>
                      updateDepartment(index, "isActive", e.target.checked)
                    }
                  />
                  Active
                </label>

                <button
                  type="button"
                  className="department-remove"
                  onClick={() => removeDepartment(index)}
                  disabled={assistance.departments.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}

            <label>
              Default WhatsApp Department
              <select
                value={assistance.defaultDepartment}
                onChange={(e) =>
                  setAssistance({
                    ...assistance,
                    defaultDepartment: e.target.value,
                  })
                }
                required
              >
                <option value="">Select department</option>
                {assistance.departments
                  .filter((item) => item.isActive && item.name.trim())
                  .map((item, index) => (
                    <option key={`${item.name}-${index}`} value={item.name}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>

            <button className="settings-save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Assistance Settings"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

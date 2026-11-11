"use client";

import { useEffect, useState } from "react";
import "./settings.css";

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
  const [tab, setTab] = useState("account");
  const [admin, setAdmin] = useState({ name: "", email: "", role: "admin" });
  const [assistance, setAssistance] = useState(emptyAssistance);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  useEffect(() => {
    async function loadSettings() {
      try {
        const [accountResponse, assistanceResponse] = await Promise.all([
          fetch("/api/admin/account"),
          fetch("/api/admin/assistance"),
        ]);

        const accountData = await accountResponse.json();
        const assistanceData = await assistanceResponse.json();

        if (accountData.success) setAdmin(accountData.admin);
        if (assistanceData.success) setAssistance(assistanceData.settings);
      } catch {
        setNotice({ type: "error", message: "Unable to load settings." });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const notify = (type, message) => setNotice({ type, message });

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
          <span className="settings-eyebrow">ADMIN CONTROL CENTER</span>
          <h1>Account Settings</h1>
          <p>Manage your admin profile, security and customer assistance.</p>
        </div>
      </div>

      {notice.message && (
        <div className={`settings-notice ${notice.type}`}>
          {notice.message}
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={tab === "account" ? "active" : ""}
          onClick={() => setTab("account")}
        >
          Admin Profile
        </button>
        <button
          className={tab === "password" ? "active" : ""}
          onClick={() => setTab("password")}
        >
          Password & Security
        </button>
        <button
          className={tab === "assistance" ? "active" : ""}
          onClick={() => setTab("assistance")}
        >
          WhatsApp Assistance
        </button>
      </div>

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
              <input value={admin.role} disabled />
            </label>

            <button className="settings-save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>
      )}

      {tab === "password" && (
        <section className="settings-card">
          <h2>Change Password</h2>
          <p>Confirm your current password before choosing a new one.</p>

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
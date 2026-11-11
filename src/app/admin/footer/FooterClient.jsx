
"use client";

import { useEffect, useState } from "react";
import "./footer-admin.css";

const defaults = {
  brandTagline: "PURE WATER. BETTER LIVING.",
  topMessage: "Engineering Pure Water for Homes & Enterprises",
  aboutHeading: "About AVXBS",
  aboutDescription: "",
  highlightText: "Smart Water Treatment Solutions",
  contactHeading: "Contact & Support",
  contactDescription: "We're here to help you.",
  addressHeading: "Headquarters",
  address: "",
  phoneHeading: "Helpline",
  phone: "",
  emailHeading: "Email",
  email: "",
  legalLinks: [],
  socialLinks: [],
  copyrightCompany: "AVXBS Solutions",
  rightsText: "All Rights Reserved.",
  showCopyrightYear: true,
};

const fieldGroups = [
  {
    title: "Brand Information",
    fields: [
      ["brandTagline", "Brand Tagline"],
      ["topMessage", "Top Message"],
    ],
  },
  {
    title: "About Section",
    fields: [
      ["aboutHeading", "About Heading"],
      ["aboutDescription", "About Description", "textarea"],
      ["highlightText", "Highlight Text"],
    ],
  },
  {
    title: "Contact & Support",
    fields: [
      ["contactHeading", "Contact Heading"],
      ["contactDescription", "Contact Description"],
      ["addressHeading", "Address Heading"],
      ["address", "Company Address", "textarea"],
      ["phoneHeading", "Phone Heading"],
      ["phone", "Phone Number"],
      ["emailHeading", "Email Heading"],
      ["email", "Support Email"],
    ],
  },
  {
    title: "Copyright",
    fields: [
      ["copyrightCompany", "Company Name"],
      ["rightsText", "Rights Text"],
    ],
  },
];

export default function FooterClient({ admin }) {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadFooter() {
      try {
        const response = await fetch("/api/admin/footer", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load footer");
        }

        setForm({ ...defaults, ...data.footer });
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadFooter();
  }, []);

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function updateLink(type, index, field, value) {
    setForm((previous) => ({
      ...previous,
      [type]: previous[type].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addLink(type) {
    const item =
      type === "legalLinks"
        ? { label: "New Link", url: "#", isActive: true }
        : { platform: "New Social", url: "#", isActive: true };

    setForm((previous) => ({
      ...previous,
      [type]: [...previous[type], item],
    }));
  }

  function removeLink(type, index) {
    setForm((previous) => ({
      ...previous,
      [type]: previous[type].filter((_, i) => i !== index),
    }));
  }

  async function saveFooter(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Save failed");
      }

      setForm({ ...defaults, ...data.footer });
      setMessage("Footer updated successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="footer-admin"><p>Loading footer settings...</p></main>;
  }

  return (
    <main className="footer-admin">
      <header className="footer-admin-header">
        <div>
          <span>WEBSITE CONTENT</span>
          <h1>Footer Management</h1>
          <p>Manage your public website footer from one place.</p>
        </div>
        <a href="/admin/dashboard">← Dashboard</a>
      </header>

      <form onSubmit={saveFooter}>
        {fieldGroups.map((group) => (
          <section className="footer-admin-card" key={group.title}>
            <h2>{group.title}</h2>

            <div className="footer-admin-fields">
              {group.fields.map(([name, label, type]) => (
                <label className="footer-admin-field" key={name}>
                  <span>{label}</span>

                  {type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={form[name] || ""}
                      onChange={(e) => updateField(name, e.target.value)}
                    />
                  ) : (
                    <input
                      value={form[name] || ""}
                      onChange={(e) => updateField(name, e.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}

        <section className="footer-admin-card">
          <h2>Legal & Policy Links</h2>

         <div className="footer-link-row footer-link-heading">
  <span>Link Name</span>
  <span>URL</span>
  <span>Status</span>
  <span>Action</span>
</div>
{form.legalLinks.map((link, index) => (
  <div className="footer-link-row" key={index}>
    <input
      placeholder="Link Name"
      value={link.label}
      onChange={(e) =>
        updateLink("legalLinks", index, "label", e.target.value)
      }
    />

    <input
      placeholder="URL"
      value={link.url}
      onChange={(e) =>
        updateLink("legalLinks", index, "url", e.target.value)
      }
    />

    <label className="footer-active-check">
      <input
        type="checkbox"
        checked={link.isActive !== false}
        onChange={(e) =>
          updateLink("legalLinks", index, "isActive", e.target.checked)
        }
      />
      Active
    </label>

    <button
      type="button"
      className="footer-remove-btn"
      onClick={() => removeLink("legalLinks", index)}
    >
      Delete
    </button>
  </div>
))}


          <button
            type="button"
            className="footer-add-btn"
            onClick={() => addLink("legalLinks")}
          >
            + Add Legal Link
          </button>
        </section>

        <section className="footer-admin-card">
          <h2>Social Media Links</h2>

<section className="footer-admin-card">
  <h2>Social Media Links</h2>

  {/* Heading only once */}
  <div className="footer-link-row footer-link-heading">
    <span>Platform Name</span>
    <span>URL</span>
    <span>Status</span>
    <span>Action</span>
  </div>

  {/* Social Media Rows */}
  {form.socialLinks.map((link, index) => (
    <div className="footer-link-row" key={index}>
      <input
        placeholder="Platform Name"
        value={link.platform}
        onChange={(e) =>
          updateLink("socialLinks", index, "platform", e.target.value)
        }
      />

      <input
        placeholder="Social Media URL"
        value={link.url}
        onChange={(e) =>
          updateLink("socialLinks", index, "url", e.target.value)
        }
      />

      <label className="footer-active-check">
        <input
          type="checkbox"
          checked={link.isActive !== false}
          onChange={(e) =>
            updateLink("socialLinks", index, "isActive", e.target.checked)
          }
        />
        Active
      </label>

      <button
        type="button"
        className="footer-remove-btn"
        onClick={() => removeLink("socialLinks", index)}
      >
        Delete
      </button>
    </div>
  ))}

  <button
    type="button"
    className="footer-add-btn"
    onClick={() => addLink("socialLinks")}
  >
    + Add Social Link
  </button>
</section>
        </section>

        <section className="footer-admin-card">
          <h2>Display Settings</h2>

          <label className="footer-active-check">
            <input
              type="checkbox"
              checked={form.showCopyrightYear}
              onChange={(e) =>
                updateField("showCopyrightYear", e.target.checked)
              }
            />
            Show current year in copyright
          </label>
        </section>

        <div className="footer-admin-save-area">
          {message && <p role="status">{message}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Footer Changes"}
          </button>
        </div>
      </form>
    </main>
  );
}

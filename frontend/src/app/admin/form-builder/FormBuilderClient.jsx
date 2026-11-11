"use client";

import { useEffect, useMemo, useState } from "react";
import "./form-builder.css";

const TYPES = [
  "text", "number", "email", "phone", "textarea",
  "dropdown", "radio", "checkbox", "date",
];

const createId = () =>
  `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const newField = () => ({
  id: createId(),
  name: "newField",
  label: "New Field",
  type: "text",
  placeholder: "",
  required: false,
  enabled: true,
  options: [],
  order: 0,
});

export default function FormBuilderClient() {
  const [tabs, setTabs] = useState([]);
  const [audience, setAudience] = useState("Residential");
  const [selectedTabId, setSelectedTabId] = useState("");
  const [fields, setFields] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const filteredTabs = useMemo(
    () =>
      tabs.filter(
        (tab) =>
          tab.category === audience || tab.category === "Both"
      ),
    [tabs, audience]
  );

  const selectedTab = tabs.find(
    (tab) => tab.tabId === selectedTabId
  );

  async function loadTabs() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/form-builder", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load tabs.");
      }

      const loadedTabs = data.tabs || [];
      setTabs(loadedTabs);

      const first =
        loadedTabs.find(
          (tab) =>
            tab.category === "Residential" || tab.category === "Both"
        ) || loadedTabs[0];

      if (first) {
        setAudience("Residential");
        setSelectedTabId(first.tabId);
        setFields(first.fields || []);
      } else {
        setSelectedTabId("");
        setFields([]);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTabs();
  }, []);

  function selectAudience(nextAudience) {
    setAudience(nextAudience);
    setEditing(null);
    setShowPreview(false);

    const first = tabs.find(
      (tab) =>
        tab.category === nextAudience || tab.category === "Both"
    );

    if (first) {
      setSelectedTabId(first.tabId);
      setFields(first.fields || []);
    } else {
      setSelectedTabId("");
      setFields([]);
    }

    setMessage("");
  }

  function selectTab(tab) {
    setSelectedTabId(tab.tabId);
    setFields(tab.fields || []);
    setEditing(null);
    setShowPreview(false);
    setMessage("");
  }

  function saveField() {
    if (!editing.field.label.trim() || !editing.field.name.trim()) {
      setMessage("Field label and field name are required.");
      return;
    }

    const field = {
      ...editing.field,
      label: editing.field.label.trim(),
      name: editing.field.name.trim().replace(/\s+/g, "_"),
      options: (editing.field.options || [])
        .map((option) => option.trim())
        .filter(Boolean),
    };

    if (
      ["dropdown", "radio", "checkbox"].includes(field.type) &&
      field.options.length === 0
    ) {
      setMessage("Please add at least one option.");
      return;
    }

    setFields((current) => {
      if (editing.mode === "add") {
        return [...current, { ...field, order: current.length }];
      }

      return current.map((item) =>
        item.id === field.id ? field : item
      );
    });

    setEditing(null);
    setMessage("");
  }

  function deleteField(id) {
    if (!window.confirm("Delete this field?")) return;

    setFields((current) =>
      current
        .filter((field) => field.id !== id)
        .map((field, index) => ({ ...field, order: index }))
    );
  }

  function moveField(index, direction) {
    const next = [...fields];
    const target = index + direction;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];

    setFields(next.map((field, order) => ({ ...field, order })));
  }

  async function saveChanges() {
    if (!selectedTab) {
      setMessage("Please select a Dynamic Tab first.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch("/api/admin/form-builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabId: selectedTab.tabId,
          fields,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save form.");
      }

      setTabs((current) =>
        current.map((tab) =>
          tab.tabId === selectedTabId ? { ...tab, fields } : tab
        )
      );

      setMessage("Form saved successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  function openAddField() {
    setEditing({ mode: "add", field: newField() });
  }

  function openEditField(field) {
    setEditing({
      mode: "edit",
      field: { ...field, options: [...(field.options || [])] },
    });
  }

  if (loading) {
    return <div className="fb-loading">Loading Form Builder...</div>;
  }

  return (
    <main className="fb-page">
      <header className="fb-header">
        <div>
          <span className="fb-eyebrow">AVXBS MANAGEMENT</span>
          <h1>Dynamic Form Builder</h1>
          <p>Manage inquiry forms for all your Dynamic Tabs.</p>
        </div>

        <div className="fb-header-actions">
          <button
            className="fb-secondary-btn"
            onClick={() => setShowPreview(!showPreview)}
            disabled={!selectedTab}
          >
            {showPreview ? "Close Preview" : "Preview Form"}
          </button>

          <button
            className="fb-primary-btn"
            onClick={saveChanges}
            disabled={saving || !selectedTab}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </header>

      {message && <div className="fb-notice">{message}</div>}

      <section className="fb-panel">
        <h2>Select Audience</h2>

        <div className="fb-audience-switch">
          {["Residential", "Commercial"].map((item) => (
            <button
              key={item}
              className={audience === item ? "active" : ""}
              onClick={() => selectAudience(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <h2 className="fb-section-title">
          {audience} Dynamic Tabs
        </h2>

        {filteredTabs.length === 0 ? (
          <div className="fb-empty">
            <h3>No active Dynamic Tabs found</h3>
            <p>Add or activate tabs in Dynamic Tabs Management.</p>
          </div>
        ) : (
          <div className="fb-product-grid">
            {filteredTabs.map((tab) => (
              <button
                key={tab.tabId}
                className={`fb-product-card ${
                  selectedTabId === tab.tabId ? "active" : ""
                }`}
                onClick={() => selectTab(tab)}
              >
                <strong>{tab.title}</strong>
                <small>{tab.category} Tab</small>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedTab && (
        <section className="fb-panel fb-editor-panel">
          <div className="fb-panel-heading">
            <div>
              <span className="fb-eyebrow">
                {audience.toUpperCase()} FORM
              </span>
              <h2>{selectedTab.title}</h2>
              <small>Manage fields for this Dynamic Tab.</small>
            </div>

            <button className="fb-primary-btn" onClick={openAddField}>
              + Add Field
            </button>
          </div>

          <div className="fb-field-list">
            {fields.length === 0 && (
              <div className="fb-empty">
                <h3>No fields configured</h3>
                <p>Add a field to start building this form.</p>
              </div>
            )}

            {fields.map((field, index) => (
              <article className="fb-field-card" key={field.id}>
                <div className="fb-field-number">{index + 1}</div>

                <div className="fb-field-info">
                  <strong>{field.label}</strong>
                  <small>
                    {field.type} · {field.required ? "Required" : "Optional"}
                  </small>
                </div>

                <span className={`fb-status ${field.enabled ? "on" : ""}`}>
                  {field.enabled ? "Active" : "Disabled"}
                </span>

                <button
                  className="fb-icon-btn"
                  title="Move up"
                  onClick={() => moveField(index, -1)}
                >↑</button>

                <button
                  className="fb-icon-btn"
                  title="Move down"
                  onClick={() => moveField(index, 1)}
                >↓</button>

                <button
                  className="fb-icon-btn"
                  title="Edit"
                  onClick={() => openEditField(field)}
                >✎</button>

                <button
                  className="fb-icon-btn danger"
                  title="Delete"
                  onClick={() => deleteField(field.id)}
                >×</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {editing && (
        <div className="fb-modal-backdrop">
          <div className="fb-modal">
            <div className="fb-modal-heading">
              <h2>{editing.mode === "add" ? "Add Field" : "Edit Field"}</h2>
              <button onClick={() => setEditing(null)}>×</button>
            </div>

            <div className="fb-form-grid">
              <label>
                Field Label
                <input
                  value={editing.field.label}
                  onChange={(e) =>
                    setEditing((old) => ({
                      ...old,
                      field: { ...old.field, label: e.target.value },
                    }))
                  }
                />
              </label>

              <label>
                Field Name
                <input
                  value={editing.field.name}
                  onChange={(e) =>
                    setEditing((old) => ({
                      ...old,
                      field: { ...old.field, name: e.target.value },
                    }))
                  }
                />
              </label>

              <label>
                Field Type
                <select
                  value={editing.field.type}
                  onChange={(e) =>
                    setEditing((old) => ({
                      ...old,
                      field: {
                        ...old.field,
                        type: e.target.value,
                        options: ["dropdown", "radio", "checkbox"].includes(
                          e.target.value
                        )
                          ? old.field.options
                          : [],
                      },
                    }))
                  }
                >
                  {TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Placeholder
                <input
                  value={editing.field.placeholder}
                  onChange={(e) =>
                    setEditing((old) => ({
                      ...old,
                      field: { ...old.field, placeholder: e.target.value },
                    }))
                  }
                />
              </label>

              {["dropdown", "radio", "checkbox"].includes(editing.field.type) && (
                <label className="fb-full-width">
                  Options — one per line
                  <textarea
                    rows={4}
                    value={(editing.field.options || []).join("\n")}
                    onChange={(e) =>
                      setEditing((old) => ({
                        ...old,
                        field: {
                          ...old.field,
                          options: e.target.value.split("\n"),
                        },
                      }))
                    }
                  />
                </label>
              )}

              <label className="fb-toggle">
                <input
                  type="checkbox"
                  checked={editing.field.required}
                  onChange={(e) =>
                    setEditing((old) => ({
                      ...old,
                      field: {
                        ...old.field,
                        required: e.target.checked,
                      },
                    }))
                  }
                />
                Required field
              </label>

              <label className="fb-toggle">
                <input
                  type="checkbox"
                  checked={editing.field.enabled}
                  onChange={(e) =>
                    setEditing((old) => ({
                      ...old,
                      field: {
                        ...old.field,
                        enabled: e.target.checked,
                      },
                    }))
                  }
                />
                Enable field
              </label>
            </div>

            <div className="fb-modal-actions">
              <button
                className="fb-secondary-btn"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>

              <button className="fb-primary-btn" onClick={saveField}>
                Save Field
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && selectedTab && (
        <section className="fb-preview-panel">
          <h2>{selectedTab.title} — {audience} Preview</h2>

          {fields
            .filter((field) => field.enabled)
            .map((field) => (
              <label className="fb-preview-field" key={field.id}>
                {field.label}{field.required ? " *" : ""}

                {field.type === "textarea" ? (
                  <textarea placeholder={field.placeholder} />
                ) : field.type === "dropdown" ? (
                  <select defaultValue="">
                    <option value="">Select {field.label}</option>
                    {(field.options || []).map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "radio" || field.type === "checkbox" ? (
                  <div>
                    {(field.options || []).map((option, index) => (
                      <label key={index} style={{ display: "block" }}>
                        <input
                          type={field.type}
                          name={field.name}
                          value={option}
                        />
                        {" "}{option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type={field.type === "phone" ? "tel" : field.type}
                    placeholder={field.placeholder}
                  />
                )}
              </label>
            ))}
        </section>
      )}
    </main>
  );
}

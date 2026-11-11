
"use client";

import { useEffect, useState } from "react";
import "./dynamic-tabs.css";
const emptyForm = {
  title: "",
  category: "Residential",
  order: 1,
  isActive: true,
};

export default function DynamicTabsClient({ admin }) {
  const [tabs, setTabs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadTabs() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dynamic-tabs");
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

  useEffect(() => {
    loadTabs();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm({ ...emptyForm, order: tabs.length + 1 });
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setMessage("Please enter a tab name.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch("/api/admin/dynamic-tabs", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          order: Number(form.order) || 0,
          ...(editingId ? { id: editingId } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save tab");
      }

      setMessage(data.message);
      resetForm();
      await loadTabs();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(tab) {
    setEditingId(tab._id);
    setForm({
      title: tab.title || "",
      category: tab.category || "Residential",
      order: tab.order ?? 0,
      isActive: tab.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this tab?")) return;

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

  async function toggleStatus(tab) {
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

  return (
    <main className="dt-page">
      <header className="dt-header">
        <div>
          <span className="dt-eyebrow">WEBSITE MANAGEMENT</span>
          <h1>Dynamic Tabs</h1>
          <p>Manage Residential and Commercial website categories.</p>
        </div>
        <div className="dt-count">
          <strong>{tabs.length}</strong>
          <span>Total Tabs</span>
        </div>
      </header>

      {message && <div className="dt-message">{message}</div>}

      <section className="dt-card">
        <h2>{editingId ? "Edit Tab" : "Create New Tab"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="dt-grid">
            <label>
              Tab Name
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Water Softening"
                required
              />
            </label>

            <label>
              Audience
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
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
                value={form.order}
                onChange={handleChange}
              />
            </label>

            <label className="dt-checkbox">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              Active / Visible
            </label>
          </div>

          <div className="dt-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Tab" : "Add Tab"}
            </button>
            {editingId && (
              <button type="button" className="dt-cancel" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="dt-card">
        <div className="dt-list-heading">
          <h2>All Categories ({tabs.length})</h2>
          <button type="button" className="dt-refresh" onClick={loadTabs}>
            Refresh
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
                    <td><strong>{tab.title}</strong></td>
                    <td>{tab.category}</td>
                    <td>
                      <button
                        type="button"
                        className={`dt-status ${tab.isActive ? "active" : "inactive"}`}
                        onClick={() => toggleStatus(tab)}
                      >
                        {tab.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      <div className="dt-row-actions">
                        <button type="button" onClick={() => handleEdit(tab)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dt-delete"
                          onClick={() => handleDelete(tab._id)}
                        >
                          Delete
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

      <style jsx>{`
        .dt-page { padding: 28px; color: #f5f5f5; }
        .dt-header { display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:28px; }
        .dt-eyebrow { color:#ef4444; font-size:12px; letter-spacing:3px; }
        .dt-header h1 { font-size:32px; margin:8px 0; }
        .dt-header p { color:#9ca3af; margin:0; }
        .dt-count { background:#202127; border:1px solid #34343b; border-radius:14px; padding:18px 25px; display:flex; flex-direction:column; }
        .dt-count strong { font-size:28px; }
        .dt-count span { color:#9ca3af; font-size:13px; }
        .dt-card { background:#191a20; border:1px solid #30313a; border-radius:14px; padding:24px; margin-bottom:24px; }
        .dt-card h2 { font-size:19px; margin:0 0 22px; }
        .dt-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; }
        .dt-grid label { display:flex; flex-direction:column; gap:9px; color:#d1d5db; font-size:14px; }
        .dt-grid input:not([type="checkbox"]),.dt-grid select { width:100%; box-sizing:border-box; padding:13px; background:#101116; color:white; border:1px solid #3a3b45; border-radius:9px; }
        .dt-grid .dt-checkbox { flex-direction:row; align-items:center; align-self:center; }
        .dt-actions,.dt-row-actions { display:flex; gap:10px; margin-top:22px; }
        .dt-actions button,.dt-list-heading button,.dt-row-actions button { border:0; border-radius:8px; padding:11px 17px; background:#dc2626; color:white; cursor:pointer; }
        .dt-actions button:disabled { opacity:.6; cursor:not-allowed; }
        .dt-actions .dt-cancel,.dt-row-actions .dt-delete { background:#444; }
        .dt-list-heading { display:flex; justify-content:space-between; align-items:center; }
        .dt-list-heading h2 { margin:0 0 18px; }
        .dt-table-wrap { overflow-x:auto; }
        .dt-table { width:100%; border-collapse:collapse; min-width:650px; }
        .dt-table th,.dt-table td { text-align:left; padding:14px 12px; border-bottom:1px solid #30313a; font-size:14px; }
        .dt-table th { color:#9ca3af; }
        .dt-status { border:0; border-radius:20px; padding:7px 13px; cursor:pointer; }
        .dt-status.active { background:#14532d; color:#86efac; }
        .dt-status.inactive { background:#444; color:#ddd; }
        .dt-row-actions { margin:0; }
        .dt-message { padding:12px 15px; background:#292a30; border-radius:8px; margin-bottom:18px; }
        @media(max-width:650px) {
          .dt-page { padding:15px; }
          .dt-header { align-items:flex-start; }
          .dt-header h1 { font-size:25px; }
          .dt-grid { grid-template-columns:1fr; }
          .dt-card { padding:17px; }
        }
      `}</style>
    </main>
  );
}

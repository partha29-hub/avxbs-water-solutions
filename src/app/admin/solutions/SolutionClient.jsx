
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import "./solutions.css";

const emptyForm = {
  name: "",
  audience: "Residential",
  category: "Water Softening",
  description: "",
  image: "",
  badge: "",
  benefits: "",
  isFeatured: false,
  isActive: true,
  order: 0,
};

export default function SolutionClient({ admin }) {
const searchParams = useSearchParams();
const initialAudience = searchParams.get("audience");

const [audienceFilter, setAudienceFilter] = useState(
  ["Residential", "Commercial"].includes(initialAudience)
    ? initialAudience
    : "All"
);
  const [solutions, setSolutions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSolutions() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/solutions");
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setSolutions(data.solutions || []);
    } catch (error) {
      setMessage(error.message || "Unable to load solutions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSolutions();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      ...form,
      order: Number(form.order) || 0,
      benefits: form.benefits
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch("/api/admin/solutions", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { ...payload, id: editingId } : payload
        ),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setMessage(data.message);
      setForm(emptyForm);
      setEditingId(null);
      await loadSolutions();
    } catch (error) {
      setMessage(error.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(solution) {
    setEditingId(solution._id);

    setForm({
      name: solution.name || "",
      audience: solution.audience || "Residential",
      category: solution.category || "Water Softening",
      description: solution.description || "",
      image: solution.image || "",
      badge: solution.badge || "",
      benefits: (solution.benefits || []).join("\n"),
      isFeatured: Boolean(solution.isFeatured),
      isActive: solution.isActive !== false,
      order: solution.order || 0,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this solution?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/solutions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setMessage(data.message);
      await loadSolutions();
    } catch (error) {
      setMessage(error.message || "Unable to delete solution");
    }
  }

  const filteredSolutions = solutions.filter(
    (solution) =>
      audienceFilter === "All" ||
      solution.audience === audienceFilter
  );

  return (
    <main className="solution-admin">
      <header className="solution-header">
        <div>
          <p>AVXBS ADMIN PANEL</p>
          <h1>Solution Management</h1>
          <span>Welcome, {admin?.name || "Admin"}</span>
        </div>

        <button onClick={() => window.location.href = "/admin/dashboard"}>
          Back to Dashboard
        </button>
      </header>

      {message && <div className="solution-message">{message}</div>}

      <section className="solution-form-card">
        <h2>{editingId ? "Edit Solution" : "Add New Solution"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="solution-form-grid">
            <label>
              Solution Name *
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Water Softener System"
              />
            </label>

            <label>
              Audience *
              <select
                name="audience"
                value={form.audience}
                onChange={handleChange}
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </label>

            <label>
              Category *
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option>Water Softening</option>
                <option>Filtration & Purity</option>
                <option>Drinking Water & RO</option>
                <option>Water Treatment</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Badge
              <input
                name="badge"
                value={form.badge}
                onChange={handleChange}
                placeholder="Most Popular"
              />
            </label>

            <label className="solution-full">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                placeholder="Enter solution description"
              />
            </label>

            <label className="solution-full">
              Image URL
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </label>

            <label className="solution-full">
              Benefits (one benefit per line)
              <textarea
                name="benefits"
                value={form.benefits}
                onChange={handleChange}
                rows="4"
                placeholder={"Removes hardness\nImproves water quality"}
              />
            </label>

            <label>
              Display Order
              <input
                type="number"
                name="order"
                value={form.order}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="solution-checkboxes">
            <label>
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
              />
              Featured Solution
            </label>

            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              Active / Visible
            </label>
          </div>

          <div className="solution-actions">
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                ? "Update Solution"
                : "Add Solution"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="solution-list-section">
        <div className="solution-list-heading">
          <h2>Existing Solutions ({filteredSolutions.length})</h2>

          <select
            value={audienceFilter}
            onChange={(event) => setAudienceFilter(event.target.value)}
          >
            <option value="All">All Solutions</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>

        {loading ? (
          <p>Loading solutions...</p>
        ) : filteredSolutions.length === 0 ? (
          <p>No solutions added yet.</p>
        ) : (
          <div className="solution-admin-grid">
            {filteredSolutions.map((solution) => (
              <article className="solution-admin-card" key={solution._id}>
                {solution.image && (
                  <img src={solution.image} alt={solution.name} />
                )}

                <div className="solution-card-content">
                  <span>{solution.audience}</span>
                  <h3>{solution.name}</h3>
                  <p>{solution.category}</p>
                  <p>{solution.description}</p>

                  <div className="solution-card-status">
                    {solution.isActive ? "Active" : "Inactive"}
                    {solution.isFeatured && " · Featured"}
                  </div>

                  <div className="solution-card-buttons">
                    <button onClick={() => handleEdit(solution)}>
                      Edit
                    </button>

                    <button onClick={() => handleDelete(solution._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

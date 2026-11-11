
"use client";

import { useEffect, useState } from "react";
import "./residential.css";

export default function ResidentialClient() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    price: "",
  });

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load products.");
      }

      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to add product.");
      }

      setSuccess("Residential product added successfully!");

      setForm({
        name: "",
        description: "",
        image: "",
        price: "",
      });

      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="residential-page">
      <header className="residential-header">
        <div>
          <span>AVXBS ADMINISTRATION</span>
          <h1>Residential Management</h1>
          <p>Manage your residential products.</p>
        </div>

        <a href="/admin/dashboard">← Dashboard</a>
      </header>

      {error && <div className="residential-error">{error}</div>}
      {success && <div className="residential-success">{success}</div>}

      <section className="residential-layout">
        <div className="residential-form-card">
          <h2>Add Residential Product</h2>
          <p>Enter the product information below.</p>

          <form onSubmit={handleSubmit}>
            <label>Product Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
            />

            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter product description"
              rows={4}
            />

            <label>Image URL</label>
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="Enter image URL"
            />

            <label>Price</label>
            <input
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="Enter price"
            />

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add Product"}
            </button>
          </form>
        </div>

        <div className="residential-products-card">
          <div className="residential-products-heading">
            <div>
              <h2>Residential Products</h2>
              <p>{products.length} products found</p>
            </div>

            <button onClick={loadProducts}>Refresh</button>
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <div className="residential-empty">
              <span>◇</span>
              <h3>No Products Yet</h3>
              <p>Add your first residential product.</p>
            </div>
          ) : (
            <div className="residential-product-list">
              {products.map((product) => (
                <article
                  className="residential-product"
                  key={product._id}
                >
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="residential-placeholder">◇</div>
                  )}

                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.description || "No description"}</p>
                    <small>₹{product.price || 0}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

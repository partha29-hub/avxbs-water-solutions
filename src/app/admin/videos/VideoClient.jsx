"use client";

import { useEffect, useRef, useState } from "react";
import "./videos.css";

export default function VideoClient({ admin }) {
  const [media, setMedia] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [replacement, setReplacement] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [draggedId, setDraggedId] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const fileRef = useRef(null);
  const editFileRef = useRef(null);

  const getType = (item) =>
    item.mediaType || item.resourceType || "video";

  const getUrl = (item) => item.videoUrl || item.mediaUrl || "";

  async function loadMedia() {
    try {
      setFetching(true);
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load media.");
      setMedia(data.media || data.videos || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadMedia();
  }, []);

  const total = media.length;
  const active = media.filter((item) => item.isActive).length;
  const photos = media.filter((item) => getType(item) === "image").length;
  const videos = media.filter((item) => getType(item) === "video").length;

  const filtered = media.filter((item) => {
    const matchesSearch =
      (item.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filter === "all" ||
      (filter === "active" && item.isActive) ||
      (filter === "inactive" && !item.isActive);

    const matchesType =
      typeFilter === "all" || getType(item) === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  async function handleUpload(e) {
    e.preventDefault();

    if (!title.trim() || files.length === 0) {
      setMessage("Enter a title and select at least one photo or video.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description);
      files.forEach((file) => formData.append("media", file));

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed.");

      setTitle("");
      setDescription("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      setMessage(data.message || "Media uploaded successfully.");
      await loadMedia();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(item) {
    setEditing(item);
    setEditTitle(item.title || "");
    setEditDescription(item.description || "");
    setReplacement(null);
    setMessage("");
  }

  function closeEdit() {
    if (updating) return;
    setEditing(null);
    setReplacement(null);
    if (editFileRef.current) editFileRef.current.value = "";
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editing || !editTitle.trim()) return;

    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append("id", editing._id);
      formData.append("title", editTitle.trim());
      formData.append("description", editDescription);
      if (replacement) formData.append("media", replacement);

      const response = await fetch("/api/admin/media", {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed.");

      setEditing(null);
      setReplacement(null);
      setMessage(data.message || "Media updated.");
      await loadMedia();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUpdating(false);
    }
  }

  async function toggleStatus(item) {
    try {
      const response = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          id: item._id,
          isActive: !item.isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Status update failed.");

      const updated = data.media || data.video;
      setMedia((old) => old.map((x) => x._id === item._id ? updated : x));
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Permanently delete this media file?")) return;

    try {
      const response = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed.");

      setMessage(data.message);
      await loadMedia();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleDrop(targetId) {
    if (!draggedId || draggedId === targetId) return;

    const reordered = [...media];
    const from = reordered.findIndex((item) => item._id === draggedId);
    const to = reordered.findIndex((item) => item._id === targetId);
    if (from < 0 || to < 0) return;

    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setMedia(reordered);
    setDraggedId(null);
    saveOrder(reordered);
  }

  async function saveOrder(reordered) {
    try {
      setSavingOrder(true);
      const response = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          media: reordered.map((item) => ({ id: item._id })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Order save failed.");
      setMessage("Media order saved.");
    } catch (error) {
      setMessage(error.message);
      await loadMedia();
    } finally {
      setSavingOrder(false);
    }
  }

  const canReorder = filter === "all" && typeFilter === "all" && !search.trim();

  return (
    <div className="video-management">
      <div className="video-page-header">
        <div>
          <p className="video-eyebrow">CONTENT MANAGEMENT</p>
          <h1>Media Management</h1>
          <p>Manage photos and videos displayed in your website hero slider.</p>
        </div>
        <div className="video-count">
          <strong>{total}</strong>
          <span>Total Media</span>
        </div>
      </div>

      <div className="video-stats-grid">
        <div className="video-stat-card"><span>Total Media</span><strong>{total}</strong></div>
        <div className="video-stat-card"><span>Videos</span><strong>{videos}</strong></div>
        <div className="video-stat-card"><span>Photos</span><strong>{photos}</strong></div>
        <div className="video-stat-card"><span>Active</span><strong>{active}</strong></div>
      </div>

      <div className="video-upload-card">
        <h2>Upload Photos & Videos</h2>
        <p>Select multiple photos and videos. They will appear in the same website slider.</p>

        <form onSubmit={handleUpload}>
          <label htmlFor="mediaTitle">Title</label>
          <input
            id="mediaTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter media title"
            required
          />

          <label htmlFor="mediaDescription">Description</label>
          <textarea
            id="mediaDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
          />

          <label htmlFor="mediaFiles">Select Photos / Videos</label>
          <input
            ref={fileRef}
            id="mediaFiles"
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />

          {files.length > 0 && (
            <p className="selected-video">{files.length} file(s) selected</p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload Media"}
          </button>
        </form>
      </div>

      <div className="video-library">
        <div className="video-library-header">
          <div>
            <h2>Media Library</h2>
            <p>Search, filter, edit, activate and reorder your media.</p>
          </div>
          <button onClick={loadMedia} disabled={fetching}>
            {fetching ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="video-toolbar">
          <input
            type="search"
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Media</option>
            <option value="image">Photos</option>
            <option value="video">Videos</option>
          </select>

          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {canReorder && media.length > 1 && (
          <p className="video-reorder-hint">Drag and drop cards to change slider order.</p>
        )}

        {savingOrder && <p className="video-message">Saving order...</p>}

        {fetching ? (
          <p className="video-empty">Loading media...</p>
        ) : filtered.length === 0 ? (
          <div className="video-empty"><h3>No media found</h3><p>Upload photos or videos to get started.</p></div>
        ) : (
          <div className="video-grid">
            {filtered.map((item) => {
              const type = getType(item);
              return (
                <div
                  className={`video-card ${draggedId === item._id ? "video-card-dragging" : ""}`}
                  key={item._id}
                  draggable={canReorder && !savingOrder}
                  onDragStart={() => setDraggedId(item._id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(item._id)}
                  onDragEnd={() => setDraggedId(null)}
                >
                  {type === "image" ? (
                    <img src={getUrl(item)} alt={item.title} />
                  ) : (
                    <video src={getUrl(item)} controls preload="metadata" />
                  )}

                  <div className="video-card-content">
                    <h3>{item.title}</h3>
                    <p>{type === "image" ? "Photo" : "Video"} · {item.isActive ? "Active" : "Inactive"}</p>
                    {item.description && <p>{item.description}</p>}

                    <div className="video-status-control">
                      <span>{item.isActive ? "Visible on website" : "Hidden from website"}</span>
                      <button
                        type="button"
                        className={`video-status-btn ${item.isActive ? "is-active" : "is-inactive"}`}
                        onClick={() => toggleStatus(item)}
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>

                    <div className="video-action-buttons">
                      <button type="button" onClick={() => openEdit(item)}>Edit / Replace</button>
                      <button type="button" className="video-edit-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <div className="video-modal-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeEdit();
        }}>
          <div className="video-edit-modal">
            <div className="video-modal-header">
              <div><span>MEDIA SETTINGS</span><h2>Edit Media</h2></div>
              <button type="button" className="video-modal-close" onClick={closeEdit} disabled={updating}>×</button>
            </div>

            <form onSubmit={handleUpdate}>
              <label>Title</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />

              <label>Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />

              <div className="video-current-preview">
                <p>Current {getType(edit) === "image" ? "Photo" : "Video"}</p>
                {getType(edit) === "image" ? (
                  <img src={getUrl(edit)} alt={edit.title} />
                ) : (
                  <video src={getUrl(edit)} controls preload="metadata" />
                )}
              </div>

              <label>Replace with photo or video (optional)</label>
              <input
                ref={editFileRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                onChange={(e) => setReplacement(e.target.files?.[0] || null)}
              />

              {replacement && <p className="selected-video">New file: {replacement.name}</p>}

              <div className="video-modal-actions">
                <button type="button" className="video-cancel-btn" onClick={closeEdit} disabled={updating}>Cancel</button>
                <button type="submit" disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && <p className="video-message" role="status">{message}</p>}
    </div>
  );
}
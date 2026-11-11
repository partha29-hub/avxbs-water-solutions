/**
 * AVXBS Centralized API Client
 * Facilitates REST communication between Next.js frontend and Express backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const defaultHeaders = {
    Accept: "application/json",
  };

  if (!(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // Retrieve token if stored client-side
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("avxbs_admin_token");
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const config = {
    ...options,
    credentials: "include", // Send and receive cookies across origins
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  // Parse JSON response
  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (data && data.message) ||
      (typeof data === "string" && data) ||
      `HTTP Error ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: "GET", ...options }),
  post: (endpoint, body, options) =>
    request(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  put: (endpoint, body, options) =>
    request(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  patch: (endpoint, body, options) =>
    request(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  delete: (endpoint, body, options) =>
    request(endpoint, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  // Admin Auth Services
  auth: {
    login: (credentials) => api.post("/api/admin/login", credentials),
    logout: () => api.post("/api/admin/logout"),
    getAccount: () => api.get("/api/admin/account"),
    updateAccount: (profile) => api.put("/api/admin/account", profile),
    updatePassword: (passwords) => api.patch("/api/admin/account/password", passwords),
    getStats: () => api.get("/api/admin/dashboard-stats"),
  },

  // Public Endpoints
  public: {
    getSolutions: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/public/solutions${qs ? `?${qs}` : ""}`);
    },
    getHighlights: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/public/highlights${qs ? `?${qs}` : ""}`);
    },
    getTabs: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/public/dynamic-tabs${qs ? `?${qs}` : ""}`);
    },
    getFormConfig: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/form-config${qs ? `?${qs}` : ""}`);
    },
    getMedia: () => api.get("/api/media"),
    getAssistance: () => api.get("/api/assistance"),
    getFooter: () => api.get("/api/footer"),
    getAbout: () => api.get("/api/public/about"),
  },

  // Inquiries
  inquiries: {
    submit: (inquiryData) => api.post("/api/inquiries", inquiryData),
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/admin/inquiries${qs ? `?${qs}` : ""}`);
    },
    getById: (id) => api.get(`/api/admin/inquiries/${id}`),
    updateStatus: (id, status) =>
      api.patch(`/api/admin/inquiries/${id}/status`, { status }),
    delete: (id) => api.delete(`/api/admin/inquiries/${id}`),
    exportUrl: (section) => {
      const qs = section && section !== "All" ? `?section=${encodeURIComponent(section)}` : "";
      return `${API_BASE_URL}/api/admin/inquiries/export${qs}`;
    },
  },

  // Admin Modules
  admin: {
    tabs: {
      getAll: () => api.get("/api/admin/dynamic-tabs"),
      create: (tab) => api.post("/api/admin/dynamic-tabs", tab),
      update: (tab) => api.put("/api/admin/dynamic-tabs", tab),
      delete: (id) => api.delete("/api/admin/dynamic-tabs", { id }),
    },
    formBuilder: {
      getConfig: () => api.get("/api/admin/form-builder"),
      updateConfig: (data) => api.put("/api/admin/form-builder", data),
    },
    solutions: {
      getAll: () => api.get("/api/admin/solutions"),
      create: (solution) => api.post("/api/admin/solutions", solution),
      update: (solution) => api.put("/api/admin/solutions", solution),
      delete: (id) => api.delete("/api/admin/solutions", { id }),
    },
    products: {
      getAll: () => api.get("/api/admin/products"),
      create: (product) => api.post("/api/admin/products", product),
      update: (product) => api.put("/api/admin/products", product),
      delete: (id) => api.delete("/api/admin/products", { id }),
    },
    media: {
      getAll: () => api.get("/api/admin/media"),
      upload: (formData) => api.post("/api/admin/media", formData),
      update: (formData) => api.put("/api/admin/media", formData),
      patch: (patchData) => api.patch("/api/admin/media", patchData),
      delete: (id) => api.delete(`/api/admin/media?id=${encodeURIComponent(id)}`),
    },
    footer: {
      get: () => api.get("/api/admin/footer"),
      update: (footerData) => api.put("/api/admin/footer", footerData),
    },
    assistance: {
      get: () => api.get("/api/admin/assistance"),
      update: (assistanceData) => api.put("/api/admin/assistance", assistanceData),
    },
    highlights: {
      getAll: () => api.get("/api/admin/highlights"),
      create: (data) => api.post("/api/admin/highlights", data),
      update: (data) => api.put("/api/admin/highlights", data),
      delete: (id) => api.delete("/api/admin/highlights", { id }),
      uploadImage: (formData) => api.post("/api/admin/highlights/upload", formData),
    },
    about: {
      get: () => api.get("/api/admin/about"),
      update: (data) => api.put("/api/admin/about", data),
      uploadImage: (formData) => api.post("/api/admin/about/image", formData),
      deleteImage: () => api.delete("/api/admin/about/image"),
    },
  },
};

export default api;


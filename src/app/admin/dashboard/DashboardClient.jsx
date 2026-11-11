

"use client";

import { useState, useEffect } from "react";
import "./dashboard.css";
import { Globe, ExternalLink } from "lucide-react";

const menu = [
  { name: "Dashboard", icon: "⌂" },
  { name: "Dynamic Tabs", icon: "▤" },
  { name: "Form Builder", icon: "✎" },
  { name: "Customer Inquiries", icon: "✉" },
  { name: "Excel Export", icon: "▧" },
  { name: "Banner Management", icon: "▷" },
  { name: "Footer Management", icon: "☷" },
  { name: "Account Settings", icon: "⚙" },
];

function formatRole(role) {
  if (!role || role === "admin") return "Administrator";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function DashboardClient({ admin: initialAdmin }) {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Stable initial values prevent server/client hydration mismatch.
  const [adminProfile, setAdminProfile] = useState({
    name: "Administrator",
    email: "",
    role: "Administrator",
  });

  const [stats, setStats] = useState({
    totalSolutions: 0,
    totalInquiries: 0,
    totalVideos: 0,
    activeTabs: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Load server-provided profile after initial hydration.
    if (initialAdmin) {
      setAdminProfile({
        name: initialAdmin.name || "Administrator",
        email: initialAdmin.email || "",
        role: formatRole(initialAdmin.role),
      });
    }

    async function loadAdminProfile() {
      try {
        const response = await fetch("/api/admin/account", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok && data.success && data.admin) {
          setAdminProfile({
            name: data.admin.name || "Administrator",
            email: data.admin.email || "",
            role: formatRole(data.admin.role),
          });
        }
      } catch (error) {
        console.error("Admin Profile Error:", error);
      }
    }

    async function loadStats() {
      try {
        const response = await fetch("/api/admin/dashboard-stats", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load statistics");
        }

        setStats(data.stats);
      } catch (error) {
        console.error("Dashboard Statistics Error:", error);
      } finally {
        setStatsLoading(false);
      }
    }

    loadAdminProfile();
    loadStats();
  }, [initialAdmin]);

  function handleMenu(name) {
    setSidebarOpen(false);

    const routes = {
  Dashboard: "/admin/dashboard",
  "Video Management": "/admin/videos",
  "Footer Management": "/admin/footer",
  "Account Settings": "/admin/settings",
  "Form Builder": "/admin/form-builder",
  "Dynamic Tabs": "/admin/dynamic-tabs",
};

    if (routes[name]) {
      window.location.href = routes[name];
      return;
    }

    setActive(name);
    alert(name + " section will be developed next.");
  }

  const statCards = [
    {
      title: "Total Solutions",
      value: stats.totalSolutions,
      icon: "◇",
    },
    {
      title: "Total Inquiries",
      value: stats.totalInquiries,
      icon: "✉",
    },
    {
      title: "Website Videos",
      value: stats.totalVideos,
      icon: "▷",
    },
    {
      title: "Active Tabs",
      value: stats.activeTabs,
      icon: "▤",
    },
  ];

  // Keep dynamic profile values stable until after hydration.
  const adminName = mounted
    ? adminProfile.name || "Administrator"
    : "Administrator";

  const adminRole = mounted
    ? formatRole(adminProfile.role)
    : "Administrator";

  const adminInitial = adminName.trim().charAt(0).toUpperCase() || "A";

  return (
    <main className="avx-admin">
      {/* Sidebar */}
      <aside className={`avx-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="avx-brand">
          <span>AVXBS</span>
          <small>ADMIN PANEL</small>
        </div>

        <div className="avx-menu-label">MAIN MENU</div>

        <nav>
          {menu.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`avx-menu-item ${
                active === item.name ? "active" : ""
              }`}
              onClick={() => handleMenu(item.name)}
            >
              <span className="avx-menu-icon">{item.icon}</span>
              {item.name}
              {active === item.name && <span className="active-dot" />}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="avx-logout"
          onClick={async () => {
            try {
              const response = await fetch("/api/admin/logout", {
                method: "POST",
              });

              if (response.ok) {
                window.location.replace("/admin/login");
              } else {
                alert("Logout failed. Please try again.");
              }
            } catch {
              alert("Unable to connect to the server.");
            }
          }}
        >
          ↪ Sign Out
        </button>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="avx-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Dashboard */}
      <section className="avx-main">
        {/* Topbar */}
        <header className="avx-topbar">
          <button
            type="button"
            className="avx-mobile-menu"
            onClick={() => setSidebarOpen((previous) => !previous)}
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          >
            <span aria-hidden="true">☰</span>
          </button>

          <div>
            <h2>Admin Dashboard</h2>
            <p>Manage your AVXBS website</p>
          </div>

          {/* Dynamic Admin Profile */}
          <div className="avx-profile">
            <div className="avx-avatar">{adminInitial}</div>

            <div className="avx-profile-details">
              <strong>{adminName}</strong>
              <small>{adminRole}</small>
            </div>
          </div>
        </header>

        <div className="avx-content">
          {/* Welcome Section */}
          <div className="avx-welcome">
            <div className="avx-welcome-text">
              <span>OVERVIEW</span>

              <h1>Welcome back, {adminName}!</h1>

              <p>Here's what's happening with your website.</p>
            </div>

            <div className="avx-welcome-actions">
              <div className="avx-date">AVXBS MANAGEMENT</div>

              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                className="view-website-btn"
              >
                <Globe size={19} />
                View Website
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Statistics */}
          <div className="avx-stats">
            {statCards.map((stat, index) => (
              <article
                className="avx-stat-card"
                key={stat.title}
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                <div className="avx-stat-top">
                  <span>{stat.title}</span>
                  <div className="avx-stat-icon">{stat.icon}</div>
                </div>

                <h2>{statsLoading ? "..." : stat.value}</h2>

                <small>
                  {statsLoading ? "Loading..." : "Live database data"}
                </small>
              </article>
            ))}
          </div>

          {/* Quick Management */}
          <div className="avx-bottom-grid">
            <article className="avx-panel">
              <h3>Quick Management</h3>
              <p>Choose a section to manage your website.</p>

              <div className="avx-quick-links">
                {menu.slice(1).map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => handleMenu(item.name)}
                  >
                    <span>{item.icon}</span>
                    {item.name}
                    <b>→</b>
                  </button>
                ))}
              </div>
            </article>

            <article className="avx-panel avx-info">
              <div className="avx-info-icon">✦</div>

              <h3>AVXBS Control Center</h3>

              <p>
                Manage products, website content, inquiries,
                videos and dynamic forms from one place.
              </p>

              <span>YOUR WEBSITE · YOUR CONTROL</span>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";
import "./login.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWebsiteLogo, DEFAULT_AVXBS_LOGO } from "../../../utils/useWebsiteLogo";

export default function AdminLogin() {
  const router = useRouter();
  const dynamicLogo = useWebsiteLogo();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Login failed.");
        return;
      }

      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("avxbs_admin_token", data.token);
      }

      router.replace("/admin/dashboard");
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="avx-login">
      <div className="avx-login-card">
        <div className="avx-login-logo">
          <img
            src={dynamicLogo || DEFAULT_AVXBS_LOGO}
            alt="AVXBS"
            onError={(e) => {
              if (e.currentTarget.src !== DEFAULT_AVXBS_LOGO) {
                e.currentTarget.src = DEFAULT_AVXBS_LOGO;
              }
            }}
            style={{
              height: "48px",
              width: "auto",
              maxWidth: "160px",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
            }}
          />
        </div>

        <p className="avx-login-tagline">
          ADMINISTRATION PANEL
        </p>

        <h1>Welcome Back</h1>
        <p className="avx-login-description">
          Sign in to manage your AVXBS website.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />

          <label htmlFor="password">Password</label>

          <div className="avx-password-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <button
              type="button"
              className="avx-show-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <div className="avx-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="avx-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="avx-login-footer">
          © {new Date().getFullYear()} AVXBS. All rights reserved.
        </p>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";

export const DEFAULT_AVXBS_LOGO = "/assets/logo/avxbs-logo.png";
const STORAGE_KEY = "avxbs_website_logo";
const EVENT_NAME = "avxbs_logo_changed";

/**
 * Global notification helper to notify all mounted components & browser tabs
 * when the logo is uploaded, replaced, or restored to default.
 */
export function notifyLogoChange(newUrl) {
  const url = newUrl || DEFAULT_AVXBS_LOGO;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, url);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: url }));
    } catch {
      // Ignore local storage quota errors
    }
  }
}

/**
 * Universal hook to fetch and synchronize the active website logo
 * - Hydration safe (defaults to official brand asset on initial render)
 * - Automatically reflects updates in real-time across the navbar, footer, admin sidebar, and headers
 */
export function useWebsiteLogo() {
  const [logoUrl, setLogoUrl] = useState(DEFAULT_AVXBS_LOGO);

  useEffect(() => {
    let isMounted = true;

    // 1. Immediately read cached logo if available
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached && cached.trim()) {
        setLogoUrl(cached.trim());
      }
    } catch {}

    // 2. Fetch fresh logo from public API
    fetch("/api/public/logo", {
      cache: "no-store",
      headers: { Pragma: "no-cache" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.success) return;
        const freshUrl = data.logoUrl || DEFAULT_AVXBS_LOGO;
        setLogoUrl(freshUrl);
        try {
          localStorage.setItem(STORAGE_KEY, freshUrl);
        } catch {}
      })
      .catch(() => {
        // Fall back gracefully to current or default logo
      });

    // 3. Listen to logo updates across tabs and components
    const handleLogoUpdate = (e) => {
      const updated = e?.detail || localStorage.getItem(STORAGE_KEY) || DEFAULT_AVXBS_LOGO;
      if (isMounted) {
        setLogoUrl(updated);
      }
    };

    window.addEventListener(EVENT_NAME, handleLogoUpdate);
    window.addEventListener("storage", handleLogoUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener(EVENT_NAME, handleLogoUpdate);
      window.removeEventListener("storage", handleLogoUpdate);
    };
  }, []);

  return logoUrl;
}


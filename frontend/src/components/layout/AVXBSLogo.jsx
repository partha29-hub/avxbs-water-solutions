"use client";

import React from "react";
import { useWebsiteLogo, DEFAULT_AVXBS_LOGO } from "../../utils/useWebsiteLogo";

/**
 * Official AVXBS Brand Logo Component
 * - Dynamically renders the active website logo from Admin Website Logo Management
 * - Falls back to /assets/logo/avxbs-logo.png if not configured or reset
 * - Strictly maintains proper aspect ratio without distortion or stretching
 * - Responsive across desktop navbar, mobile navigation, footer and admin panels
 */
export default function AVXBSLogo({
  className = "",
  animated = true,
  alt = "AVXBS Water Solutions",
  src = null,
}) {
  const dynamicLogo = useWebsiteLogo();
  const currentLogo = src || dynamicLogo || DEFAULT_AVXBS_LOGO;

  return (
    <div
      className={`avxbs-animated-logo-root ${className} ${
        animated ? "is-animated" : ""
      }`}
      role="img"
      aria-label={alt}
    >
      <img
        src={currentLogo}
        alt={alt}
        className="avxbs-official-logo-img"
        loading="eager"
        decoding="async"
        onError={(e) => {
          if (e.currentTarget.src !== DEFAULT_AVXBS_LOGO) {
            e.currentTarget.src = DEFAULT_AVXBS_LOGO;
          }
        }}
      />
      {animated && (
        <span className="avxbs-logo-ambient-glow" aria-hidden="true" />
      )}
    </div>
  );
}


"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  ArrowUp,
} from "lucide-react";
import AVXBSLogo from "./AVXBSLogo";

const iconMap = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  x: null,
  twitter: null,
};

const fallback = {
  brandTagline: "PURE WATER. BETTER LIVING.",
  topMessage: "Engineering Pure Water for Homes & Enterprises",
  aboutHeading: "About AVXBS",
  aboutDescription:
    "AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.",
  highlightText: "Smart Water Treatment Solutions",
  contactHeading: "Contact & Support",
  contactDescription: "We're here to help you.",
  addressHeading: "Headquarters",
  address: "[Official Company Address - To Be Provided]",
  phoneHeading: "Helpline",
  phone: "[Toll-Free / Support Phone - To Be Provided]",
  emailHeading: "Email",
  email: "[Official Support Email - To Be Provided]",
  legalLinks: [
    { label: "Privacy Policy", url: "#privacy" },
    { label: "Legal", url: "#terms" },
    { label: "Warranty & Service", url: "#warranty" },
  ],
  socialLinks: [
    { platform: "Facebook", url: "#facebook" },
    { platform: "X", url: "#x" },
    { platform: "Instagram", url: "#instagram" },
    { platform: "YouTube", url: "#youtube" },
    { platform: "LinkedIn", url: "#linkedin" },
  ],
  copyrightCompany: "AVXBS Solutions",
  rightsText: "All Rights Reserved.",
  showCopyrightYear: true,
};

export default function Footer() {
  const [footer, setFooter] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    async function loadFooter() {
      try {
        const response = await fetch("/api/footer", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok && data.success && !cancelled) {
          setFooter({ ...fallback, ...data.footer });
        }
      } catch (error) {
        console.error("Footer loading error:", error);
      }
    }

    loadFooter();

    return () => {
      cancelled = true;
    };
  }, []);

  const year = new Date().getFullYear();

  function renderSocialIcon(platform) {
    const key = platform.toLowerCase();
    const Icon = iconMap[key];

    if (key === "x" || key === "twitter") {
      return <span className="avx-bottom-x">𝕏</span>;
    }

    if (Icon) return <Icon />;

    return <span>{platform.slice(0, 1).toUpperCase()}</span>;
  }

  return (
    <footer className="avx-footer">
      <div className="avx-footer-glow" aria-hidden="true" />

      <div className="avx-footer-container">

        {/* TOP BRAND STRIP */}
        <div className="avx-footer-top">
          <div className="avx-footer-brand">
            <div className="avx-footer-logo">
              <AVXBSLogo animated={true} />
            </div>

            <span className="avx-footer-brand-tag">
              {footer.brandTagline}
            </span>
          </div>

          <div className="avx-footer-top-message">
            <span className="avx-footer-status-dot" />
            {footer.topMessage}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="avx-footer-grid">

          <div className="avx-footer-column avx-footer-about">
            <h3 className="avx-footer-heading">
              {footer.aboutHeading}
            </h3>

            <p className="avx-footer-description">
              {footer.aboutDescription}
            </p>

            <div className="avx-footer-highlight">
              <span className="avx-highlight-line" />
              {footer.highlightText}
            </div>
          </div>

          <div className="avx-footer-column avx-footer-contact">
            <h3 className="avx-footer-heading">
              {footer.contactHeading}
            </h3>

            <p className="avx-footer-muted">
              {footer.contactDescription}
            </p>

            <div className="avx-contact-list">

              <div className="avx-contact-item">
                <div className="avx-contact-icon">
                  <MapPin size={19} />
                </div>
                <div>
                  <strong>{footer.addressHeading}</strong>
                  <p>{footer.address}</p>
                </div>
              </div>

              <div className="avx-contact-item">
                <div className="avx-contact-icon">
                  <Phone size={19} />
                </div>
                <div>
                  <strong>{footer.phoneHeading}</strong>
                  <p>{footer.phone}</p>
                </div>
              </div>

              <div className="avx-contact-item">
                <div className="avx-contact-icon">
                  <Mail size={19} />
                </div>
                <div>
                  <strong>{footer.emailHeading}</strong>
                  <p>{footer.email}</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="avx-footer-bottom">

          <div className="avx-footer-legal">
            <span>
              © {footer.showCopyrightYear ? year : ""}{" "}
              {footer.copyrightCompany}.
            </span>

            <span>{footer.rightsText}</span>

            {(footer.legalLinks || []).map((link, index) => (
              <a key={index} href={link.url || "#"}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="avx-footer-bottom-right">
            <div className="avx-bottom-socials">
              {(footer.socialLinks || []).map((social, index) => (
                <a
                  key={index}
                  href={social.url || "#"}
                  aria-label={social.platform}
                  target={
                    social.url?.startsWith("http") ? "_blank" : undefined
                  }
                  rel={
                    social.url?.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                >
                  {renderSocialIcon(social.platform)}
                </a>
              ))}
            </div>

            <button
              type="button"
              className="avx-back-top"
              aria-label="Back to top"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

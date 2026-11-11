"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import "./reviews.css";
import {
  Star,
  Quote,
  Sparkles,
  CheckCircle2,
  Home,
  Building2,
} from "lucide-react";

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [settings, setSettings] = useState({
    heading: "REVIEWS",
    subtitle: "From our clients",
    backgroundImageUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Drag and Swipe tracking refs
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragEndX = useRef(0);
  const hasDragged = useRef(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch approved & active reviews from MongoDB
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reviews", { cache: "no-store" });
      if (!res.ok) {
        console.warn(`[Reviews] API returned HTTP ${res.status}`);
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.warn(`[Reviews] Expected JSON, got ${contentType}`);
        return;
      }
      const data = await res.json();
      if (data?.success) {
        setReviews(data.reviews || []);
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            heading: data.settings.heading || "REVIEWS",
            subtitle: data.settings.subtitle || "From our clients",
            backgroundImageUrl: data.settings.backgroundImageUrl || "",
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch customer reviews:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();

    // Listen for real-time updates from admin panel across browser tabs
    const handleStorageChange = (e) => {
      if (e.key === "avxbs_review_updated") {
        fetchReviews();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", fetchReviews);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", fetchReviews);
    };
  }, [fetchReviews]);

  const totalReviews = reviews.length;

  // Duplicate array if fewer than 5 reviews to ensure all 5 card slots (-2, -1, 0, 1, 2) exist
  let displayItems = reviews;
  if (totalReviews > 1 && totalReviews < 5) {
    const multiplier = Math.ceil(6 / totalReviews);
    displayItems = Array(multiplier).fill(reviews).flat();
  }
  const count = displayItems.length;

  // Move active index by relative delta
  const handleMove = useCallback((delta) => {
    if (count <= 1) return;
    setActiveIndex((prev) => {
      const next = prev + delta;
      return (next % count + count) % count;
    });
  }, [count]);

  const handlePrev = useCallback(() => handleMove(-1), [handleMove]);
  const handleNext = useCallback(() => handleMove(1), [handleMove]);

  // Clamp active index if reviews length changes
  useEffect(() => {
    if (count > 0 && activeIndex >= count) {
      setActiveIndex(0);
    }
  }, [count, activeIndex]);

  // Automatic sliding (5.5s), paused on hover, drag or touch
  useEffect(() => {
    if (totalReviews <= 1 || isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5500);

    return () => clearInterval(interval);
  }, [totalReviews, isPaused, handleNext]);

  // Mouse Drag handlers
  const handleMouseDown = (e) => {
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    dragEndX.current = e.clientX;
    setIsPaused(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    dragEndX.current = e.clientX;
    if (Math.abs(e.clientX - dragStartX.current) > 8) {
      hasDragged.current = true;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = dragStartX.current - dragEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTimeout(() => {
      hasDragged.current = false;
    }, 60);
    setIsPaused(false);
  };

  const handleMouseLeave = () => {
    if (isDragging.current) {
      handleMouseUp();
    }
    setIsPaused(false);
  };

  // Touch Swipe handlers
  const handleTouchStart = (e) => {
    setIsPaused(true);
    hasDragged.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    if (Math.abs(e.touches[0].clientX - touchStartX.current) > 8) {
      hasDragged.current = true;
    }
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTimeout(() => {
      hasDragged.current = false;
    }, 60);
    setIsPaused(false);
  };

  // Side card click navigation (ignored if dragged)
  const handleCardClick = (delta) => {
    if (hasDragged.current) return;
    handleMove(delta);
  };

  // Section Background style
  const sectionBgStyle = settings.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%), url(${settings.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      };

  return (
    <section
      className="avx-reviews-module"
      style={sectionBgStyle}
      id="client-reviews"
      aria-label="Client Testimonials"
    >
      <div className="reviews-container">
        {/* Section Header */}
        <header className="reviews-header">
          <p className="reviews-subtitle">{settings.subtitle || "From our clients"}</p>
          <h2 className="reviews-title">{settings.heading || "REVIEWS"}</h2>
          <div className="reviews-header-divider" />
        </header>

        {/* Carousel Content */}
        {loading ? (
          <div className="reviews-loading">
            <div className="loading-spinner" />
            <p>Loading verified client reviews...</p>
          </div>
        ) : totalReviews === 0 ? (
          <div className="reviews-empty-state">
            <Quote size={28} className="empty-quote-icon" />
            <h3>Client Testimonials Coming Soon</h3>
            <p>
              Our verified client reviews and project experiences are being updated. Check
              back shortly!
            </p>
          </div>
        ) : (
          <div
            className="reviews-carousel-wrapper"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* 3D 5-Card Carousel Stage */}
            <div className="premium-reviews-stage">
              {displayItems.map((rev, idx) => {
                // Circular offset calculation relative to activeIndex
                let diff = idx - (activeIndex % count);
                if (diff < -Math.floor(count / 2)) diff += count;
                if (diff > Math.floor(count / 2)) diff -= count;

                // Determine card position role across 5 visible slots
                let roleClass = "card-hidden";
                let isClickable = false;
                let clickDelta = 0;

                if (diff === 0) {
                  roleClass = "card-center-active";
                } else if (diff === -1) {
                  roleClass = "card-neighbor-left card-neighbor-left-1";
                  isClickable = true;
                  clickDelta = -1;
                } else if (diff === -2) {
                  roleClass = "card-neighbor-left card-neighbor-left-2";
                  isClickable = true;
                  clickDelta = -2;
                } else if (diff === 1) {
                  roleClass = "card-neighbor-right card-neighbor-right-1";
                  isClickable = true;
                  clickDelta = 1;
                } else if (diff === 2) {
                  roleClass = "card-neighbor-right card-neighbor-right-2";
                  isClickable = true;
                  clickDelta = 2;
                }

                const ratingCount = Math.min(5, Math.max(1, rev.rating || 5));
                const initials = rev.name
                  ? rev.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "C";

                const isCenter = diff === 0;
                const isCommercial =
                  rev.category?.toLowerCase() === "commercial";

                // Customer type label
                const customerType = rev.company
                  ? rev.company
                  : isCommercial
                  ? "Commercial Client"
                  : "Residential Homeowner";

                return (
                  <article
                    key={rev._id ? `${rev._id}-${idx}` : idx}
                    className={`review-carousel-card ${roleClass}`}
                    onClick={isClickable ? () => handleCardClick(clickDelta) : undefined}
                    aria-hidden={!isCenter}
                    tabIndex={isCenter ? 0 : isClickable ? 0 : -1}
                    role={isClickable ? "button" : undefined}
                    aria-label={isClickable ? `Select review from ${rev.name}` : undefined}
                  >
                    {/* 1. Card Top Header: Horizontally aligned in one row */}
                    <div className="card-top-header">
                      <div className="header-left-group">
                        {/* Quote icon inside light-blue rounded square */}
                        <div className="quote-square-box">
                          <Quote size={20} className="quote-square-icon" />
                        </div>

                        {/* Customer profile image or circular initials avatar */}
                        <div className="card-avatar-circle">
                          {rev.photoUrl ? (
                            <img
                              src={rev.photoUrl}
                              alt={rev.name}
                              className="card-avatar-img"
                              loading="lazy"
                            />
                          ) : (
                            <span className="card-avatar-initials">{initials}</span>
                          )}
                        </div>

                        {/* Customer Name & Customer Type */}
                        <div className="customer-text-block">
                          <h3 className="card-customer-name">{rev.name}</h3>
                          <p className="card-customer-type">{customerType}</p>
                        </div>
                      </div>

                      {/* Header Right: Badges (Featured & Category) */}
                      <div className="header-badges-group">
                        {rev.isFeatured && (
                          <span className="card-badge badge-featured">
                            <Sparkles size={11} className="badge-icon" />
                            <span>Featured</span>
                          </span>
                        )}

                        <span className="card-badge badge-category">
                          {isCommercial ? (
                            <>
                              <Building2 size={11} className="badge-icon" />
                              <span>Commercial</span>
                            </>
                          ) : (
                            <>
                              <Home size={11} className="badge-icon" />
                              <span>Residential</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* 2. Card Middle: Feedback Message */}
                    <div className="card-middle-body">
                      <p className="card-review-text">“{rev.message}”</p>
                    </div>

                    {/* 3. Card Bottom: Five Yellow Stars & Verified Badge */}
                    <div className="card-bottom-footer">
                      {/* Five yellow stars on left */}
                      <div
                        className="card-star-rating"
                        aria-label={`${ratingCount} out of 5 stars`}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= ratingCount
                                ? "star-icon star-gold"
                                : "star-icon star-muted"
                            }
                          />
                        ))}
                      </div>

                      {/* Verified Badge on bottom-right */}
                      {rev.isVerified !== false && (
                        <span className="card-badge badge-verified">
                          <CheckCircle2 size={13} className="badge-icon" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


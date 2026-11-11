"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import SubmissionCounter from "./SubmissionCounter";
import { ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import InquiryForm from "../inquiry/InquiryForm";

export default function SolutionSlider({
  counter,
  onOpenContact,
  onSubmitSuccess,
  selectedType = "Residential",
  selectedCategory = "",
}) {
  const [solutions, setSolutions] = useState([]);
  const [activeSolutionIndex, setActiveSolutionIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const dragStartX = useRef(0);
  const dragOffsetRef = useRef(0);

  const TRIGGER_THRESHOLD = 80;

  // LOAD ALL ACTIVE SOLUTIONS
  useEffect(() => {
    let isMounted = true;

    async function loadSolutions() {
      try {
        setLoading(true);

        const response = await fetch("/api/public/solutions", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load solutions");
        }

        if (isMounted) {
          setSolutions(data.solutions || []);
        }
      } catch (error) {
        console.error("Public Solutions Error:", error);

        if (isMounted) {
          setSolutions([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSolutions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter solutions according to audience and selectedCategory
  const activeSolutions = useMemo(() => {
    const audienceSolutions = solutions.filter((sol) => {
      const aud = String(sol.audience || "").toLowerCase();
      const type = String(selectedType || "").toLowerCase();
      return aud === type || aud === "both" || !sol.audience;
    });

    const normalizedCategory = String(selectedCategory || "").trim().toLowerCase();

    if (normalizedCategory) {
      // Find matching solutions in the current audience first
      const catInAudience = audienceSolutions.filter((sol) => {
        const cat = String(sol.category || "").trim().toLowerCase();
        const name = String(sol.name || "").trim().toLowerCase();
        return cat === normalizedCategory || name === normalizedCategory;
      });

      if (catInAudience.length > 0) return catInAudience;

      // Fallback: search all solutions for this category
      const catInAll = solutions.filter((sol) => {
        const cat = String(sol.category || "").trim().toLowerCase();
        const name = String(sol.name || "").trim().toLowerCase();
        return cat === normalizedCategory || name === normalizedCategory;
      });

      if (catInAll.length > 0) return catInAll;
    }

    // When no category is selected, default to the solutions of the selected audience
    return audienceSolutions.length > 0 ? audienceSolutions : solutions;
  }, [solutions, selectedType, selectedCategory]);

  // RESET ON TAB OR CATEGORY CHANGE
  useEffect(() => {
    setActiveSolutionIndex(0);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setIsDragging(false);
  }, [selectedCategory, selectedType]);

  // Escape key closes expanded inquiry form
  useEffect(() => {
    if (!isExpanded) return;

    const handleGlobalKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isExpanded]);

  // CURRENT MATCHING SOLUTION
  const currentSolution = activeSolutions[activeSolutionIndex] || activeSolutions[0];

  // TITLE TO DISPLAY:
  // Use selectedCategory if user clicked a specific tab/category;
  // otherwise default dynamically to the current solution's name or category.
  const displayTitle = useMemo(() => {
    if (selectedCategory && selectedCategory.trim()) {
      return selectedCategory.trim();
    }
    if (currentSolution) {
      return currentSolution.category || currentSolution.name;
    }
    return selectedType === "Commercial" ? "Commercial Treatment" : "Water Softener";
  }, [selectedCategory, currentSolution, selectedType]);

  const titleParts = displayTitle.split(/\s+/).filter(Boolean);
  const titleFirst = titleParts[0] || (selectedType === "Commercial" ? "COMMERCIAL" : "WATER");
  const titleRemaining = titleParts.slice(1).join(" ") || (selectedType === "Commercial" ? "SOLUTIONS" : "SOFTENER");

  // Click Here action: smoothly expands the card horizontally with the inline inquiry panel
  const handleClickHere = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsExpanded(true);
  };

  // Expand / Collapse controls
  const handleExpand = (e) => {
    handleClickHere(e);
  };

  const handleCollapse = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsExpanded(false);
  };

  // Solution Carousel Controls
  const handlePrevSolution = (e) => {
    e.stopPropagation();
    if (activeSolutions.length <= 1) return;
    setActiveSolutionIndex((prev) => (prev - 1 + activeSolutions.length) % activeSolutions.length);
  };

  const handleNextSolution = (e) => {
    e.stopPropagation();
    if (activeSolutions.length <= 1) return;
    setActiveSolutionIndex((prev) => (prev + 1) % activeSolutions.length);
  };

  // MOUSE DRAG (Only active when collapsed)
  const handleMouseDown = (e) => {
    if (loading || isExpanded || e.button !== 0) return;

    setIsDragging(true);
    dragStartX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isExpanded) return;

    const delta = e.clientX - dragStartX.current;

    if (delta > 0) {
      const nextOffset = Math.min(delta, 160);
      dragOffsetRef.current = nextOffset;
      setDragOffset(nextOffset);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || isExpanded) return;

    setIsDragging(false);

    if (dragOffsetRef.current >= TRIGGER_THRESHOLD) {
      handleExpand();
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
  };

  // TOUCH DRAG (Only active when collapsed)
  const handleTouchStart = (e) => {
    if (loading || isExpanded) return;

    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isExpanded) return;

    const delta = e.touches[0].clientX - dragStartX.current;

    if (delta > 0) {
      const nextOffset = Math.min(delta, 160);
      dragOffsetRef.current = nextOffset;
      setDragOffset(nextOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isExpanded) return;

    setIsDragging(false);

    if (dragOffsetRef.current >= TRIGGER_THRESHOLD) {
      handleExpand();
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
  };

  // GLOBAL MOUSE UP
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  // KEYBOARD ACCESS
  const handleKeyDown = (e) => {
    if (isExpanded) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCollapse(e);
      }
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleExpand(e);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrevSolution(e);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNextSolution(e);
    }
  };

  return (
    <section className="slider-section">
      <div className="slider-container-wrap">
        <div
          className={`solution-slider-card ${
            isDragging ? "dragging" : ""
          } ${isExpanded ? "is-expanded" : ""}`}
          role="group"
          aria-label={`${displayTitle || selectedType} solution inquiry`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="card-top-gradient-line"
            aria-hidden="true"
          />

          {/* 1. LEFT SECTION: Fixed Current User Access Counter */}
          <div className="slider-left-column">
            <SubmissionCounter count={counter} />
          </div>

          {/* 2. CENTER SECTION: White Title Card */}
          <div
            className="slider-center-column"
            style={{
              transform: isExpanded
                ? "none"
                : `translateX(${dragOffset}px)`,
              transition: isDragging
                ? "none"
                : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              className="inset-white-card"
              style={{ position: "relative" }}
            >
              <div
                className="card-border-gradient"
                aria-hidden="true"
              />

              {loading ? (
                <h2 className="solution-title">
                  Loading...
                </h2>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: "8px" }}>
                  {activeSolutions.length > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevSolution}
                      aria-label="Previous solution"
                      style={{
                        background: "transparent",
                        border: 0,
                        cursor: "pointer",
                        color: "#94a3b8",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "50%",
                        transition: "color 0.2s, background-color 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#0072ce"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}

                  <h2 className="solution-title" style={{ margin: 0 }}>
                    <span className="title-water">
                      {titleFirst.toUpperCase()}{" "}
                    </span>
                    <span className="title-softner">
                      {titleRemaining.toUpperCase()}
                    </span>
                  </h2>

                  {activeSolutions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleNextSolution}
                      aria-label="Next solution"
                      style={{
                        background: "transparent",
                        border: 0,
                        cursor: "pointer",
                        color: "#94a3b8",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "50%",
                        transition: "color 0.2s, background-color 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#0072ce"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. RIGHT SECTION: Click Here button (when closed) OR Inquiry Form (when expanded) */}
          <div className="slider-right-column">
            {!isExpanded ? (
              <button
                type="button"
                className="action-trigger-btn"
                aria-label={`Open ${displayTitle} inquiry form`}
                disabled={loading}
                onClick={handleClickHere}
              >
                <div className="chevron-icon-box">
                  <ChevronsRight
                    className="chevrons-icon"
                    size={32}
                  />
                </div>

                <span className="click-here-text">
                  Click Here
                </span>
              </button>
            ) : (
              <div className="hero-expanded-form-panel">
                <InquiryForm
                  isOpen={true}
                  productName={currentSolution?.name || displayTitle}
                  solutionId={
                    currentSolution?._id
                      ? String(currentSolution._id)
                      : currentSolution?.solutionId
                      ? String(currentSolution.solutionId)
                      : ""
                  }
                  tabId={currentSolution?.tabId ? String(currentSolution.tabId) : ""}
                  tabName={currentSolution?.tabName || ""}
                  category={currentSolution?.category || displayTitle}
                  initialType={selectedType}
                  onSubmitSuccess={(data) => {
                    if (onSubmitSuccess) onSubmitSuccess(data);
                  }}
                  onClose={handleCollapse}
                  isInline={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

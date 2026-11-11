"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Search, X, ArrowRight, Droplets } from "lucide-react";
import AVXBSLogo from "./AVXBSLogo";

/**
 * Responsive Enterprise Header with Multi-Criteria Live Search and
 * Full-Page Navigation for Residential and Commercial Views.
 */
export default function Header({
  navigate,
  currentPath = "/",
  selectedType = "Residential",
  onSelectType,
  onOpenInquiry,
  searchQuery = "",
  onSelectCategory,
  onSearchChange,
  assistance,
  activeTab = null,
  onSelectTab,
}) {
  const [isThreeDotMenuOpen, setIsThreeDotMenuOpen] = useState(false);

  // Search solutions state
  const [allSolutions, setAllSolutions] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);

  const threeDotMenuRef = useRef(null);
  const headerRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Fetch all active solutions once for instant, live search indexing
  useEffect(() => {
    let isMounted = true;
    async function fetchSolutions() {
      try {
        const response = await fetch("/api/public/solutions", { cache: "no-store" });
        const data = await response.json();
        if (isMounted && data.success && Array.isArray(data.solutions)) {
          setAllSolutions(data.solutions);
        }
      } catch (error) {
        console.error("Header Search: Unable to preload solutions:", error);
      }
    }
    fetchSolutions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter solutions matching query across all fields
  const cleanQuery = searchQuery.trim().toLowerCase();
  const searchResults = cleanQuery
    ? allSolutions.filter((s) => {
        const name = (s.name || "").toLowerCase();
        const cat = (s.category || "").toLowerCase();
        const aud = (s.audience || "").toLowerCase();
        const desc = (s.description || "").toLowerCase();
        const badge = (s.badge || "").toLowerCase();
        const benefits = Array.isArray(s.benefits)
          ? s.benefits.join(" ").toLowerCase()
          : "";
        return (
          name.includes(cleanQuery) ||
          cat.includes(cleanQuery) ||
          aud.includes(cleanQuery) ||
          desc.includes(cleanQuery) ||
          badge.includes(cleanQuery) ||
          benefits.includes(cleanQuery)
        );
      })
    : [];

  const showSearchDropdown = isSearchFocused && cleanQuery.length > 0;

  // Navigation click handler (for mobile/touch and clicks)
  const handleNavClick = (e, menuType) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsThreeDotMenuOpen(false);
    setIsSearchFocused(false);

    if (onSelectTab) {
      onSelectTab(menuType);
    }
  };

  // Hover handler: immediately open the complete page when mouse enters tab
  const handleNavMouseEnter = (menuType) => {
    if (activeTab !== menuType && onSelectTab) {
      setIsThreeDotMenuOpen(false);
      setIsSearchFocused(false);
      onSelectTab(menuType);
    }
  };

  // Keyboard navigation for search suggestions
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSearchDropdown && activeSearchIndex >= 0 && searchResults[activeSearchIndex]) {
        handleSelectSolution(searchResults[activeSearchIndex]);
      } else if (searchResults.length > 0) {
        handleSelectSolution(searchResults[0]);
      } else {
        if (onSelectTab) onSelectTab(null);
        setIsSearchFocused(false);
        if (navigate && currentPath !== "/") {
          navigate("/");
        }
        setTimeout(() => {
          document.querySelector(".slider-section")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 200);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSearchIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSearchIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === "Escape") {
      setIsSearchFocused(false);
    }
  };

  // Search button click handler: exits Residential/Commercial, returns to homepage, scrolls to solutions
  const handleSearchButtonClick = () => {
    setIsThreeDotMenuOpen(false);
    if (onSelectTab) {
      onSelectTab(null);
    }
    if (navigate && currentPath !== "/") {
      navigate("/");
    }
    setIsSearchFocused(true);
    setTimeout(() => {
      document.querySelector(".slider-section")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);
  };

  // When user focuses on search input while on Residential/Commercial, exit to homepage
  const handleSearchInputFocus = () => {
    setIsSearchFocused(true);
    if (activeTab && onSelectTab) {
      onSelectTab(null);
    }
    if (navigate && currentPath !== "/") {
      navigate("/");
    }
  };

  // Selecting a matching solution opens its inquiry drawer and updates view
  const handleSelectSolution = (solution) => {
    setIsSearchFocused(false);
    setActiveSearchIndex(-1);
    onSearchChange?.("");

    if (onSelectTab) {
      onSelectTab(null);
    }
    if (navigate && currentPath !== "/") {
      navigate("/");
    }
    if (onSelectType && solution.audience) {
      onSelectType(solution.audience);
    }
    if (onSelectCategory && solution.category) {
      onSelectCategory(solution.category);
    }
    if (onOpenInquiry) {
      onOpenInquiry(solution);
    }

    setTimeout(() => {
      document.querySelector(".slider-section")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 250);
  };

  // Close dropdowns & search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const inThreeDot =
        threeDotMenuRef.current && threeDotMenuRef.current.contains(event.target);
      const inSearch =
        searchContainerRef.current && searchContainerRef.current.contains(event.target);

      if (!inThreeDot) {
        setIsThreeDotMenuOpen(false);
      }
      if (!inSearch) {
        setIsSearchFocused(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsThreeDotMenuOpen(false);
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleThreeDotClick = (e, path) => {
    e.preventDefault();
    setIsThreeDotMenuOpen(false);
    setIsSearchFocused(false);
    if (onSelectTab) {
      onSelectTab(null);
    }
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  const handleLogoClick = (e) => {
    if (e) {
      e.preventDefault();
    }
    setIsThreeDotMenuOpen(false);
    setIsSearchFocused(false);
    if (onSelectTab) {
      onSelectTab(null);
    }
    if (navigate) {
      navigate("/");
    } else {
      window.location.href = "/";
    }
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <header className="site-header" ref={headerRef}>
      <div className="header-container">
        {/* Left Side: Brand Logo + Primary Navigation Links */}
        <div className="header-left-group">
          {/* AVXBS Brand Logo */}
          <a
            href="/"
            className="header-logo-link"
            aria-label="AVXBS Home"
            onClick={handleLogoClick}
          >
            <AVXBSLogo className="header-logo-img" animated={true} />
          </a>

          {/* Primary Navigation Links */}
          <nav
            className="header-primary-nav"
            aria-label="Water Treatment Solutions"
          >
            <button
              type="button"
              className={`primary-nav-btn ${
                activeTab === "residential" ? "is-active" : ""
              }`}
              onMouseEnter={() => handleNavMouseEnter("residential")}
              onClick={(e) => handleNavClick(e, "residential")}
              aria-expanded={activeTab === "residential"}
            >
              <span className="nav-btn-label">Residential</span>
              <span className="nav-btn-indicator" aria-hidden="true" />
            </button>

            <button
              type="button"
              className={`primary-nav-btn ${
                activeTab === "commercial" ? "is-active" : ""
              }`}
              onMouseEnter={() => handleNavMouseEnter("commercial")}
              onClick={(e) => handleNavClick(e, "commercial")}
              aria-expanded={activeTab === "commercial"}
            >
              <span className="nav-btn-label">Commercial</span>
              <span className="nav-btn-indicator" aria-hidden="true" />
            </button>
          </nav>
        </div>

        {/* Right-Side Search + Three-Dot Menu */}
        <div className="header-right-group">
          {/* FULLY FUNCTIONAL SEARCH SOLUTIONS */}
          <div
            className="search-pill-wrapper header-search-wrapper"
            ref={searchContainerRef}
            style={{ position: "relative" }}
          >
            <button
              type="button"
              className="header-search-btn"
              onClick={handleSearchButtonClick}
              aria-label="Search solutions"
              title="Search solutions"
              style={{
                background: "transparent",
                border: "none",
                padding: "0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              <Search className="search-icon" size={16} />
            </button>
            <span className="search-separator">|</span>

            <input
              type="text"
              className="search-pill-input"
              placeholder="Search solutions..."
              value={searchQuery}
              onFocus={handleSearchInputFocus}
              onChange={(e) => {
                onSearchChange?.(e.target.value);
                setIsSearchFocused(true);
                setActiveSearchIndex(-1);
              }}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search water treatment solutions"
              aria-expanded={showSearchDropdown}
              aria-autocomplete="list"
            />

            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  onSearchChange?.("");
                  setIsSearchFocused(false);
                }}
                aria-label="Clear search query"
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 2px",
                }}
              >
                <X size={14} />
              </button>
            )}

            {/* Matching Suggestions Floating Dropdown */}
            {showSearchDropdown && (
              <div className="header-search-dropdown" role="listbox">
                <div className="search-dropdown-header">
                  <span>
                    MATCHING SOLUTIONS ({searchResults.length})
                  </span>
                  <small>Use ↑↓ to navigate, ↵ to select</small>
                </div>

                {searchResults.length === 0 ? (
                  <div className="search-empty-state">
                    <p>
                      No solutions matching "<strong>{searchQuery}</strong>".
                    </p>
                    <small>
                      Try searching for 'Softener', 'WTP', 'Water', or 'Commercial'.
                    </small>
                  </div>
                ) : (
                  <div className="search-results-list">
                    {searchResults.map((solution, index) => {
                      const isHighlighted = index === activeSearchIndex;
                      return (
                        <div
                          key={solution._id || index}
                          className={`search-result-item ${
                            isHighlighted ? "highlighted" : ""
                          }`}
                          role="option"
                          aria-selected={isHighlighted}
                          onMouseEnter={() => setActiveSearchIndex(index)}
                          onClick={() => handleSelectSolution(solution)}
                        >
                          <div className="search-item-icon">
                            <Droplets size={16} color="#0072CE" />
                          </div>
                          <div className="search-item-info">
                            <div className="search-item-top">
                              <strong className="search-item-name">
                                {solution.name}
                              </strong>
                              <span className="search-item-badge">
                                {solution.audience} · {solution.category}
                              </span>
                            </div>
                            {solution.description && (
                              <p className="search-item-desc">
                                {solution.description}
                              </p>
                            )}
                          </div>
                          <ArrowRight
                            size={14}
                            className="search-item-arrow"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Three-Dot Menu */}
          <div className="header-menu-wrapper" ref={threeDotMenuRef}>
            <button
              type="button"
              className={`header-menu-btn ${
                isThreeDotMenuOpen ? "active" : ""
              }`}
              aria-label="Toggle navigation menu"
              aria-expanded={isThreeDotMenuOpen}
              aria-haspopup="true"
              onClick={() => {
                setIsThreeDotMenuOpen((prev) => !prev);
              }}
            >
              <MoreVertical size={24} className="menu-icon" />
            </button>

            {/* Dropdown Menu */}
            <div
              className={`navbar-dropdown-menu ${
                isThreeDotMenuOpen ? "open" : ""
              }`}
              role="menu"
              aria-label="Site Navigation"
            >
              <a
                href="/about"
                role="menuitem"
                className={`dropdown-menu-item ${
                  currentPath === "/about" ? "active" : ""
                }`}
                onClick={(e) => handleThreeDotClick(e, "/about")}
              >
                About Us
              </a>

              <a
                href="/contact"
                role="menuitem"
                className={`dropdown-menu-item ${
                  currentPath === "/contact" ? "active" : ""
                }`}
                onClick={(e) => handleThreeDotClick(e, "/contact")}
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

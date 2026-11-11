"use client";

import React, { useState, useEffect } from "react";

import {
  Droplets,
  Layers,
  ShieldCheck,
  Award,
  ChevronRight,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  Home,
  ClipboardCheck,
  Building2,
  Gauge,
  Image as ImageIcon,
} from "lucide-react";

/* =========================
   RESIDENTIAL MENU DATA
========================= */

export const RESIDENTIAL_MENU_DATA = {
  scope: "Residential",
  badge: "Residential Water Treatment",
  description:
    "Advanced ion-exchange softening, filtration, and whole-home scale prevention engineered for luxury living.",

  highlights: [
    {
      title: "Protect Your Home",
      description:
        "Complete water treatment solutions for your entire home.",
      icon: Home,
      image:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&auto=format&fit=crop&q=80",
      label: "Whole Home",
      buttonText: "Explore",
      buttonAction: "inquiry",
    },
    {
      title: "Free Water Testing",
      description:
        "Understand your water hardness before choosing a system.",
      icon: ClipboardCheck,
      image:
        "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80",
      label: "Free Assessment",
      buttonText: "Book Test",
      buttonAction: "inquiry",
    },
  ],

  columns: [],

  featured: {
    title: "Featured: System 06 Softener",
    subtitle: "99.8% Scale Reduction • 50% Lower Salt Consumption",
    description:
      "Intelligent microprocessor demand-initiated regeneration with premium food-grade uniform bead cation resins.",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80",
    primaryCta: "Residential Inquiry",
    secondaryCta: "Contact Support",
    primaryProduct: "Water Softener",
    secondaryPath: "/contact",
  },
};

/* =========================
   COMMERCIAL MENU DATA
========================= */

export const COMMERCIAL_MENU_DATA = {
  scope: "Commercial",
  badge: "Commercial & Industrial Platforms",
  description:
    "Heavy-duty continuous ion-exchange softening, commercial RO plants, and custom industrial water engineering.",

  highlights: [
    {
      title: "Industrial Solutions",
      description:
        "Engineered water treatment for demanding operations.",
      icon: Building2,
      image:
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&auto=format&fit=crop&q=80",
      label: "Commercial",
      buttonText: "Explore",
      buttonAction: "inquiry",
    },
    {
      title: "Site Water Audit",
      description:
        "Get an engineering assessment for your facility.",
      icon: Gauge,
      image:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80",
      label: "On-Site Audit",
      buttonText: "Request Audit",
      buttonAction: "inquiry",
    },
  ],

  columns: [],

  featured: {
    title: "Featured: Duplex Softening Plant",
    subtitle: "Zero Downtime • Automated Valve Manifold",
    description:
      "Engineered for hotels, hospitals, food processing, and industrial boiler feed requiring continuous softened output.",
    image:
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&auto=format&fit=crop&q=80",
    primaryCta: "Request Commercial Audit",
    secondaryCta: "Contact Engineering",
    primaryProduct: "Commercial Softening Plant",
    secondaryPath: "/contact",
  },
};

/* =========================
   MEGA MENU COMPONENT
========================= */

// Module-level in-memory cache to prevent repeated fetching and avoid page flashing
const megaMenuCache = {
  solutions: null,
  assistance: null,
  highlights: {
    Residential: null,
    Commercial: null,
  },
  tabs: {
    Residential: null,
    Commercial: null,
  },
};

export default function MegaMenu({
  activeMenu,
  onClose,
  onSelectType,
  onSelectCategory,
  onOpenInquiry,
  navigate,
  assistance: propAssistance,
}) {
  const currentAudience =
    activeMenu === "commercial" ? "Commercial" : "Residential";

  const [cachedData, setCachedData] = useState(() => ({
    solutions: megaMenuCache.solutions || [],
    highlights: megaMenuCache.highlights[currentAudience] || [],
    tabs: megaMenuCache.tabs[currentAudience] || [],
    assistance: megaMenuCache.assistance || null,
  }));

  const [menuLoading, setMenuLoading] = useState(false);

  // Sync state immediately from memory cache when activeMenu switches
  useEffect(() => {
    if (!activeMenu) return;
    const aud = activeMenu === "commercial" ? "Commercial" : "Residential";
    setCachedData({
      solutions: megaMenuCache.solutions || [],
      highlights: megaMenuCache.highlights[aud] || [],
      tabs: megaMenuCache.tabs[aud] || [],
      assistance: megaMenuCache.assistance || null,
    });
  }, [activeMenu]);

  /* =========================
     LOAD MENU DATA (SAFE FETCH WITH CACHING)
  ========================= */

  useEffect(() => {
    if (!activeMenu) return;

    const audience =
      activeMenu === "commercial" ? "Commercial" : "Residential";
    const otherAudience =
      audience === "Commercial" ? "Residential" : "Commercial";

    let cancelled = false;

    async function fetchApiData(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`[MegaMenu API] Request failed: ${url} | HTTP ${response.status}`);
          return null;
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          console.warn(`[MegaMenu API] Non-JSON response from ${url} | Content-Type: ${contentType}`);
          return null;
        }

        return await response.json();
      } catch (error) {
        console.warn(`[MegaMenu API] Fetch exception for ${url}:`, error.message);
        return null;
      }
    }

    async function ensureDataLoaded() {
      const needsSolutions = !megaMenuCache.solutions;
      const needsAssistance = !megaMenuCache.assistance && !propAssistance;
      const needsHighlights = !megaMenuCache.highlights[audience];
      const needsTabs = !megaMenuCache.tabs[audience];

      // If everything needed for this tab is already cached, do not reload or flash
      if (!needsSolutions && !needsHighlights && !needsTabs && !needsAssistance) {
        return;
      }

      // Only show loading indicator if we don't have any cached data yet for this tab
      if (needsHighlights || needsTabs) {
        setMenuLoading(true);
      }

      try {
        const promises = [];

        if (needsSolutions) {
          promises.push(
            fetchApiData("/api/public/solutions").then((res) => {
              if (res?.success && Array.isArray(res.solutions)) {
                megaMenuCache.solutions = res.solutions;
              }
            })
          );
        }

        if (needsAssistance) {
          promises.push(
            fetchApiData("/api/assistance").then((res) => {
              if (res && (res.departments || res.enabled !== undefined)) {
                megaMenuCache.assistance = res;
              }
            })
          );
        }

        if (needsHighlights) {
          promises.push(
            fetchApiData(`/api/public/highlights?audience=${encodeURIComponent(audience)}`).then((res) => {
              if (res?.success && Array.isArray(res.highlights)) {
                megaMenuCache.highlights[audience] = res.highlights;
              }
            })
          );
        }

        if (needsTabs) {
          promises.push(
            fetchApiData(`/api/public/dynamic-tabs?audience=${encodeURIComponent(audience)}`).then((res) => {
              if (res?.success && Array.isArray(res.tabs)) {
                megaMenuCache.tabs[audience] = res.tabs;
              }
            })
          );
        }

        await Promise.all(promises);

        if (!cancelled) {
          setCachedData({
            solutions: megaMenuCache.solutions || [],
            assistance: megaMenuCache.assistance || null,
            highlights: megaMenuCache.highlights[audience] || [],
            tabs: megaMenuCache.tabs[audience] || [],
          });
        }

        // Prefetch other audience in background so next tab switch is instant
        if (!megaMenuCache.highlights[otherAudience]) {
          fetchApiData(`/api/public/highlights?audience=${encodeURIComponent(otherAudience)}`).then((res) => {
            if (res?.success && Array.isArray(res.highlights)) {
              megaMenuCache.highlights[otherAudience] = res.highlights;
            }
          });
        }
        if (!megaMenuCache.tabs[otherAudience]) {
          fetchApiData(`/api/public/dynamic-tabs?audience=${encodeURIComponent(otherAudience)}`).then((res) => {
            if (res?.success && Array.isArray(res.tabs)) {
              megaMenuCache.tabs[otherAudience] = res.tabs;
            }
          });
        }
      } catch (error) {
        console.error("Mega Menu API Error:", error);
      } finally {
        if (!cancelled) {
          setMenuLoading(false);
        }
      }
    }

    ensureDataLoaded();

    return () => {
      cancelled = true;
    };
  }, [activeMenu]);

  const dynamicSolutions = megaMenuCache.solutions || cachedData.solutions || [];
  const dynamicHighlights =
    (activeMenu === "commercial"
      ? megaMenuCache.highlights.Commercial
      : megaMenuCache.highlights.Residential) ||
    cachedData.highlights ||
    [];
  const dynamicTabs =
    (activeMenu === "commercial"
      ? megaMenuCache.tabs.Commercial
      : megaMenuCache.tabs.Residential) ||
    cachedData.tabs ||
    [];
  const assistanceData = megaMenuCache.assistance || cachedData.assistance || null;

  if (!activeMenu) return null;

  /* =========================
     BASE MENU DATA
  ========================= */

  const baseData =
    activeMenu === "residential"
      ? RESIDENTIAL_MENU_DATA
      : COMMERCIAL_MENU_DATA;

  /* =========================
     ICON CONFIGURATION
  ========================= */

  const iconMap = {
    Home,
    ClipboardCheck,
    Droplets,
    Layers,
    ShieldCheck,
    Building2,
    Gauge,
    Sparkles,
    Award,
    CheckCircle2,
    house: Home,
    "clipboard-check": ClipboardCheck,
    droplets: Droplets,
    layers: Layers,
    "shield-check": ShieldCheck,
    building: Building2,
    gauge: Gauge,
    sparkles: Sparkles,
    award: Award,
  };

  const categoryIcons = [
    Droplets,
    Layers,
    ShieldCheck,
    Award,
  ];

  const DEFAULT_TAB_DESCRIPTIONS = {
    "water softening": "Advanced ion-exchange softening for scale-free soft water.",
    "plumbing solutions": "Complete pressure boosting and specialized plumbing design.",
    "modular kitchen": "Compact under-sink filtration and pure drinking water.",
    "deep well water softener": "Engineered for high hardness, iron, and borewell water.",
    "sand & carbon filter": "Multi-media filtration for turbidity, odor, and chlorine.",
    "hard water conditioner": "Non-chemical catalytic scale prevention for pipes.",
    "automatic backwash": "Automated self-cleaning cycles for uninterrupted operation.",
    "ro & uv plant": "Commercial-grade membrane purification with UV sterilization.",
    "industrial ro plant": "High-recovery reverse osmosis systems for heavy applications.",
    "duplex water softener": "Continuous zero-downtime alternating softening platform.",
    "commercial sand filter": "High-flow multimedia pressure filtration for sediment.",
    "activated carbon filter": "Industrial scale organic compound and chlorine absorption.",
    "uv disinfection systems": "High-intensity ultraviolet microbial sterilization units.",
    "hydro-pneumatic systems": "Precision constant-pressure multi-pump distribution.",
    "effluent & sewage treatment": "Turnkey regulatory-compliant waste water recycling.",
    "boiler feed softening": "Zero-scale demineralization feed for commercial boilers.",
  };

  const DEFAULT_RESIDENTIAL_TABS = [
    { id: "res-softening", title: "Water Softening", description: "Advanced ion-exchange softening for scale-free soft water." },
    { id: "res-plumbing", title: "Plumbing Solutions", description: "Complete pressure boosting and specialized plumbing design." },
    { id: "res-kitchen", title: "Modular Kitchen", description: "Compact under-sink filtration and pure drinking water." },
    { id: "res-deepwell", title: "Deep Well Water Softener", description: "Engineered for high hardness, iron, and borewell water." },
    { id: "res-sandcarbon", title: "Sand & Carbon Filter", description: "Multi-media filtration for turbidity, odor, and chlorine." },
    { id: "res-conditioner", title: "Hard Water Conditioner", description: "Non-chemical catalytic scale prevention for pipes." },
    { id: "res-backwash", title: "Automatic Backwash", description: "Automated self-cleaning cycles for uninterrupted operation." },
    { id: "res-rouv", title: "RO & UV Plant", description: "Commercial-grade membrane purification with UV sterilization." },
  ];

  const DEFAULT_COMMERCIAL_TABS = [
    { id: "comm-ro", title: "Industrial RO Plant", description: "High-recovery reverse osmosis systems for heavy applications." },
    { id: "comm-softener", title: "Duplex Water Softener", description: "Continuous zero-downtime alternating softening platform." },
    { id: "comm-sand", title: "Commercial Sand Filter", description: "High-flow multimedia pressure filtration for sediment." },
    { id: "comm-carbon", title: "Activated Carbon Filter", description: "Industrial scale organic compound and chlorine absorption." },
    { id: "comm-uv", title: "UV Disinfection Systems", description: "High-intensity ultraviolet microbial sterilization units." },
    { id: "comm-pumps", title: "Hydro-Pneumatic Systems", description: "Precision constant-pressure multi-pump distribution." },
    { id: "comm-treatment", title: "Effluent & Sewage Treatment", description: "Turnkey regulatory-compliant waste water recycling." },
    { id: "comm-boiler", title: "Boiler Feed Softening", description: "Zero-scale demineralization feed for commercial boilers." },
  ];

  const getTabDescription = (title, customDesc) => {
    if (customDesc && customDesc.trim()) return customDesc;
    const clean = (title || "").toLowerCase().trim();
    for (const [key, desc] of Object.entries(DEFAULT_TAB_DESCRIPTIONS)) {
      if (clean.includes(key) || key.includes(clean)) return desc;
    }
    return "Engineered water treatment systems for complete protection.";
  };

  /* =========================
     DYNAMIC SOLUTION TABS (MATCH REFERENCE IMAGE 2)
  ========================= */

  const rawTabs =
    dynamicTabs.length > 0
      ? dynamicTabs
      : activeMenu === "residential"
      ? DEFAULT_RESIDENTIAL_TABS
      : DEFAULT_COMMERCIAL_TABS;

  const columns = rawTabs.map((tab, index) => {
    const IconComp =
      categoryIcons[index % categoryIcons.length];

    return {
      id: tab._id || tab.id || `tab-${index}`,
      title: tab.title,
      description: getTabDescription(tab.title, tab.description),
      icon: IconComp,
    };
  });

  /* =========================
     FEATURED SOLUTION
  ========================= */

  const featuredSolution =
    dynamicSolutions.find(
      (solution) =>
        solution.isFeatured &&
        solution.audience === currentAudience
    ) || null;

  /* =========================
     HIGHLIGHTS (ONLY HIGHLIGHTS)
  ========================= */

  const highlights =
    dynamicHighlights.length > 0
      ? dynamicHighlights.map((highlight) => ({
          ...highlight,
          label: highlight.subtitle || highlight.label || "",
          icon: iconMap[highlight.icon] || Sparkles,
        }))
      : baseData.highlights;

  /* =========================
     FEATURED DISPLAY DATA
  ========================= */

  const featured = featuredSolution
    ? {
        ...baseData.featured,
        title: `Featured: ${featuredSolution.name}`,
        subtitle:
          featuredSolution.badge || "Featured Solution",
        description: featuredSolution.description,
        image:
          featuredSolution.image || baseData.featured.image,
        primaryProduct: featuredSolution.name,
      }
    : baseData.featured;

  const data = {
    ...baseData,
    columns,
    highlights,
    featured,
  };

  /* =========================
     WHATSAPP INTEGRATION HELPER
  ========================= */

  const openWhatsApp = (customMessage) => {
    const activeAssistance = propAssistance || assistanceData;
    const departments = activeAssistance?.departments || [];
    const dept =
      departments.find(
        (item) =>
          item.name === activeAssistance?.defaultDepartment && item.isActive
      ) || departments.find((item) => item.isActive);

    const phone = String(dept?.phone || "919692625703").replace(/\D/g, "");
    const message =
      customMessage ||
      activeAssistance?.openingMessage ||
      `Hello AVXBS, I am interested in your ${data.scope} Water Treatment Solutions. Please contact me.`;

    const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappURL, "_blank", "noopener,noreferrer");
  };

  /* =========================
     SELECT SOLUTION CATEGORY
  ========================= */
  const handleCategoryClick = (category) => {
    onSelectType?.(data.scope);
    onSelectCategory?.(category.title);
    onClose?.();

    setTimeout(() => {
      document
        .querySelector(".slider-section")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 300);
  };

  /* =========================
     TASK 3: DIRECT SOLUTION INQUIRY (WHATSAPP)
  ========================= */

  const handleDirectSolutionInquiry = () => {
    const message = `Hello AVXBS, I am interested in your ${data.scope} Water Treatment Solutions. Please contact me.`;
    openWhatsApp(message);
  };

  /* =========================
     TASK 4: FEATURED BUTTON 1 (INQUIRY DRAWER)
  ========================= */

  const handlePrimaryFeaturedClick = () => {
    if (onSelectType) {
      onSelectType(data.scope);
    }

    if (onOpenInquiry) {
      if (featuredSolution) {
        onOpenInquiry({
          ...featuredSolution,
          product: featuredSolution.name,
          audience: data.scope,
        });
      } else {
        const matchingTab = dynamicTabs.find((t) =>
          /water softening|soften/i.test(t.title)
        ) || dynamicTabs[0];

        onOpenInquiry({
          name: data.featured.primaryProduct,
          product: data.featured.primaryProduct,
          audience: data.scope,
          category: matchingTab ? matchingTab.title : "Water Softening",
          tabId: matchingTab ? String(matchingTab._id) : "",
          tabName: matchingTab ? matchingTab.title : "Water Softening",
        });
      }
    }
  };

  /* =========================
     TASK 4: FEATURED BUTTON 2 (WHATSAPP CONTACT)
  ========================= */

  const handleSecondaryFeaturedClick = () => {
    const solutionTitle = featuredSolution
      ? featuredSolution.name
      : data.featured.primaryProduct;

    const message = `Hello AVXBS Engineering Team, I would like to inquire about the ${solutionTitle} (${data.scope} Solution). Please assist me.`;
    openWhatsApp(message);
  };

  /* =========================
     TASK 1: HIGHLIGHT CLICK
  ========================= */

  const handleHighlightClick = (highlight) => {
    if (onSelectType) {
      onSelectType(data.scope);
    }

    if (highlight.buttonAction === "whatsapp") {
      const msg = `Hello AVXBS, I am interested in ${highlight.title} (${data.scope} Water Treatment). Please share details.`;
      openWhatsApp(msg);
      return;
    }

    if (highlight.buttonAction === "link" && highlight.buttonLink) {
      if (onClose) {
        onClose();
      }
      if (navigate) {
        navigate(highlight.buttonLink);
      } else {
        window.location.href = highlight.buttonLink;
      }
      return;
    }

    // Default action: open dynamic inquiry drawer
    if (onOpenInquiry) {
      onOpenInquiry({
        name: highlight.title,
        product: highlight.title,
        audience: data.scope,
        category: highlight.label || highlight.subtitle || "Highlights",
      });
    }
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div
      className={`mega-menu-panel-wrapper ${
        activeMenu ? "is-visible" : ""
      }`}
      role="region"
      aria-label={`${data.scope} Solutions Page`}
    >
      <div className="mega-menu-inner-container">

        {/* TOP HEADER */}
        <div className="mega-menu-header-bar">
          <div className="mega-menu-header-left">
            <span
              className={`scope-badge scope-${data.scope.toLowerCase()}`}
            >
              {data.badge}
            </span>

            <p className="scope-tagline">
              {data.description}
            </p>
          </div>

          <div className="mega-menu-header-right">
            <button
              type="button"
              className="quick-inquire-link"
              onClick={handleDirectSolutionInquiry}
              title="Direct Solution Inquiry via WhatsApp"
            >
              <PhoneCall size={14} />
              <span>Direct Solution Inquiry</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {menuLoading && (
          <p className="menu-loading">
            Loading latest solutions...
          </p>
        )}

        {/* MEGA MENU CONTENT */}
        <div className="mega-menu-grid">

          {/* TASK 1: HIGHLIGHTS SECTION (2 CARDS PER ROW, UP TO 4 ROWS / 8 CARDS) */}
          <div className="mega-menu-highlights">
            <div className="highlights-heading">
              <Sparkles size={17} />
              <h4>Highlights</h4>
            </div>

            <div className="highlights-list">
              {data.highlights.slice(0, 8).map((highlight, index) => {
                return (
                  <button
                    type="button"
                    key={highlight._id || index}
                    className="highlight-card"
                    onClick={() => handleHighlightClick(highlight)}
                    title={highlight.title}
                  >
                    {/* Centered Image at top (approx 120 x 120 px) */}
                    <div className="highlight-card-media">
                      {highlight.image ? (
                        <img
                          src={highlight.image}
                          alt={highlight.title}
                          className="highlight-card-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="highlight-card-fallback">
                          <ImageIcon size={32} className="fallback-img-icon" />
                        </div>
                      )}
                    </div>

                    {/* Title directly below image + Short description below title */}
                    <div className="highlight-content">
                      <strong className="highlight-card-title">
                        {highlight.title}
                      </strong>

                      {highlight.description && (
                        <p className="highlight-card-desc">
                          {highlight.description}
                        </p>
                      )}

                      {highlight.buttonText && (
                        <span className="highlight-explore">
                          {highlight.buttonText} <ArrowRight size={11} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SOLUTIONS & SYSTEMS (MATCH REFERENCE IMAGE 2: HORIZONTAL SOLUTION CARDS) */}
          <div className="mega-menu-solutions-section">
            <div className="solutions-section-heading">
              <Layers size={17} />
              <h4>Solutions & Systems</h4>
            </div>

            <div className="solutions-cards-grid mega-menu-tabs">
              {data.columns.map((col) => {
                const IconComp = col.icon;

                return (
                  <button
                    type="button"
                    key={col.id}
                    className="solution-horizontal-card"
                    onClick={() => handleCategoryClick(col)}
                    title={`View ${col.title} solutions`}
                  >
                    <div className="solution-card-icon-wrap">
                      <IconComp
                        size={20}
                        className="solution-card-icon"
                      />
                    </div>

                    <div className="solution-card-text">
                      <span className="solution-card-title">
                        {col.title}
                      </span>
                      {col.description && (
                        <span className="solution-card-desc">
                          {col.description}
                        </span>
                      )}
                    </div>

                    <div className="solution-card-arrow" aria-hidden="true">
                      <ChevronRight size={17} />
                    </div>
                  </button>
                );
              })}
            </div>

            {!menuLoading && data.columns.length === 0 && (
              <p className="menu-loading">
                No active solution tabs available.
              </p>
            )}
          </div>

          {/* FEATURED SOLUTION */}
          <div className="mega-menu-col col-featured">
            <div className="featured-solution-card">
              <div className="featured-image-wrap">
                <img
                  src={data.featured.image}
                  alt={data.featured.title}
                  className="featured-image"
                  loading="lazy"
                />

                <span className="featured-tag">
                  <Sparkles size={12} />
                  <span>Featured Solution</span>
                </span>
              </div>

              <div className="featured-card-body">
                <h5 className="featured-title">
                  {data.featured.title}
                </h5>

                <p className="featured-subtitle">
                  {data.featured.subtitle}
                </p>

                <p className="featured-desc">
                  {data.featured.description}
                </p>

                <div className="featured-card-actions">
                  {/* Button 1: Dynamic Inquiry Drawer */}
                  <button
                    type="button"
                    className="featured-btn-primary"
                    onClick={handlePrimaryFeaturedClick}
                  >
                    <span>
                      {data.featured.primaryCta}
                    </span>
                    <ArrowRight size={14} />
                  </button>

                  {/* Button 2: WhatsApp Contact */}
                  <button
                    type="button"
                    className="featured-btn-secondary"
                    onClick={handleSecondaryFeaturedClick}
                  >
                    <span>
                      {data.featured.secondaryCta}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DEDICATED PAGE FOOTER: ALL 5 BOTTOM INFORMATION ITEMS */}
        <footer className="solution-page-footer mega-menu-bottom-bar" role="contentinfo">
          {/* Left Side: Assurance Items */}
          <div className="assurance-pills">
            <span className="assurance-pill">
              <CheckCircle2
                size={14}
                className="check-icon"
              />
              <span>Certified Hardness Testing</span>
            </span>

            <span className="assurance-pill">
              <CheckCircle2
                size={14}
                className="check-icon"
              />
              <span>Custom Engineering Sizing</span>
            </span>

            <span className="assurance-pill">
              <CheckCircle2
                size={14}
                className="check-icon"
              />
              <span>Dedicated Installation AMC</span>
            </span>
          </div>

          {/* Right Side: Navigation Links */}
          <div className="bottom-links">
            <button
              type="button"
              className="bottom-nav-link"
              onClick={() => {
                if (onClose) onClose();
                if (navigate) navigate("/about");
              }}
            >
              <span>About AVXBS Solutions</span>
              <ArrowRight size={13} />
            </button>

            <button
              type="button"
              className="bottom-nav-link"
              onClick={() => {
                if (onClose) onClose();
                if (navigate) navigate("/contact");
              }}
            >
              <span>Contact Specialists</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}

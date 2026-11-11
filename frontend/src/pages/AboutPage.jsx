"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Droplets,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  Workflow,
  Sparkles,
} from "lucide-react";

const fallbackAbout = {
  heading: "About AVXBS",
  tagline:
    "Delivering advanced, unique solutions for residential and commercial infrastructure.",
  introductionHeading: "Company Introduction & Overview",
  introductionParagraphs: [
    "AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.",
    "Water hardness causes persistent scale deposition, plumbing deterioration, reduced thermal efficiency in water heaters, and premature appliance failure. At AVXBS, we merge precision chemical engineering with intelligent automated flow sensing to eliminate calcium and magnesium hardness at the point of entry.",
    "From luxury residences and high-rise apartments to industrial boiler feeds and commercial hospitality complexes, our engineered solutions protect equipment, elevate water quality, and optimize resource efficiency.",
  ],
  establishmentStatement:
    "Established in [YEAR], AVXBS is committed to delivering innovative water treatment and purification solutions for homes and industries.",
  establishmentYear: "",
  formattedEstablishment: "",
  imageUrl: "",
  statistics: [
    { value: "99.8", suffix: "%", label: "Scale Reduction" },
    { value: "50", suffix: "%", label: "Lower Salt Consumption" },
    { value: "100", suffix: "%", label: "Food-Grade Resins" },
  ],
};

/**
 * About Us Page for AVXBS (Dynamically Managed from Admin Panel)
 * - Heading and tagline fetched from MongoDB
 * - Company Introduction paragraphs & establishment details
 * - Old blue Engineered Purity box completely removed and replaced with uploaded image
 * - Dynamic percentage statistics
 */
export default function AboutPage({ navigate }) {
  const [aboutData, setAboutData] = useState(fallbackAbout);

  useEffect(() => {
    let isMounted = true;

    async function fetchAboutContent() {
      try {
        const response = await fetch("/api/public/about", {
          cache: "no-store",
        });

        const data = await response.json();
        if (isMounted && data.success && data.about) {
          setAboutData({
            ...fallbackAbout,
            ...data.about,
            introductionParagraphs:
              data.about.introductionParagraphs?.length > 0
                ? data.about.introductionParagraphs
                : fallbackAbout.introductionParagraphs,
            statistics:
              data.about.statistics?.length > 0
                ? data.about.statistics
                : fallbackAbout.statistics,
          });
        }
      } catch (error) {
        console.error("Unable to load public About content:", error);
      }
    }

    fetchAboutContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-view-container about-page">
      {/* TASK 1: ABOUT AVXBS HEADING AND TAGLINE */}
      <section className="about-hero-section">
        <div className="about-hero-content">
          <h1 className="about-page-title">
            {aboutData.heading.includes("AVXBS") ? (
              <>
                {aboutData.heading.replace("AVXBS", "").trim()}{" "}
                <span className="highlight-text">AVXBS</span>
              </>
            ) : (
              aboutData.heading
            )}
          </h1>
          <p className="about-hero-subtitle">
            {aboutData.tagline}
          </p>
        </div>
      </section>

      {/* TASK 2: COMPANY INTRODUCTION & OVERVIEW + TASK 3: IMAGE REPLACEMENT + TASK 4: DYNAMIC STATISTICS */}
      <section className="about-section overview-section">
        <div className="section-container">
          <div className="overview-grid">
            {/* Left Column: Text Overview & Dynamic Statistics */}
            <div className="overview-text-col">
              <h2 className="section-heading">
                {aboutData.introductionHeading || "Company Introduction & Overview"}
              </h2>

              {(aboutData.introductionParagraphs || []).map((para, index) => (
                <p
                  key={index}
                  className={index === 0 ? "lead-paragraph" : "body-paragraph"}
                >
                  {index === 0 && para.startsWith("AVXBS") ? (
                    <>
                      <strong>AVXBS</strong> {para.slice(5)}
                    </>
                  ) : (
                    para
                  )}
                </p>
              ))}

              {/* Establishment statement (displayed only when configured) */}
              {aboutData.formattedEstablishment ? (
                <p className="establishment-paragraph">
                  {aboutData.formattedEstablishment}
                </p>
              ) : null}

              {/* TASK 4: DYNAMIC PERCENTAGE STATISTICS */}
              {aboutData.statistics && aboutData.statistics.length > 0 && (
                <div className="highlights-row">
                  {aboutData.statistics.map((stat, idx) => (
                    <div className="highlight-item" key={stat._id || idx}>
                      <span className="highlight-value">
                        {stat.value}
                        {stat.suffix}
                      </span>
                      <span className="highlight-label">{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TASK 3: REPLACED OLD BLUE BOX WITH ADMIN-UPLOADED IMAGE */}
            <div className="overview-image-col">
              {aboutData.imageUrl ? (
                <div className="about-custom-image-wrapper">
                  <img
                    src={aboutData.imageUrl}
                    alt={aboutData.heading || "About AVXBS"}
                    className="about-uploaded-img"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="about-image-placeholder">
                  <div className="placeholder-inner">
                    <ShieldCheck size={38} className="placeholder-icon" />
                    <h4>Engineering Pure Water Solutions</h4>
                    <p>
                      Scalable water treatment & softening infrastructure designed
                      for residential luxury and enterprise reliability.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-section mission-vision-section">
        <div className="section-container">
          <div className="cards-two-col">
            <div className="mv-card mission-card">
              <div className="mv-icon-wrap">
                <Workflow size={28} />
              </div>
              <h3 className="mv-card-title">Our Mission</h3>
              <p className="mv-card-text">
                To engineer pure, scale-free water for homes and enterprises,
                protecting plumbing infrastructure and optimizing energy
                efficiency through intelligent, eco-conscious water treatment
                technology.
              </p>
            </div>

            <div className="mv-card vision-card">
              <div className="mv-icon-wrap">
                <TrendingUp size={28} />
              </div>
              <h3 className="mv-card-title">Our Vision</h3>
              <p className="mv-card-text">
                To become the industry benchmark in next-generation water
                softening and purification solutions, integrating smart automated
                controls, high-capacity ion exchange, and zero-compromise
                environmental stewardship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Water Treatment Solutions */}
      <section className="about-section solutions-overview-section">
        <div className="section-container">
          <div className="section-header-centered">
            <h2 className="section-heading">Water Treatment Solutions</h2>
            <p className="section-subheading">
              Comprehensive water engineering platforms built for residential luxury
              and commercial performance.
            </p>
          </div>

          <div className="solutions-cards-grid">
            <div className="solution-feature-card">
              <div className="sol-icon-box">
                <Droplets size={24} />
              </div>
              <h4 className="sol-card-title">Whole-House Water Softeners</h4>
              <p className="sol-card-desc">
                High-efficiency automated softening systems engineered to
                eliminate hard calcium and magnesium minerals, preventing
                limescale accumulation, extending appliance longevity, and
                providing silky soft water.
              </p>
            </div>

            <div className="solution-feature-card">
              <div className="sol-icon-box">
                <Layers size={24} />
              </div>
              <h4 className="sol-card-title">Commercial Softening Plants</h4>
              <p className="sol-card-desc">
                Heavy-duty duplex and triplex ion-exchange softening plants
                engineered for hotels, hospitals, manufacturing facilities, and
                HVAC boiler feed requiring continuous non-stop softened output.
              </p>
            </div>

            <div className="solution-feature-card">
              <div className="sol-icon-box">
                <ShieldCheck size={24} />
              </div>
              <h4 className="sol-card-title">Iron & Turbidity Removal</h4>
              <p className="sol-card-desc">
                Advanced catalytic and multi-media filtration columns that
                extract dissolved iron, rust stains, suspended solids, and
                particulate matter from borewell and groundwater sources.
              </p>
            </div>

            <div className="solution-feature-card">
              <div className="sol-icon-box">
                <Award size={24} />
              </div>
              <h4 className="sol-card-title">Reverse Osmosis & UV Disinfection</h4>
              <p className="sol-card-desc">
                High-recovery semi-permeable membrane filtration paired with
                germicidal ultraviolet sterilization to neutralize microbiological
                contaminants and deliver purified drinking standards.
              </p>
            </div>
          </div>

          {/* Bottom CTA Box */}
          <div className="about-cta-card">
            <div className="cta-text-side">
              <h3 className="cta-heading">
                Ready to protect your water infrastructure?
              </h3>
              <p className="cta-subtext">
                Speak directly with an AVXBS water treatment specialist to assess
                your water hardness and specify the optimal system.
              </p>
            </div>
            <div className="cta-actions">
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => (navigate ? navigate("/contact") : (window.location.href = "/contact"))}
              >
                <span>Contact Engineering</span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => (navigate ? navigate("/") : (window.location.href = "/"))}
              >
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

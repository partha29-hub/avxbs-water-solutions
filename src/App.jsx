"use client";

import React, { useState, useEffect } from "react";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HeroSection from "./components/hero/HeroSection";
import SolutionSlider from "./components/slider/SolutionSlider";
import InquiryDrawer from "./components/inquiry/InquiryDrawer";
import ReviewsSection from "./components/reviews/ReviewsSection";
import MegaMenu from "./components/layout/MegaMenu";

import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

import {
  getSubmissionCount,
  incrementSubmissionCount,
} from "./services/submissionCounter";

import { X } from "lucide-react";

const defaultAssistance = {
  enabled: true,
  buttonLabel: "Check for special offers,",
  openingMessage:
    "Hello AVXBS Team, I need assistance with your water treatment solutions. Please share more details.",

  departments: [
    {
      name: "General Enquiry",
      phone: "919692625703",
      isActive: true,
    },
  ],

  defaultDepartment: "General Enquiry",
};

export default function App() {
  const [submissionCount, setSubmissionCount] = useState(0);

  const [selectedType, setSelectedType] = useState("Residential");
  
  const [selectedCategory, setSelectedCategory] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [showChatBubble, setShowChatBubble] = useState(true);

  // Active full-page tab view: null (homepage) | "residential" | "commercial"
  const [activeTab, setActiveTab] = useState(null);

  // Inquiry Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState("Water Softener");
  const [drawerSolutionId, setDrawerSolutionId] = useState("");
  const [drawerTabId, setDrawerTabId] = useState("");
  const [drawerTabName, setDrawerTabName] = useState("");
  const [drawerCategory, setDrawerCategory] = useState("");
  const [drawerInitialType, setDrawerInitialType] = useState("Residential");

  // WhatsApp Assistance Settings
  const [assistance, setAssistance] = useState(defaultAssistance);

  // Client-side routing
  const [currentPath, setCurrentPath] = useState("/");
  const [isClient, setIsClient] = useState(false);

  // Initialize current route
  useEffect(() => {
    const path =
      window.location.pathname.replace(/\/+$/, "") || "/";

    setCurrentPath(path);
    setIsClient(true);
  }, []);

  // Browser Back / Forward
  useEffect(() => {
    const handlePopState = () => {
      const path =
        window.location.pathname.replace(/\/+$/, "") || "/";

      setCurrentPath(path);
      setActiveTab(null);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Navigation
  const navigate = (path) => {
    const normalized = path.replace(/\/+$/, "") || "/";

    if (normalized !== currentPath) {
      window.history.pushState({}, "", normalized);
      setCurrentPath(normalized);
    }

    setActiveTab(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Switch or toggle full-page solution views (Residential / Commercial)
  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab && currentPath !== "/") {
      const normalized = "/";
      window.history.pushState({}, "", normalized);
      setCurrentPath(normalized);
    }
  };

  // Load submission counter
  useEffect(() => {
    const initial = getSubmissionCount();
    setSubmissionCount(initial);
  }, []);

  // Fetch WhatsApp settings from MongoDB
  useEffect(() => {
    let isMounted = true;

    async function loadAssistanceSettings() {
      try {
        const response = await fetch("/api/assistance", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to fetch assistance settings.");
        }

        const data = await response.json();

        if (isMounted && Array.isArray(data.departments)) {
          setAssistance({
            ...defaultAssistance,
            ...data,
          });
        }
      } catch (error) {
        console.error("Assistance settings error:", error);
      }
    }

    loadAssistanceSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Open inquiry drawer
  // Accepts either a complete Solution object or a product name string.
  const handleOpenInquiry = (solution = "Water Softener") => {
    if (typeof solution === "object" && solution !== null) {
      setDrawerProduct(solution.name || solution.product || "Water Softener");
      setDrawerSolutionId(
        solution._id ? String(solution._id) : (solution.solutionId ? String(solution.solutionId) : "")
      );
      setDrawerTabId(solution.tabId ? String(solution.tabId) : "");
      setDrawerTabName(solution.tabName || "");
      setDrawerCategory(solution.category || "");
      setDrawerInitialType(solution.audience || selectedType);
    } else {
      // Compatibility with string argument
      setDrawerProduct(solution || "Water Softener");
      setDrawerSolutionId("");
      setDrawerTabId("");
      setDrawerTabName("");
      setDrawerCategory(selectedCategory || "");
      setDrawerInitialType(selectedType);
    }

    setIsDrawerOpen(true);
  };

  // Close inquiry drawer
  const handleCloseInquiry = () => {
    setIsDrawerOpen(false);
  };

  // Successful inquiry submission
  const handleFormSubmitSuccess = (submittedData) => {
    console.log(
      "Inquiry submitted successfully:",
      submittedData
    );

    const updatedCount = incrementSubmissionCount();

    setSubmissionCount(updatedCount);
  };

  // Open WhatsApp using Admin Panel settings
  const handleWhatsAppSupport = () => {
    const departments = assistance.departments || [];

    const department =
      departments.find(
        (item) =>
          item.name === assistance.defaultDepartment &&
          item.isActive
      ) || departments.find((item) => item.isActive);

    if (!department?.phone) {
      console.error(
        "No active WhatsApp support number configured."
      );
      return;
    }

    const phoneNumber = String(department.phone).replace(
      /\D/g,
      ""
    );

    const message =
      assistance.openingMessage ||
      "Hello AVXBS Team, I need assistance.";

    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(
      whatsappURL,
      "_blank",
      "noopener,noreferrer"
    );

    setShowChatBubble(false);
  };

  // Prevent rendering before client initialization
  if (!isClient) {
    return null;
  }

  return (
    <div className="app-root">

      {/* Header */}
      <Header
        navigate={navigate}
        currentPath={currentPath}
        selectedType={selectedType}
        onSelectType={(type) => {
          if (type !== selectedType) {
            setSelectedCategory("");
          }
          setSelectedType(type);
        }}
        onSelectCategory={setSelectedCategory}
        onOpenInquiry={handleOpenInquiry}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        assistance={assistance}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Content Router */}
      {currentPath === "/about" ? (
        <>
          <main className="main-content">
            <AboutPage navigate={navigate} />
          </main>
          <Footer />
        </>
      ) : currentPath === "/contact" ? (
        <>
          <main className="main-content">
            <ContactPage
              navigate={navigate}
              initialType={selectedType}
              onSubmitSuccess={handleFormSubmitSuccess}
            />
          </main>
          <Footer />
        </>
      ) : activeTab === "residential" || activeTab === "commercial" ? (
        /* Residential and Commercial Full-Page Views:
           Has its own bottom information bar; global website footer is NOT included here. */
        <main className="main-content solutions-fullpage-main">
          <MegaMenu
            activeMenu={activeTab}
            onClose={() => setActiveTab(null)}
            onSelectType={(type) => {
              setSelectedType(type);
            }}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              setActiveTab(null);
            }}
            onOpenInquiry={handleOpenInquiry}
            navigate={navigate}
            assistance={assistance}
          />
        </main>
      ) : (
        /* Original Homepage View:
           Includes HeroSection, SolutionSlider, ReviewsSection, and main website Footer. */
        <>
          <main className="main-content">
            <HeroSection
              selectedType={selectedType}
              onSelectType={setSelectedType}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <div className="interactive-section-wrapper">
              <SolutionSlider
                counter={submissionCount}
                selectedType={selectedType}
                selectedCategory={selectedCategory}
                onOpenContact={handleOpenInquiry}
                onSubmitSuccess={handleFormSubmitSuccess}
              />
            </div>

            {/* Customer Reviews & Website Feedback Form Module */}
            <ReviewsSection />
          </main>
          <Footer />
        </>
      )}

      {/* Inquiry Drawer */}
      <InquiryDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseInquiry}
        productName={drawerProduct}
        solutionId={drawerSolutionId}
        tabId={drawerTabId}
        tabName={drawerTabName}
        category={drawerCategory}
        initialType={drawerInitialType}
        onSubmitSuccess={handleFormSubmitSuccess}
      />

      {/* Dynamic WhatsApp Customer Support */}
      {assistance.enabled && (
        <div
          className="floating-support-chat"
          role="complementary"
          aria-label="Customer Support Chat"
        >

          {showChatBubble && (
            <div className="chat-speech-bubble">

              <span className="bubble-text">
                {assistance.buttonLabel || "Need Assistance?"}
                <br />
                Chat with us
              </span>

              <button
                type="button"
                className="bubble-close-btn"
                onClick={() => setShowChatBubble(false)}
                aria-label="Dismiss offer notification"
              >
                <X size={14} />
              </button>

            </div>
          )}

          <button
            type="button"
            className="chat-avatar-btn"
            aria-label="Open WhatsApp customer support"
            onClick={handleWhatsAppSupport}
          >
            <div className="avatar-circle">

              <img
                src="https://static.vecteezy.com/system/resources/thumbnails/033/651/215/small/portrait-of-a-woman-working-in-customer-service-at-a-call-center-white-backgroud-generative-ai-free-photo.jpg"
                alt="Support Specialist"
                className="avatar-img"
              />

              <span
                className="online-indicator-ring"
                aria-hidden="true"
              />

            </div>
          </button>

        </div>
      )}

    </div>
  );
}

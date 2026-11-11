"use client";

import React, { useEffect, useRef } from "react";
import InquiryForm from "./InquiryForm";

export default function InquiryDrawer({
  isOpen,
  onClose,
  productName = "Water Softener",
  solutionId = "",
  tabId = "",
  tabName = "",
  category = "",
  initialType = "Residential",
  onSubmitSuccess,
}) {
  const drawerRef = useRef(null);

  // Body scroll lock & Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling while drawer is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`inquiry-drawer-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        ref={drawerRef}
        className={`inquiry-drawer ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-form-heading"
        aria-hidden={!isOpen}
        onClick={(event) => event.stopPropagation()}
      >
        <InquiryForm
          isOpen={isOpen}
          onClose={onClose}
          productName={productName}
          solutionId={solutionId}
          tabId={tabId}
          tabName={tabName}
          category={category}
          initialType={initialType}
          onSubmitSuccess={onSubmitSuccess}
          isInline={false}
        />
      </aside>
    </>
  );
}

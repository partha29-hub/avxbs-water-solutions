"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Droplets,
  Building2,
  Home,
} from "lucide-react";

// Standard fields matching the Water Softener Engineering Inquiry reference
const STANDARD_WATER_ISSUES = [
  "Hard Water & Heavy Limescale / Salt Crust",
  "Bathroom Staining & Tile Scaling",
  "Hair Fall, Rough Skin & Dryness",
  "Appliance, Solar & Geyser Scaling",
  "High TDS / Salty Brackish Water",
  "Commercial / High Volume Softening",
  "Complete Water Treatment & Softening Combo",
  "Site Inspection & Free Hardness Test",
];

function getFieldKey(field) {
  if (field.name === "type" || field.name === "scope") return "propertyType";
  if (field.name === "mobile") return "phone";
  if (field.name === "issue") return "waterIssue";
  if (field.name === "city") return "location";
  return field.name;
}

export default function InquiryForm({
  isOpen = true,
  onClose,
  productName = "Water Softener",
  solutionId = "",
  tabId = "",
  tabName = "",
  category = "",
  initialType = "Residential",
  onSubmitSuccess,
  isInline = false,
}) {
  const [propertyScope, setPropertyScope] = useState(
    initialType === "Commercial" ? "Commercial" : "Residential"
  );
  const [formData, setFormData] = useState({
    propertyType:
      initialType === "Commercial"
        ? "Commercial / Industrial"
        : "Residential (Villa / Flat)",
    name: "",
    phone: "",
    email: "",
    location: "",
    solution: productName || category || "Water Softener",
    waterIssue: "",
    remarks: "",
  });

  const [customFields, setCustomFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [formMeta, setFormMeta] = useState({
    tabId: "",
    tabName: "",
    solutionId: "",
  });

  const formContainerRef = useRef(null);

  // Sync initialType when it changes
  useEffect(() => {
    const scope = initialType === "Commercial" ? "Commercial" : "Residential";
    setPropertyScope(scope);
    setFormData((prev) => ({
      ...prev,
      propertyType:
        scope === "Commercial"
          ? "Commercial / Industrial"
          : "Residential (Villa / Flat)",
      solution: productName || category || prev.solution || "Water Softener",
    }));
  }, [initialType, productName, category]);

  // Load any dynamic form fields from API
  const loadFormConfig = useCallback(
    async (signal) => {
      setIsLoading(true);
      setLoadError("");

      try {
        const audience = propertyScope;
        const params = new URLSearchParams({ audience });

        if (solutionId) params.set("solutionId", solutionId);
        if (productName) params.set("solutionName", productName);
        if (tabId) params.set("tabId", tabId);
        if (tabName) params.set("tabName", tabName);
        if (category) params.set("category", category);

        const response = await fetch(`/api/form-config?${params.toString()}`, {
          cache: "no-store",
          signal,
        });

        const result = await response.json();

        if (result?.success) {
          setFormMeta({
            tabId: result.tabId || tabId || "",
            tabName: result.tabName || tabName || "",
            solutionId: result.solutionId || solutionId || "",
          });

          // Check if admin has defined custom extra fields (beyond name, phone, email, remarks, type)
          if (Array.isArray(result.fields)) {
            const standardFieldNames = [
              "name",
              "phone",
              "mobile",
              "email",
              "type",
              "remarks",
              "message",
              "location",
              "solution",
              "waterIssue",
            ];
            const extraFields = result.fields.filter(
              (f) => !standardFieldNames.includes(f.name) && f.enabled !== false
            );
            setCustomFields(extraFields);
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Dynamic Form Config Notice:", error.message);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [solutionId, productName, tabId, tabName, category, propertyScope]
  );

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    setIsSubmitted(false);
    setSubmittedData(null);
    setSubmitError("");
    setErrors({});

    loadFormConfig(controller.signal);

    return () => controller.abort();
  }, [isOpen, loadFormConfig]);

  // Handle Property Scope Toggle
  const handleScopeChange = (scope) => {
    setPropertyScope(scope);
    const scopeLabel =
      scope === "Commercial"
        ? "Commercial / Industrial"
        : "Residential (Villa / Flat)";

    setFormData((prev) => ({
      ...prev,
      propertyType: scopeLabel,
    }));

    setErrors((prev) => ({
      ...prev,
      propertyType: "",
    }));
  };

  // Handle Input Changes
  const handleInputChange = (fieldKey, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [fieldKey]: "",
    }));

    setSubmitError("");
  };

  // Validation
  const validate = () => {
    const nextErrors = {};

    if (!formData.name || String(formData.name).trim().length < 2) {
      nextErrors.name = "Please enter your full name (at least 2 characters).";
    }

    const cleanPhone = String(formData.phone || "").replace(/[\s\-()]/g, "");
    if (!cleanPhone) {
      nextErrors.phone = "Phone / WhatsApp number is required.";
    } else if (!/^(?:\+91|91|0)?[6-9]\d{9}$/.test(cleanPhone) && cleanPhone.length < 10) {
      nextErrors.phone = "Please enter a valid 10-digit mobile number.";
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.email).trim())
    ) {
      nextErrors.email = "Please enter a valid email address.";
    }

    // Validate any required custom fields
    customFields.forEach((field) => {
      const key = getFieldKey(field);
      const val = formData[key];
      if (field.required && (!val || String(val).trim() === "")) {
        nextErrors[key] = `${field.label || "This field"} is required.`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const name = String(formData.name || "").trim();
      const phone = String(formData.phone || "").trim();
      const email = String(formData.email || "").trim();
      const location = String(formData.location || "").trim();
      const selectedSol =
        String(formData.solution || "").trim() || productName || "Water Softener";
      const waterIssue = String(formData.waterIssue || "").trim();
      const remarks = String(formData.remarks || "").trim();
      const currentScope =
        formData.propertyType ||
        (propertyScope === "Commercial"
          ? "Commercial / Industrial"
          : "Residential (Villa / Flat)");

      // Format clean message overview
      const messageSegments = [];
      if (currentScope) messageSegments.push(`Scope: ${currentScope}`);
      if (location) messageSegments.push(`Location: ${location}`);
      if (waterIssue) messageSegments.push(`Issue: ${waterIssue}`);
      if (remarks) messageSegments.push(`Remarks: ${remarks}`);

      const compiledMessage =
        messageSegments.length > 0
          ? messageSegments.join(" | ")
          : "Water Softener Engineering Inquiry";

      const payload = {
        name,
        phone,
        email,

        category: propertyScope,
        audience: propertyScope,

        subject: `${selectedSol} Engineering Inquiry`,
        product: selectedSol,
        message: compiledMessage,

        tabId: formMeta.tabId || tabId || "",
        tabName: formMeta.tabName || tabName || "",
        solutionId: formMeta.solutionId || solutionId || "",

        formData: {
          ...formData,
          propertyScope: currentScope,
          audience: propertyScope,
          location,
          waterIssue,
          solution: selectedSol,
          tabId: formMeta.tabId || tabId || "",
          tabName: formMeta.tabName || tabName || "",
          solutionId: formMeta.solutionId || solutionId || "",
        },
      };

      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit your inquiry.");
      }

      const successData = {
        ...payload,
        inquiryId: result.inquiryId,
      };

      setSubmittedData(successData);
      setIsSubmitted(true);

      if (onSubmitSuccess) {
        onSubmitSuccess(successData);
      }
    } catch (error) {
      console.error("Inquiry Submission Error:", error);
      setSubmitError(
        error.message || "Unable to submit inquiry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      propertyType:
        propertyScope === "Commercial"
          ? "Commercial / Industrial"
          : "Residential (Villa / Flat)",
      name: "",
      phone: "",
      email: "",
      location: "",
      solution: productName || category || "Water Softener",
      waterIssue: "",
      remarks: "",
    });
    setErrors({});
    setSubmitError("");
    setIsSubmitted(false);
    setSubmittedData(null);
  };

  // Determine Title: Water Softener Engineering Inquiry
  const displayHeading =
    !productName || productName.toLowerCase().includes("water soft")
      ? "Water Softener Engineering Inquiry"
      : productName.toLowerCase().includes("inquiry")
      ? productName
      : `${productName} Engineering Inquiry`;

  return (
    <div
      ref={formContainerRef}
      className={`inquiry-form-container ${isInline ? "inline-form-mode" : ""}`}
    >
      {/* 1. Header with Eyebrow Label & Close Button */}
      <div className="drawer-header">
        <div className="drawer-header-left">
          <div className="drawer-eyebrow-wrap">
            <span className="drawer-pure-solution-badge">
              <Droplets size={12} className="pill-icon" />
              <span>AVXBS PURE SOLUTION</span>
            </span>
          </div>

          <h2 id="inquiry-form-heading" className="drawer-main-title">
            {displayHeading}
          </h2>
        </div>

        {onClose && (
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close inquiry form"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* 2. Drawer Body */}
      <div className="drawer-body">
        {isSubmitted ? (
          <div className="drawer-success-state">
            <div className="success-icon-bubble">
              <CheckCircle2 size={48} className="success-check-icon" />
            </div>

            <h3 className="success-title">Inquiry Received!</h3>

            <p className="success-message">
              Thank you, <strong>{submittedData?.name}</strong>. Our water
              softener engineering team has received your inquiry for{" "}
              <strong>{submittedData?.product}</strong> (
              {submittedData?.category}) and will connect with you at{" "}
              <strong>{submittedData?.phone}</strong> shortly.
            </p>

            <div className="success-actions">
              <button
                type="button"
                className="btn-drawer-secondary"
                onClick={handleReset}
              >
                Submit Another Inquiry
              </button>

              {onClose && (
                <button
                  type="button"
                  className="btn-drawer-primary"
                  onClick={onClose}
                >
                  {isInline ? "Done" : "Close Drawer"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="drawer-inquiry-form"
            noValidate
          >
            <p className="drawer-intro-text">
              Configure your requirements below for an engineered water softening
              recommendation and customized sizing report.
            </p>

            {/* Property Scope Selection */}
            <div className="form-field-group property-scope-group">
              <label className="form-field-label">
                Property Scope <span className="req-star">*</span>
              </label>

              <div
                className="property-scope-toggle"
                role="radiogroup"
                aria-label="Property Scope"
              >
                <button
                  type="button"
                  className={`property-scope-btn ${
                    propertyScope === "Residential" ? "is-active" : ""
                  }`}
                  onClick={() => handleScopeChange("Residential")}
                  role="radio"
                  aria-checked={propertyScope === "Residential"}
                >
                  <Home size={15} />
                  <span>Residential (Villa / Flat)</span>
                </button>

                <button
                  type="button"
                  className={`property-scope-btn ${
                    propertyScope === "Commercial" ? "is-active" : ""
                  }`}
                  onClick={() => handleScopeChange("Commercial")}
                  role="radio"
                  aria-checked={propertyScope === "Commercial"}
                >
                  <Building2 size={15} />
                  <span>Commercial / Industrial</span>
                </button>
              </div>
            </div>

            {/* Row 1: Full Name and Phone fields side by side */}
            <div className="drawer-form-row">
              <div className="form-field-group">
                <label htmlFor="inquiry-full-name" className="form-field-label">
                  Full Name <span className="req-star">*</span>
                </label>
                <input
                  id="inquiry-full-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  disabled={isSubmitting}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`drawer-text-input ${
                    errors.name ? "input-error" : ""
                  }`}
                />
                {errors.name && (
                  <div className="field-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              <div className="form-field-group">
                <label htmlFor="inquiry-phone" className="form-field-label">
                  Phone / WhatsApp <span className="req-star">*</span>
                </label>
                <input
                  id="inquiry-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  disabled={isSubmitting}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`drawer-text-input ${
                    errors.phone ? "input-error" : ""
                  }`}
                />
                {errors.phone && (
                  <div className="field-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Email Address and Location fields side by side */}
            <div className="drawer-form-row">
              <div className="form-field-group">
                <label htmlFor="inquiry-email" className="form-field-label">
                  Email Address <span className="optional-tag">(Optional)</span>
                </label>
                <input
                  id="inquiry-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  disabled={isSubmitting}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`drawer-text-input ${
                    errors.email ? "input-error" : ""
                  }`}
                />
                {errors.email && (
                  <div className="field-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div className="form-field-group">
                <label htmlFor="inquiry-location" className="form-field-label">
                  Location / City <span className="optional-tag">(Optional)</span>
                </label>
                <input
                  id="inquiry-location"
                  name="location"
                  type="text"
                  placeholder="e.g. Bangalore, Hyderabad, Chennai, etc."
                  value={formData.location}
                  disabled={isSubmitting}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="drawer-text-input"
                />
              </div>
            </div>

            {/* Selected Solution / Category */}
            <div className="form-field-group">
              <label htmlFor="inquiry-solution" className="form-field-label">
                Selected Solution / Category
              </label>
              <input
                id="inquiry-solution"
                name="solution"
                type="text"
                placeholder="Water Softener"
                value={formData.solution}
                disabled={isSubmitting}
                onChange={(e) => handleInputChange("solution", e.target.value)}
                className="drawer-text-input"
              />
            </div>

            {/* Primary Water Issue / Requirement */}
            <div className="form-field-group">
              <label htmlFor="inquiry-water-issue" className="form-field-label">
                Primary Water Issue / Requirement
              </label>
              <div className="select-input-wrap">
                <select
                  id="inquiry-water-issue"
                  name="waterIssue"
                  value={formData.waterIssue}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    handleInputChange("waterIssue", e.target.value)
                  }
                  className="drawer-select-input"
                >
                  <option value="">Select your primary water issue</option>
                  {STANDARD_WATER_ISSUES.map((issue, idx) => (
                    <option key={idx} value={issue}>
                      {issue}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Message / Remarks */}
            <div className="form-field-group">
              <label htmlFor="inquiry-remarks" className="form-field-label">
                Additional Message / Remarks{" "}
                <span className="optional-tag">(Optional)</span>
              </label>
              <textarea
                id="inquiry-remarks"
                name="remarks"
                rows={2}
                placeholder="Tell us about your requirement (family size, daily consumption, borewell/tanker)..."
                value={formData.remarks}
                disabled={isSubmitting}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                className="drawer-textarea-input"
              />
            </div>

            {/* Any Extra Custom Admin Fields (if configured) */}
            {customFields.map((field) => {
              const key = getFieldKey(field);
              const val = formData[key] ?? "";
              const err = errors[key];
              const fId = `custom-field-${field.id}`;

              return (
                <div className="form-field-group" key={field.id}>
                  <label htmlFor={fId} className="form-field-label">
                    {field.label}
                    {field.required ? (
                      <span className="req-star"> *</span>
                    ) : (
                      <span className="optional-tag"> (Optional)</span>
                    )}
                  </label>

                  {field.type === "textarea" ? (
                    <textarea
                      id={fId}
                      rows={3}
                      value={val}
                      placeholder={field.placeholder || ""}
                      disabled={isSubmitting}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className={`drawer-textarea-input ${
                        err ? "input-error" : ""
                      }`}
                    />
                  ) : field.type === "dropdown" ? (
                    <div className="select-input-wrap">
                      <select
                        id={fId}
                        value={val}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          handleInputChange(key, e.target.value)
                        }
                        className={`drawer-select-input ${
                          err ? "input-error" : ""
                        }`}
                      >
                        <option value="">
                          {field.placeholder || "Select an option"}
                        </option>
                        {(field.options || []).map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input
                      id={fId}
                      type={field.type || "text"}
                      value={val}
                      placeholder={field.placeholder || ""}
                      disabled={isSubmitting}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className={`drawer-text-input ${
                        err ? "input-error" : ""
                      }`}
                    />
                  )}

                  {err && (
                    <div className="field-error-msg">
                      <AlertCircle size={14} />
                      <span>{err}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {submitError && (
              <div className="field-error-msg">
                <AlertCircle size={14} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Full-width Submit Button */}
            <div className="drawer-submit-wrap">
              <button
                type="submit"
                disabled={isSubmitting}
                className="drawer-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="spinner-icon" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Inquiry</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

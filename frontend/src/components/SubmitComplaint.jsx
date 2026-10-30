import React, { useState, useEffect } from "react";
import { complaintAPI, organizationAPI } from "../services/api";

export default function SubmitComplaint({ user, onComplaintSubmitted, onTrackComplaint }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(user?.organizationId || "");
  const [selectedOrg, setSelectedOrg] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "MEDIUM",
    location: "",
    description: "",
    userName: user?.name || "",
    userEmail: user?.email || "",
    attachmentName: "",
    attachmentData: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const priorities = [
    { value: "LOW", label: "Low", sla: "5 Days SLA", desc: "Routine maintenance", color: "#64748b" },
    { value: "MEDIUM", label: "Medium", sla: "72 Hours SLA", desc: "Standard issue", color: "#2563eb" },
    { value: "HIGH", label: "High", sla: "48 Hours SLA", desc: "Significant obstruction", color: "#d97706" },
    { value: "URGENT", label: "Urgent", sla: "24 Hours SLA", desc: "Immediate hazard", color: "#e11d48" },
  ];

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    try {
      const orgs = await organizationAPI.getActive();
      setOrganizations(orgs || []);
      if (orgs && orgs.length > 0) {
        const initialOrg = (user?.organizationId && orgs.find((o) => o.id === user.organizationId)) || orgs[0];
        setSelectedOrgId(initialOrg.id);
        setSelectedOrg(initialOrg);
        if (initialOrg.categories && initialOrg.categories.length > 0) {
          setFormData((prev) => ({ ...prev, category: initialOrg.categories[0].name }));
        }
      }
    } catch (e) {
      console.warn("Failed to load organizations:", e);
    }
  }

  function handleOrgChange(e) {
    const orgId = e.target.value;
    setSelectedOrgId(orgId);
    const org = organizations.find((o) => o.id === orgId);
    setSelectedOrg(org);
    if (org && org.categories && org.categories.length > 0) {
      setFormData((prev) => ({ ...prev, category: org.categories[0].name }));
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Handle Photo Evidence Attachment
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Attachment size must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
      setFormData((prev) => ({
        ...prev,
        attachmentName: file.name,
        attachmentData: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAttachment() {
    setPreviewUrl(null);
    setFormData((prev) => ({
      ...prev,
      attachmentName: "",
      attachmentData: "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        organizationId: selectedOrgId,
        organizationName: selectedOrg?.name || "General Public",
      };

      const response = await complaintAPI.submit(payload);
      setSuccessData(response);
      if (onComplaintSubmitted) {
        onComplaintSubmitted(response);
      }
    } catch (err) {
      setError(
        err.customMessage ||
          "Unable to register your grievance. Please verify backend connection."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopyTrackingId() {
    if (successData?.trackingId) {
      navigator.clipboard.writeText(successData.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function resetForm() {
    setSuccessData(null);
    setPreviewUrl(null);
    setFormData({
      title: "",
      category: selectedOrg?.categories?.[0]?.name || "",
      priority: "MEDIUM",
      location: "",
      description: "",
      userName: user?.name || "",
      userEmail: user?.email || "",
      attachmentName: "",
      attachmentData: "",
    });
  }

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="form-card-container">
        {/* Header */}
        <div className="form-header">
          <span className="badge-pill">MULTI-DOMAIN GRIEVANCE PORTAL</span>
          <h1 className="form-title">Lodge a Trackable Grievance</h1>
          <p className="form-subtitle">
            Submit your report to the designated organization. Categories and SLA resolution timelines adapt automatically based on the chosen domain.
          </p>
        </div>

        {error && (
          <div className="alert-box error animate-fade-in">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <strong>Notice</strong>
              <p>{error}</p>
            </div>
            <button className="alert-dismiss" onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* Success View */}
        {successData ? (
          <div className="success-card animate-fade-in">
            <div className="success-icon-wrapper">
              <span className="success-checkmark">✓</span>
            </div>

            <h2>Grievance Registered Successfully!</h2>
            <p className="success-desc">
              Your grievance has been logged into <strong>{successData.organizationName}</strong> and queued for action.
            </p>

            <div className="tracking-id-highlight">
              <span className="tracking-label">YOUR PERMANENT TRACKING CODE</span>
              <div className="tracking-code-row">
                <span className="tracking-code">{successData.trackingId}</span>
                <button
                  type="button"
                  className="btn-copy"
                  onClick={handleCopyTrackingId}
                  title="Copy Tracking ID"
                >
                  {copied ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
              <small className="tracking-hint">Save this ID to monitor real-time department milestones anytime.</small>
            </div>

            <div className="submitted-summary">
              <div className="summary-item">
                <span>Organization:</span>
                <strong>{successData.organizationName}</strong>
              </div>
              <div className="summary-item">
                <span>Title:</span>
                <strong>{successData.title}</strong>
              </div>
              <div className="summary-item">
                <span>Category:</span>
                <strong>{successData.category}</strong>
              </div>
              <div className="summary-item">
                <span>Target SLA:</span>
                <span className="sla-badge">
                  {successData.targetResolutionDate
                    ? new Date(successData.targetResolutionDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Standard SLA"}
                </span>
              </div>
              <div className="summary-item">
                <span>Initial Status:</span>
                <span className="status-pill submitted">● {successData.status}</span>
              </div>
            </div>

            <div className="success-actions">
              <button
                type="button"
                className="btn-primary-glow"
                onClick={() => onTrackComplaint(successData.trackingId)}
              >
                Track Live Status Now →
              </button>
              <button
                type="button"
                className="btn-secondary-light"
                onClick={resetForm}
              >
                Submit Another Grievance
              </button>
            </div>
          </div>
        ) : (
          <form className="complaint-form" onSubmit={handleSubmit}>
            {/* Step 1: Select Organization Tenant */}
            <div className="form-group">
              <label>Target Organization / Domain <span className="required">*</span></label>
              <select
                value={selectedOrgId}
                onChange={handleOrgChange}
                className="admin-select full-width highlight-select"
                required
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
              {selectedOrg && (
                <small className="field-hint">
                  {selectedOrg.description || "Official Grievance Division"} · {selectedOrg.type} Portal
                </small>
              )}
            </div>

            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">
                Grievance Title <span className="required">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Wi-Fi outage in Block C / Water pipeline burst on Main Road"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Dynamic Category Selector */}
            <div className="form-group">
              <label>
                Category ({selectedOrg?.name || "Organization Specific"}) <span className="required">*</span>
              </label>
              {selectedOrg?.categories && selectedOrg.categories.length > 0 ? (
                <div className="category-chips-grid">
                  {selectedOrg.categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.name}
                      className={`category-chip ${formData.category === cat.name ? "selected" : ""}`}
                      onClick={() => setFormData((prev) => ({ ...prev, category: cat.name }))}
                    >
                      <span className="chip-icon">{cat.icon || "📌"}</span>
                      <span className="chip-label">{cat.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  name="category"
                  type="text"
                  placeholder="Enter complaint category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              )}
            </div>

            {/* Priority Selector with SLA */}
            <div className="form-group">
              <label>Urgency Level & SLA Deadline</label>
              <div className="priority-selector-grid">
                {priorities.map((p) => (
                  <button
                    type="button"
                    key={p.value}
                    className={`priority-chip ${formData.priority === p.value ? "selected" : ""}`}
                    onClick={() => setFormData((prev) => ({ ...prev, priority: p.value }))}
                  >
                    <div className="priority-header">
                      <span className="priority-dot" style={{ backgroundColor: p.color }} />
                      <strong>{p.label}</strong>
                    </div>
                    <span className="priority-sla">{p.sla}</span>
                    <small>{p.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label htmlFor="location">
                Location & Specific Landmark
              </label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Lab 3, 2nd Floor / Opposite Library Gate"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">
                Comprehensive Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                placeholder="Explain the problem in detail, impact on daily operations, and when it began..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            {/* Evidence Photo Upload */}
            <div className="form-group">
              <label>Attach Evidence (Photograph / Document)</label>
              <div className="file-upload-card">
                {previewUrl ? (
                  <div className="attachment-preview-box">
                    <img src={previewUrl} alt="Evidence preview" className="attachment-thumb" />
                    <div className="attachment-meta">
                      <strong>{formData.attachmentName}</strong>
                      <span className="text-emerald">✓ Photo attached to record</span>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-attachment"
                      onClick={handleRemoveAttachment}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="file-drop-zone">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="file-hidden-input"
                    />
                    <span className="upload-icon">📷</span>
                    <div className="upload-instructions">
                      <strong>Click to upload photograph or document</strong>
                      <small>Supports PNG, JPG, JPEG up to 5MB</small>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Submitter Info */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="userName">Your Full Name</label>
                <input
                  id="userName"
                  name="userName"
                  type="text"
                  placeholder="Citizen / Member Name"
                  value={formData.userName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="userEmail">Your Email Address</label>
                <input
                  id="userEmail"
                  name="userEmail"
                  type="email"
                  placeholder="member@example.com"
                  value={formData.userEmail}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-submit-footer">
              <button
                type="submit"
                className="btn-submit-main"
                disabled={loading}
              >
                {loading ? "Registering in MongoDB..." : "Submit Grievance to Organization →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

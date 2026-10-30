import React, { useState, useEffect } from "react";
import { complaintAPI } from "../services/api";

export default function TrackComplaint({ initialTrackingId }) {
  const [trackingId, setTrackingId] = useState(initialTrackingId || "");
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Feedback State
  const [userRating, setUserRating] = useState(5);
  const [userFeedback, setUserFeedback] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  // Reopen State
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  useEffect(() => {
    if (initialTrackingId) {
      setTrackingId(initialTrackingId);
      performTrack(initialTrackingId);
    }
  }, [initialTrackingId]);

  async function performTrack(idToSearch) {
    const id = (idToSearch || trackingId).trim();
    if (!id) {
      setError("Please enter a valid tracking reference (e.g. CMP-2026-XXXXXXXX).");
      return;
    }

    setError("");
    setLoading(true);
    setComplaint(null);
    setFeedbackSuccess("");

    try {
      const data = await complaintAPI.track(id);
      setComplaint(data);
      if (data.rating) {
        setUserRating(data.rating);
        setUserFeedback(data.feedback || "");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No grievance found with reference "${id}". Please double-check your code.`);
      } else {
        setError(
          err.customMessage || "Unable to reach database. Please verify backend connection."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    performTrack();
  }

  // Submit Feedback & Rating
  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (!complaint?.id) return;
    setFeedbackSubmitting(true);
    try {
      await complaintAPI.submitFeedback(complaint.id, {
        rating: userRating,
        feedback: userFeedback,
      });
      setFeedbackSuccess("Thank you! Your citizen satisfaction feedback has been recorded.");
      performTrack(complaint.trackingId);
    } catch (err) {
      alert("Error submitting feedback: " + (err.customMessage || err.message));
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  // Submit Reopening
  async function handleReopenSubmit(e) {
    e.preventDefault();
    if (!complaint?.id || !reopenReason.trim()) return;
    setReopenSubmitting(true);
    try {
      await complaintAPI.reopen(complaint.id, {
        reason: reopenReason.trim(),
      });
      setShowReopenModal(false);
      setReopenReason("");
      performTrack(complaint.trackingId);
    } catch (err) {
      alert("Unable to reopen complaint: " + (err.customMessage || err.message));
    } finally {
      setReopenSubmitting(false);
    }
  }

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="track-container">
        {/* Header */}
        <div className="track-header">
          <span className="badge-pill">LIVE AUDIT & COMPLAINT TIMELINE</span>
          <h1 className="form-title">Live Grievance Tracking</h1>
          <p className="form-subtitle">
            Inspect real-time status milestones, officer remarks, assigned department, SLA escalation alerts, and submit resolution feedback.
          </p>
        </div>

        {/* Search Bar */}
        <form className="track-search-card" onSubmit={handleFormSubmit}>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Enter Tracking Reference (e.g. CMP-2026-3828A2E5)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-track-submit" disabled={loading}>
            {loading ? "Searching..." : "Track Live Status →"}
          </button>
        </form>

        {error && (
          <div className="alert-box error animate-fade-in">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <strong>Lookup Notice</strong>
              <p>{error}</p>
            </div>
            <button className="alert-dismiss" onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* Result Card */}
        {complaint && (
          <div className="tracking-result-card animate-fade-in">
            {/* Header Info */}
            <div className="result-header">
              <div className="result-title-group">
                <span className="reference-tag">{complaint.trackingId}</span>
                <h2>{complaint.title}</h2>
              </div>
              <div className="status-badge-wrapper">
                <span className={`status-pill ${complaint.status?.toLowerCase()}`}>
                  ● {complaint.status}
                </span>
                {complaint.isEscalated && (
                  <span className="escalation-alert-badge" title={complaint.escalationReason}>
                    🚨 ESCALATED
                  </span>
                )}
              </div>
            </div>

            {/* Escalation Notice */}
            {complaint.isEscalated && (
              <div className="escalation-banner">
                <span className="escalation-icon">⚠️</span>
                <div>
                  <strong>Case Escalated to Municipal Supervisor</strong>
                  <p>{complaint.escalationReason || "SLA deadline exceeded. Priority intervention activated."}</p>
                </div>
              </div>
            )}

            {/* Department Assignment Banner */}
            <div className="assignment-bar">
              <div className="assignment-item">
                <span className="assignment-label">Assigned Department</span>
                <strong>{complaint.assignedDepartment || "General Municipal Queue"}</strong>
              </div>
              <div className="assignment-divider" />
              <div className="assignment-item">
                <span className="assignment-label">Field Officer</span>
                <strong>{complaint.assignedOfficer || "Awaiting Officer Assignment"}</strong>
              </div>
              <div className="assignment-divider" />
              <div className="assignment-item">
                <span className="assignment-label">Target SLA Deadline</span>
                <strong className={complaint.isEscalated ? "text-rose" : ""}>
                  {complaint.targetResolutionDate
                    ? new Date(complaint.targetResolutionDate).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Standard SLA"}
                </strong>
              </div>
            </div>

            {/* Live Vertical Status History Timeline */}
            <div className="timeline-section">
              <h3 className="timeline-heading">Status History & Audit Trail</h3>
              <div className="vertical-timeline">
                {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
                  complaint.statusHistory.map((item, idx) => (
                    <div key={idx} className="timeline-entry">
                      <div className="timeline-dot" />
                      <div className="timeline-content-card">
                        <div className="timeline-header-row">
                          <span className={`status-pill-small ${item.status?.toLowerCase()}`}>
                            {item.status}
                          </span>
                          <span className="timeline-timestamp">
                            {item.timestamp
                              ? new Date(item.timestamp).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Logged"}
                          </span>
                        </div>
                        <p className="timeline-remarks">{item.remarks}</p>
                        <small className="timeline-author">Updated by: {item.updatedBy || "Municipal Authority"}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="timeline-entry">
                    <div className="timeline-dot" />
                    <div className="timeline-content-card">
                      <strong>SUBMITTED</strong>
                      <p>Grievance logged into municipal database.</p>
                      <small>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : ""}</small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Attachment (if present) */}
            {complaint.attachmentData && (
              <div className="evidence-display-box">
                <h4>Attached Photographic Evidence</h4>
                <div className="evidence-image-wrapper">
                  <img src={complaint.attachmentData} alt="Complaint evidence" className="evidence-img" />
                </div>
              </div>
            )}

            {/* Official Remarks (if present) */}
            {complaint.adminRemarks && (
              <div className="admin-remarks-card">
                <div className="remarks-header">
                  <span className="remarks-icon">🏛️</span>
                  <strong>Official Department Resolution Remarks:</strong>
                </div>
                <p className="remarks-text">{complaint.adminRemarks}</p>
              </div>
            )}

            {/* CSAT Rating & Feedback Section (Feature 6) */}
            {complaint.status === "RESOLVED" && (
              <div className="feedback-card">
                <div className="feedback-header">
                  <span className="feedback-icon">⭐</span>
                  <div>
                    <h4>Citizen Satisfaction Rating (CSAT)</h4>
                    <small>How satisfied are you with the municipal department's resolution?</small>
                  </div>
                </div>

                {complaint.rating ? (
                  <div className="existing-rating-box">
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`star ${star <= complaint.rating ? "active" : ""}`}>
                          ★
                        </span>
                      ))}
                      <strong className="rating-score">{complaint.rating}.0 / 5.0</strong>
                    </div>
                    {complaint.feedback && <p className="feedback-quote">"{complaint.feedback}"</p>}
                    <small className="feedback-date">
                      Feedback logged on{" "}
                      {complaint.feedbackSubmittedAt
                        ? new Date(complaint.feedbackSubmittedAt).toLocaleDateString()
                        : "Record"}
                    </small>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                    {feedbackSuccess && (
                      <div className="alert-box success">
                        <p>{feedbackSuccess}</p>
                      </div>
                    )}
                    <div className="rating-selector">
                      <span>Select Rating:</span>
                      <div className="stars-picker">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            className={`star-btn ${star <= userRating ? "selected" : ""}`}
                            onClick={() => setUserRating(star)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows="2"
                      placeholder="Share your thoughts on the timeliness and quality of this work..."
                      value={userFeedback}
                      onChange={(e) => setUserFeedback(e.target.value)}
                    />
                    <button type="submit" className="btn-feedback-submit" disabled={feedbackSubmitting}>
                      {feedbackSubmitting ? "Submitting..." : "Submit Rating & Feedback"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Reopen Action (Feature 6) */}
            {(complaint.status === "RESOLVED" || complaint.status === "REJECTED") && (
              <div className="reopen-prompt-card">
                <div className="reopen-info">
                  <strong>Issue not properly addressed or resurfaced?</strong>
                  <small>
                    Citizens can request a supervisor review under the Right to Public Service.
                    {complaint.reopenCount > 0 && ` (Previously reopened ${complaint.reopenCount} time/s)`}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-reopen-trigger"
                  onClick={() => setShowReopenModal(true)}
                >
                  🔄 Reopen This Grievance
                </button>
              </div>
            )}

            {/* Details Grid */}
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Category</span>
                <span className="detail-value">{complaint.category}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Priority Level</span>
                <span className={`priority-pill ${complaint.priority?.toLowerCase() || "medium"}`}>
                  {complaint.priority || "MEDIUM"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location & Landmark</span>
                <span className="detail-value">{complaint.location}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date Lodged</span>
                <span className="detail-value">
                  {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : "-"}
                </span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Grievance Description</span>
                <p className="detail-description">{complaint.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reopen Modal */}
        {showReopenModal && (
          <div className="modal-backdrop">
            <div className="modal-card animate-fade-in">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">OFFICIAL APPEAL</span>
                  <h3>Reopen Grievance #{complaint.trackingId}</h3>
                </div>
                <button className="modal-close" onClick={() => setShowReopenModal(false)}>×</button>
              </div>

              <p className="modal-note">
                Please explain specifically why the resolution is incomplete. This case will be escalated to a senior supervisor.
              </p>

              <form onSubmit={handleReopenSubmit} className="modal-form">
                <div className="form-group">
                  <label>Reason for Reopening <span className="required">*</span></label>
                  <textarea
                    rows="3"
                    placeholder="e.g. The leak was only temporarily covered with sand, water is still overflowing onto the road..."
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary-light" onClick={() => setShowReopenModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-glow" disabled={reopenSubmitting}>
                    {reopenSubmitting ? "Reopening & Escalating..." : "Confirm & Reopen Case"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

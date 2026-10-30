import React, { useState, useEffect } from "react";
import { complaintAPI } from "../services/api";

export default function MyComplaints({ user, onTrackComplaint, onGoToSubmit }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  async function fetchMyComplaints() {
    setLoading(true);
    setError("");
    try {
      const data = await complaintAPI.getMyComplaints();
      setComplaints(data || []);
    } catch (err) {
      setError(err.customMessage || "Unable to load complaints from backend.");
    } finally {
      setLoading(false);
    }
  }

  const filteredComplaints = complaints.filter((c) => {
    if (filter === "ALL") return true;
    return c.status === filter;
  });

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <span className="badge-pill">CITIZEN DASHBOARD</span>
            <h1 className="form-title">My Registered Grievances</h1>
            <p className="form-subtitle">
              Welcome back, <strong>{user?.name}</strong>. Monitor progress, review officer remarks, rate completed resolutions, or appeal unresolved cases.
            </p>
          </div>
          <button className="btn-primary-glow" onClick={onGoToSubmit}>
            + File New Grievance
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs-row">
          {["ALL", "SUBMITTED", "IN_PROGRESS", "RESOLVED", "REOPENED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              className={`filter-tab-btn ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab.replace("_", " ")}
              <span className="tab-count">
                {tab === "ALL"
                  ? complaints.length
                  : complaints.filter((c) => c.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="alert-box error animate-fade-in">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <strong>Error Loading Records</strong>
              <p>{error}</p>
            </div>
            <button className="btn-retry" onClick={fetchMyComplaints}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <span className="spinner-icon">⏳</span>
            <p>Fetching your grievances from MongoDB...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state-card">
            <span className="empty-icon">📭</span>
            <h3>No complaints in "{filter.replace("_", " ")}" status</h3>
            <p>You do not have any registered grievances under this filter.</p>
            <button className="btn-primary-glow" onClick={onGoToSubmit}>
              Submit a Complaint Now →
            </button>
          </div>
        ) : (
          <div className="complaint-cards-grid">
            {filteredComplaints.map((item) => (
              <div key={item.id || item.trackingId} className="complaint-item-card">
                <div className="card-top-bar">
                  <div className="tracking-id-group">
                    <span className="card-tracking-id">{item.trackingId}</span>
                    {item.isEscalated && (
                      <span className="escalation-tag-small">ESCALATED</span>
                    )}
                  </div>
                  <span className={`status-pill ${item.status?.toLowerCase()}`}>
                    ● {item.status}
                  </span>
                </div>

                <h3 className="card-title">{item.title}</h3>
                <p className="card-desc">{item.description}</p>

                <div className="card-meta-row">
                  <span className="card-category">📁 {item.category}</span>
                  <span className="card-location">📍 {item.location}</span>
                </div>

                {item.assignedDepartment && (
                  <div className="card-dept-badge">
                    <span>Assigned: <strong>{item.assignedDepartment}</strong></span>
                  </div>
                )}

                {item.rating && (
                  <div className="card-csat-badge">
                    <span>Citizen Rating: <strong>{item.rating} ★</strong></span>
                  </div>
                )}

                {item.adminRemarks && (
                  <div className="card-remarks-preview">
                    <strong>Official Note:</strong> {item.adminRemarks}
                  </div>
                )}

                <div className="card-footer">
                  <span className="card-date">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recent"}
                  </span>
                  <button
                    className="btn-card-action"
                    onClick={() => onTrackComplaint(item.trackingId)}
                  >
                    View Live Timeline →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

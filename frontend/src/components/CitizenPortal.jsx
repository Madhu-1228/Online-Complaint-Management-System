import React, { useState, useEffect } from "react";
import { complaintAPI, authAPI, organizationAPI, notificationAPI } from "../services/api";

const STATUS_STEPS = ["SUBMITTED", "PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export const DOMAIN_META = {
  MUNICIPALITY: {
    label: "Civic & Municipality",
    shortLabel: "Civic",
    icon: "🏛️",
    badgeClass: "muni",
    defaultPlaceholder: "e.g. Ward 12, 5th Cross Road, Near Central Water Tank",
    authority: "Apex Municipal Corporation",
    hotline: "1800-CIVIC-MUNI",
    email: "support@apex-municipality.gov",
    office: "Civic Square, Sector 1, Apex City",
  },
  COLLEGE: {
    label: "University & Campus",
    shortLabel: "Campus",
    icon: "🎓",
    badgeClass: "college",
    defaultPlaceholder: "e.g. Hostel Block B, Room 304 or CS Lab 3",
    authority: "Apex Institute of Technology",
    hotline: "+91 40-23456789",
    email: "registrar@apex.edu",
    office: "Academic Hills, Campus Road, South Block",
  },
  CORPORATE: {
    label: "Corporate Workplace",
    shortLabel: "Workplace",
    icon: "🏢",
    badgeClass: "corp",
    defaultPlaceholder: "e.g. Innovation Tower B, 4th Floor, Pod 14-20",
    authority: "TechCorp Global Headquarters",
    hotline: "+1 800-TECH-HELP",
    email: "helpdesk@techcorp.com",
    office: "Innovation Park, Tower B, Corporate Hub",
  },
  HEALTHCARE: {
    label: "Healthcare & Hospital",
    shortLabel: "Hospital",
    icon: "🏥",
    badgeClass: "health",
    defaultPlaceholder: "e.g. Inpatient Wing B, TPA Cashless Desk Counter 3",
    authority: "Apollo Care Multi-Specialty Hospital",
    hotline: "1800-APOLLO-CARE",
    email: "patienthelp@apollo.org",
    office: "Health City Boulevard, Medical Enclave",
  },
  TRANSPORT: {
    label: "Public Transit & Transport",
    shortLabel: "Transit",
    icon: "🚆",
    badgeClass: "transit",
    defaultPlaceholder: "e.g. Central Metro Station, Gate #4 or Bus Route 45A",
    authority: "City Metro & Transit Express",
    hotline: "1800-TRANSIT-LINE",
    email: "support@citytransit.gov",
    office: "Transit Central Hub, Terminal 1",
  },
};

export function getDomainInfo(complaintOrOrg) {
  const type = (complaintOrOrg?.domain || complaintOrOrg?.type || "MUNICIPALITY").toUpperCase();
  return DOMAIN_META[type] || {
    label: complaintOrOrg?.organizationName || "Public Authority",
    shortLabel: "General",
    icon: "📌",
    badgeClass: "other",
    defaultPlaceholder: "e.g. Enter specific location, desk, room, or landmark",
    authority: complaintOrOrg?.organizationName || "General Authority",
    hotline: "1800-PORTAL-HELP",
    email: "support@civiccare.org",
    office: "Administrative Services Division",
  };
}

export default function CitizenPortal({ user, onLogout, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState("home"); // home, profile, submit, complaints, track, notifications, feedback, contact
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Selected complaint for modal view
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Submit Complaint Form State
  const [submitForm, setSubmitForm] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    priority: "MEDIUM",
    attachmentName: "",
    attachmentData: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  // Track Complaint State
  const [trackQuery, setTrackQuery] = useState("");
  const [trackedComplaint, setTrackedComplaint] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    newPassword: "",
    currentPassword: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // My Complaints Filter
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [domainFilter, setDomainFilter] = useState("ALL");
  const [complaintSearch, setComplaintSearch] = useState("");

  // Contact Us Domain Tab
  const [contactDomain, setContactDomain] = useState("MUNICIPALITY");

  // Mobile sidebar open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadCitizenData();
  }, [user]);

  async function loadCitizenData() {
    setLoading(true);
    try {
      const [myList, notifData, orgs] = await Promise.all([
        complaintAPI.getMyComplaints().catch(() => []),
        notificationAPI.getMyNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
        organizationAPI.getActive().catch(() => []),
      ]);

      setComplaints(myList || []);
      setNotifications(notifData?.notifications || []);
      setUnreadCount(notifData?.unreadCount || 0);
      setOrganizations(orgs || []);

      if (orgs && orgs.length > 0) {
        const found = orgs.find((o) => o.id === user?.organizationId) || orgs[0];
        setCurrentOrg(found);
        if (!submitForm.category && found.categories?.length > 0) {
          setSubmitForm((prev) => ({ ...prev, category: found.categories[0].name }));
        }
      }

      setProfileForm({
        name: user?.name || "",
        phone: user?.phone || "",
        address: user?.address || "",
        newPassword: "",
        currentPassword: "",
      });
    } catch (err) {
      console.error("Error loading citizen data:", err);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  }

  // Submit Complaint Handler
  async function handleSubmitComplaint(e) {
    e.preventDefault();
    if (!submitForm.title.trim() || !submitForm.description.trim() || !submitForm.location.trim()) {
      showToast("Please fill in all required grievance details.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: submitForm.title.trim(),
        category: submitForm.category || currentOrg?.categories?.[0]?.name || "General Grievance",
        description: submitForm.description.trim(),
        location: submitForm.location.trim(),
        priority: submitForm.priority || "MEDIUM",
        organizationId: currentOrg?.id || user?.organizationId || "",
        attachmentName: submitForm.attachmentName,
        attachmentData: submitForm.attachmentData,
      };

      const res = await complaintAPI.submit(payload);
      setSubmittedComplaint(res);
      showToast(`Grievance submitted successfully! Reference: ${res.trackingId}`);
      // Refresh list
      complaintAPI.getMyComplaints().then((l) => setComplaints(l || []));
      // Reset form
      setSubmitForm({
        title: "",
        category: currentOrg?.categories?.[0]?.name || "",
        description: "",
        location: "",
        priority: "MEDIUM",
        attachmentName: "",
        attachmentData: "",
      });
    } catch (err) {
      showToast(err.customMessage || "Failed to submit complaint.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle File Attachment Upload
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size exceeds 5MB limit.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setSubmitForm((prev) => ({
        ...prev,
        attachmentName: file.name,
        attachmentData: uploadEvent.target.result,
      }));
    };
    reader.readAsDataURL(file);
  }

  // Track by ID Handler
  async function handleTrackSearch(trackingId) {
    const idToTrack = trackingId || trackQuery;
    if (!idToTrack || !idToTrack.trim()) {
      setTrackError("Please enter a valid Complaint Reference ID.");
      return;
    }

    setTrackingLoading(true);
    setTrackError("");
    try {
      const res = await complaintAPI.track(idToTrack.trim());
      setTrackedComplaint(res);
    } catch (err) {
      setTrackError(err.customMessage || `No grievance record found for ID: ${idToTrack}`);
      setTrackedComplaint(null);
    } finally {
      setTrackingLoading(false);
    }
  }

  // Profile Save Handler
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast("Name cannot be empty.", "error");
      return;
    }

    setProfileSaving(true);
    try {
      const payload = {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
      };
      if (profileForm.newPassword) {
        payload.newPassword = profileForm.newPassword;
        payload.currentPassword = profileForm.currentPassword;
      }

      const res = await authAPI.updateProfile(payload);
      showToast("Profile updated successfully!");
      if (onUpdateUser && res.user) {
        onUpdateUser(res.user);
      }
      setProfileForm((prev) => ({ ...prev, newPassword: "", currentPassword: "" }));
    } catch (err) {
      showToast(err.customMessage || "Failed to update profile.", "error");
    } finally {
      setProfileSaving(false);
    }
  }

  // Feedback Submit Handler
  async function handleSaveFeedback(complaintId) {
    if (!feedbackRating) {
      showToast("Please choose a star rating.", "error");
      return;
    }

    setFeedbackSubmitting(true);
    try {
      await complaintAPI.submitFeedback(complaintId, {
        rating: feedbackRating,
        feedback: feedbackComment.trim(),
      });
      showToast("Thank you! Your feedback has been recorded.");
      complaintAPI.getMyComplaints().then((l) => setComplaints(l || []));
      setFeedbackComment("");
      setSelectedComplaint(null);
    } catch (err) {
      showToast(err.customMessage || "Failed to record feedback.", "error");
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING" && (c.status === "SUBMITTED" || c.status === "PENDING")) ||
      c.status === statusFilter;

    const cDomain = (c.domain || "MUNICIPALITY").toUpperCase();
    const matchesDomain =
      domainFilter === "ALL" || cDomain === domainFilter.toUpperCase();

    const matchesSearch =
      !complaintSearch.trim() ||
      c.title?.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.trackingId?.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.category?.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.organizationName?.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.location?.toLowerCase().includes(complaintSearch.toLowerCase());

    return matchesStatus && matchesDomain && matchesSearch;
  });

  // Counts for Stats
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status === "SUBMITTED" || c.status === "PENDING"
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED"
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === "RESOLVED" || c.status === "CLOSED"
  ).length;

  return (
    <div className="portal-layout animate-fade-in">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`portal-toast ${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <p>{toast.message}</p>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`portal-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🏛️</div>
          <div>
            <h3>CivicCare</h3>
            <span className="badge-role citizen">Citizen Portal</span>
          </div>
        </div>

        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
          </div>
          <div className="sidebar-user-info">
            <strong>{user?.name || "Citizen"}</strong>
            <span>{user?.email || "devan@.com"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === "home" ? "active" : ""}`}
            onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => { setActiveTab("profile"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">My Profile</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "submit" ? "active" : ""}`}
            onClick={() => { setActiveTab("submit"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-label">Submit Complaint</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "complaints" ? "active" : ""}`}
            onClick={() => { setActiveTab("complaints"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">My Complaints</span>
            {totalCount > 0 && <span className="nav-counter">{totalCount}</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "track" ? "active" : ""}`}
            onClick={() => { setActiveTab("track"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-label">Track Complaint</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => { setActiveTab("notifications"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">🔔</span>
            <span className="nav-label">Notifications</span>
            {unreadCount > 0 && <span className="nav-counter unread">{unreadCount}</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "feedback" ? "active" : ""}`}
            onClick={() => { setActiveTab("feedback"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Feedback</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "contact" ? "active" : ""}`}
            onClick={() => { setActiveTab("contact"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">📞</span>
            <span className="nav-label">Contact Us</span>
          </button>

          <div className="sidebar-divider" />

          <button className="sidebar-nav-item logout" onClick={onLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main View Container */}
      <main className="portal-main-area">
        {/* Top Header Bar */}
        <header className="portal-topbar">
          <div className="topbar-left">
            <button
              className="btn-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <div className="topbar-title-block">
              <h2>
                {activeTab === "home" && "Citizen Grievance Dashboard"}
                {activeTab === "profile" && "Citizen Profile & Account"}
                {activeTab === "submit" && "Lodge a Public Grievance"}
                {activeTab === "complaints" && "My Lodged Complaints"}
                {activeTab === "track" && "Live Grievance Tracking"}
                {activeTab === "notifications" && "Alerts & Notifications"}
                {activeTab === "feedback" && "Citizen CSAT & Resolution Feedback"}
                {activeTab === "contact" && "Civic Support & Contact"}
              </h2>
              <span className="topbar-subtitle">
                {currentOrg?.name || "Apex Municipal Corporation"} · Public Service Portal
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <button
              className="topbar-quick-action"
              onClick={() => setActiveTab("submit")}
            >
              <span>+</span> Lodge Grievance
            </button>

            <button
              className="topbar-notif-btn"
              onClick={() => setActiveTab("notifications")}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="topbar-notif-badge">{unreadCount}</span>}
            </button>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <div className="portal-content-box">
          {/* ==================== 1. HOME TAB ==================== */}
          {activeTab === "home" && (
            <div className="tab-pane animate-fade-in">
              {/* Welcome Banner */}
              <div className="citizen-welcome-hero">
                <div className="welcome-text">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span className="badge-domain muni" style={{ fontSize: "11px" }}>🌐 Multi-Domain Public Network</span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Cross-Sector Redressal Platform</span>
                  </div>
                  <h3>Welcome back, {user?.name || "Citizen"}! 👋</h3>
                  <p>
                    Lodge, track, and monitor grievance resolutions across <strong>Civic Municipal Services, College & Campus, Corporate Workplace, Healthcare,</strong> and <strong>Public Transit</strong> with guaranteed SLA milestones.
                  </p>

                  {/* Domain Quick Chips */}
                  <div className="citizen-domains-row">
                    <button
                      className={`domain-chip ${domainFilter === "ALL" ? "active" : ""}`}
                      onClick={() => {
                        setDomainFilter("ALL");
                        setActiveTab("complaints");
                      }}
                    >
                      🌐 All Sectors <span className="domain-chip-count">{complaints.length}</span>
                    </button>
                    {Object.entries(DOMAIN_META).map(([key, meta]) => {
                      const count = complaints.filter((c) => (c.domain || "MUNICIPALITY").toUpperCase() === key).length;
                      return (
                        <button
                          key={key}
                          className={`domain-chip ${domainFilter === key ? "active" : ""}`}
                          onClick={() => {
                            setDomainFilter(key);
                            setActiveTab("complaints");
                          }}
                        >
                          <span>{meta.icon}</span> {meta.shortLabel}{" "}
                          <span className="domain-chip-count">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="welcome-actions">
                  <button
                    className="btn-hero-primary"
                    onClick={() => setActiveTab("submit")}
                  >
                    📝 Submit Grievance
                  </button>
                  <button
                    className="btn-hero-secondary"
                    onClick={() => setActiveTab("track")}
                  >
                    🔍 Track Status
                  </button>
                </div>
              </div>

              {/* 4 Stat Metric Cards */}
              <div className="portal-metrics-grid">
                <div className="portal-stat-card total" onClick={() => { setActiveTab("complaints"); setStatusFilter("ALL"); }}>
                  <div className="stat-icon-wrapper blue">📊</div>
                  <div className="stat-info">
                    <span className="stat-label">Total Submitted</span>
                    <strong className="stat-value">{totalCount}</strong>
                    <small>All grievances on record</small>
                  </div>
                </div>

                <div className="portal-stat-card pending" onClick={() => { setActiveTab("complaints"); setStatusFilter("PENDING"); }}>
                  <div className="stat-icon-wrapper amber">⏳</div>
                  <div className="stat-info">
                    <span className="stat-label">Pending Review</span>
                    <strong className="stat-value text-amber">{pendingCount}</strong>
                    <small>Awaiting triage / assignment</small>
                  </div>
                </div>

                <div className="portal-stat-card progress" onClick={() => { setActiveTab("complaints"); setStatusFilter("IN_PROGRESS"); }}>
                  <div className="stat-icon-wrapper sky">🛠️</div>
                  <div className="stat-info">
                    <span className="stat-label">In Progress</span>
                    <strong className="stat-value text-sky">{inProgressCount}</strong>
                    <small>Department officer dispatched</small>
                  </div>
                </div>

                <div className="portal-stat-card resolved" onClick={() => { setActiveTab("complaints"); setStatusFilter("RESOLVED"); }}>
                  <div className="stat-icon-wrapper emerald">✅</div>
                  <div className="stat-info">
                    <span className="stat-label">Resolved Issues</span>
                    <strong className="stat-value text-emerald">{resolvedCount}</strong>
                    <small>Work completed & verified</small>
                  </div>
                </div>
              </div>

              {/* Recent Complaints Table */}
              <div className="portal-card">
                <div className="card-header-flex">
                  <div>
                    <h3>Recent Grievances</h3>
                    <p className="card-subtitle">Your latest submissions and active progress</p>
                  </div>
                  <button
                    className="btn-link-action"
                    onClick={() => setActiveTab("complaints")}
                  >
                    View All ({complaints.length}) →
                  </button>
                </div>

                {complaints.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="empty-icon">📭</div>
                    <h4>No complaints submitted yet</h4>
                    <p>Have an issue with roads, water, or streetlights? File a complaint now.</p>
                    <button
                      className="btn-auth-submit small"
                      onClick={() => setActiveTab("submit")}
                    >
                      Lodge Your First Grievance →
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Complaint ID</th>
                          <th>Sector</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complaints.slice(0, 5).map((c) => (
                          <tr key={c.id}>
                            <td>
                              <strong className="text-mono">{c.trackingId}</strong>
                            </td>
                            <td>
                              <span className={`badge-domain ${getDomainInfo(c).badgeClass}`}>
                                {getDomainInfo(c).icon} {getDomainInfo(c).shortLabel}
                              </span>
                            </td>
                            <td>
                              <div className="cell-title">{c.title}</div>
                              <small className="cell-location">📍 {c.location}</small>
                            </td>
                            <td>
                              <span className="tag-category">{c.category}</span>
                            </td>
                            <td>
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Recent"}
                            </td>
                            <td>
                              <span className={`status-badge ${c.status?.toLowerCase()}`}>
                                {c.status?.replace("_", " ")}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-action-view"
                                onClick={() => setSelectedComplaint(c)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 2. MY PROFILE TAB ==================== */}
          {activeTab === "profile" && (
            <div className="tab-pane animate-fade-in">
              <div className="profile-grid">
                {/* Profile Identity Card */}
                <div className="portal-card profile-id-card">
                  <div className="profile-avatar-large">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
                  </div>
                  <h3>{user?.name || "Citizen"}</h3>
                  <span className="badge-role citizen">Verified Citizen</span>
                  <div className="profile-meta-list">
                    <div className="meta-row">
                      <span>Email Address:</span>
                      <strong>{user?.email}</strong>
                    </div>
                    <div className="meta-row">
                      <span>Account Status:</span>
                      <strong className="text-emerald">ACTIVE ✓</strong>
                    </div>
                    <div className="meta-row">
                      <span>Municipality:</span>
                      <strong>{user?.organizationName || "Apex Municipal Corporation"}</strong>
                    </div>
                    <div className="meta-row">
                      <span>Total Grievances:</span>
                      <strong>{complaints.length}</strong>
                    </div>
                  </div>
                </div>

                {/* Edit Information Form */}
                <div className="portal-card">
                  <div className="card-header">
                    <h3>Personal Information</h3>
                    <p className="card-subtitle">
                      Keep your contact details up to date for official SMS/email updates.
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="portal-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Full Name <span className="required">*</span></label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Email Address (Account ID)</label>
                        <input
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="input-disabled"
                          title="Email address is linked to your account"
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Phone Number <span className="required">*</span></label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Residential Address / Ward</label>
                        <input
                          type="text"
                          placeholder="e.g. House No. 42, Sector 8, Ward 12"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-section-header">
                      <h4>Change Password (Optional)</h4>
                      <small>Leave blank if you do not want to change your password.</small>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Current Password</label>
                        <input
                          type="password"
                          placeholder="Required only when changing password"
                          value={profileForm.currentPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary-glow"
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Saving..." : "Save Profile Changes →"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 3. SUBMIT COMPLAINT TAB ==================== */}
          {activeTab === "submit" && (
            <div className="tab-pane animate-fade-in">
              {submittedComplaint ? (
                <div className="portal-card success-submission-card animate-fade-in">
                  <div className="success-icon-badge">🎉</div>
                  <h3>Grievance Successfully Lodged!</h3>
                  <p>
                    Your issue has been recorded in the civic registry and routed to the municipal
                    triage department with active SLA monitoring.
                  </p>

                  <div className="tracking-code-box">
                    <span>UNIQUE REFERENCE ID</span>
                    <strong>{submittedComplaint.trackingId}</strong>
                    <small>Please quote this reference number in all future communications.</small>
                  </div>

                  <div className="success-actions">
                    <button
                      className="btn-primary-glow"
                      onClick={() => {
                        setTrackQuery(submittedComplaint.trackingId);
                        handleTrackSearch(submittedComplaint.trackingId);
                        setActiveTab("track");
                        setSubmittedComplaint(null);
                      }}
                    >
                      🔍 Track Status Now
                    </button>
                    <button
                      className="btn-secondary-light"
                      onClick={() => {
                        setActiveTab("complaints");
                        setSubmittedComplaint(null);
                      }}
                    >
                      View in My Complaints →
                    </button>
                    <button
                      className="btn-action-view"
                      onClick={() => setSubmittedComplaint(null)}
                    >
                      + File Another Complaint
                    </button>
                  </div>
                </div>
              ) : (
                <div className="portal-card">
                  <div className="card-header">
                    <h3>Multi-Sector Grievance Submission</h3>
                    <p className="card-subtitle">
                      Choose the responsible authority below, provide specific issue details, and receive an instant reference tracking ID.
                    </p>
                  </div>

                  {/* Multi-Domain / Authority Selector */}
                  <div className="domain-selection-section">
                    <label className="section-title-label" style={{ display: "block", fontWeight: 700, marginBottom: "8px", fontSize: "14px", color: "#1e293b" }}>
                      1. Select Grievance Sector & Target Authority <span className="required">*</span>
                    </label>
                    <div className="domain-selector-grid">
                      {organizations.map((org) => {
                        const meta = getDomainInfo(org);
                        const isSelected = currentOrg?.id === org.id;
                        return (
                          <div
                            key={org.id}
                            className={`domain-selector-card ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              setCurrentOrg(org);
                              if (org.categories && org.categories.length > 0) {
                                setSubmitForm((prev) => ({
                                  ...prev,
                                  category: org.categories[0].name,
                                  priority: org.categories[0].defaultPriority || "MEDIUM",
                                }));
                              }
                            }}
                          >
                            <div className="domain-card-header">
                              <span className="domain-card-icon">{meta.icon}</span>
                              {isSelected ? (
                                <span className="domain-check-badge">✓ Selected</span>
                              ) : (
                                <span className={`badge-domain ${meta.badgeClass}`}>{meta.shortLabel}</span>
                              )}
                            </div>
                            <div className="domain-card-title">{meta.label}</div>
                            <div className="domain-card-authority">{org.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Domain Info Banner */}
                  {currentOrg && (
                    <div className="domain-info-banner animate-fade-in">
                      <div className="domain-info-details">
                        <h4>{getDomainInfo(currentOrg).icon} {currentOrg.name}</h4>
                        <p>{currentOrg.description || "Public Service & Grievance Redressal Board"}</p>
                      </div>
                      <div className="domain-info-meta">
                        <span>📞 Hotline: <strong>{currentOrg.contactPhone || getDomainInfo(currentOrg).hotline}</strong></span>
                        <span>⏱️ Defined SLA: <strong>12h - 72h Resolution</strong></span>
                        <span>📍 Hub: <strong>{currentOrg.address || "Main Center"}</strong></span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitComplaint} className="portal-form">
                    <div className="form-group">
                      <label>
                        Complaint Title / Summary <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Severe drinking water pipeline leakage or Metro card overcharge"
                        value={submitForm.title}
                        onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>
                          Complaint Category ({currentOrg?.name || "Selected Authority"}) <span className="required">*</span>
                        </label>
                        <select
                          className="admin-select full-width"
                          value={submitForm.category}
                          onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}
                          required
                        >
                          {currentOrg?.categories?.map((cat) => (
                            <option key={cat.name} value={cat.name}>
                              {cat.icon || "📌"} {cat.name} (SLA: {cat.slaHours}h)
                            </option>
                          )) || (
                            <>
                              <option value="General Grievance">📌 General Grievance</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>
                          Priority Level <span className="required">*</span>
                        </label>
                        <select
                          className="admin-select full-width"
                          value={submitForm.priority}
                          onChange={(e) => setSubmitForm({ ...submitForm, priority: e.target.value })}
                        >
                          <option value="LOW">Low (Routine maintenance / General)</option>
                          <option value="MEDIUM">Medium (Standard attention)</option>
                          <option value="HIGH">High (Urgent public / academic impact)</option>
                          <option value="URGENT">Urgent (Safety / Medical / Critical hazard)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        Exact Location & Landmark <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder={getDomainInfo(currentOrg).defaultPlaceholder}
                        value={submitForm.location}
                        onChange={(e) => setSubmitForm({ ...submitForm, location: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Detailed Description of Grievance <span className="required">*</span>
                      </label>
                      <textarea
                        rows="4"
                        placeholder="Describe the severity, duration of the issue, and any hazards involved..."
                        value={submitForm.description}
                        onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                        required
                      />
                    </div>

                    {/* Supporting Image or Document */}
                    <div className="form-group">
                      <label>Supporting Evidence (Photo or Document)</label>
                      <div className="file-upload-box">
                        <input
                          type="file"
                          id="file-attachment"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="file-input-hidden"
                        />
                        <label htmlFor="file-attachment" className="file-upload-label">
                          <span className="upload-icon">📸</span>
                          <span>
                            {submitForm.attachmentName
                              ? `Selected: ${submitForm.attachmentName}`
                              : "Click to upload photographic evidence or document (Max 5MB)"}
                          </span>
                        </label>
                        {submitForm.attachmentData && submitForm.attachmentData.startsWith("data:image") && (
                          <div className="upload-preview-thumb">
                            <img src={submitForm.attachmentData} alt="Evidence preview" />
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-auth-submit"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting to Registry..." : "Submit Official Grievance →"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ==================== 4. MY COMPLAINTS TAB ==================== */}
          {activeTab === "complaints" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="filter-bar">
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search complaints by ID, title, domain, or category..."
                      value={complaintSearch}
                      onChange={(e) => setComplaintSearch(e.target.value)}
                    />
                  </div>

                  <div className="filter-pill-group">
                    {["ALL", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
                      <button
                        key={s}
                        className={`filter-pill ${statusFilter === s ? "active" : ""}`}
                        onClick={() => setStatusFilter(s)}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Domain Filter Pills */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <button
                    className={`domain-switch-pill ${domainFilter === "ALL" ? "active" : ""}`}
                    onClick={() => setDomainFilter("ALL")}
                  >
                    🌐 All Domains ({complaints.length})
                  </button>
                  {Object.entries(DOMAIN_META).map(([key, meta]) => {
                    const count = complaints.filter((c) => (c.domain || "MUNICIPALITY").toUpperCase() === key).length;
                    return (
                      <button
                        key={key}
                        className={`domain-switch-pill ${domainFilter === key ? "active" : ""}`}
                        onClick={() => setDomainFilter(key)}
                      >
                        <span>{meta.icon}</span> {meta.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {filteredComplaints.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="empty-icon">📂</div>
                    <h4>No grievances found</h4>
                    <p>No complaints match the selected filter criteria.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Complaint ID</th>
                          <th>Sector</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Date Lodged</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComplaints.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <strong className="text-mono">{c.trackingId}</strong>
                            </td>
                            <td>
                              <span className={`badge-domain ${getDomainInfo(c).badgeClass}`}>
                                {getDomainInfo(c).icon} {getDomainInfo(c).shortLabel}
                              </span>
                            </td>
                            <td>
                              <div className="cell-title">{c.title}</div>
                              <small className="cell-location">📍 {c.location}</small>
                            </td>
                            <td>
                              <span className="tag-category">{c.category}</span>
                            </td>
                            <td>
                              <span className={`priority-tag ${c.priority?.toLowerCase()}`}>
                                {c.priority}
                              </span>
                            </td>
                            <td>
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </td>
                            <td>
                              <span className={`status-badge ${c.status?.toLowerCase()}`}>
                                {c.status?.replace("_", " ")}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-action-view"
                                onClick={() => setSelectedComplaint(c)}
                              >
                                View Details →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 5. TRACK COMPLAINT TAB ==================== */}
          {activeTab === "track" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="card-header">
                  <h3>Track Public Grievance Status</h3>
                  <p className="card-subtitle">
                    Enter any valid Complaint Tracking ID to monitor live investigation progress and department remarks.
                  </p>
                </div>

                <div className="track-search-bar">
                  <input
                    type="text"
                    placeholder="Enter Tracking ID (e.g. CMP-2026-XXXXXXXX)"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTrackSearch();
                    }}
                  />
                  <button
                    className="btn-primary-glow"
                    onClick={() => handleTrackSearch()}
                    disabled={trackingLoading}
                  >
                    {trackingLoading ? "Searching..." : "Track Status →"}
                  </button>
                </div>

                {trackError && (
                  <div className="alert-box error animate-fade-in">
                    <span>⚠️</span>
                    <p>{trackError}</p>
                  </div>
                )}

                {trackedComplaint && (
                  <div className="track-result-box animate-fade-in">
                    <div className="track-summary-header">
                      <div>
                        <span className="tag-ref">OFFICIAL REFERENCE</span>
                        <h2>{trackedComplaint.trackingId}</h2>
                        <h4 className="track-case-title">{trackedComplaint.title}</h4>
                      </div>
                      <div className="track-header-badges">
                        <span className={`status-badge large ${trackedComplaint.status?.toLowerCase()}`}>
                          {trackedComplaint.status?.replace("_", " ")}
                        </span>
                        <span className={`priority-tag ${trackedComplaint.priority?.toLowerCase()}`}>
                          {trackedComplaint.priority} Priority
                        </span>
                      </div>
                    </div>

                    {/* Progress Pipeline Stepper */}
                    <div className="stepper-workflow-box">
                      <div className="stepper-container">
                        {STATUS_STEPS.map((step, idx) => {
                          const currentIdx = STATUS_STEPS.indexOf(trackedComplaint.status);
                          const isComplete = currentIdx >= idx;
                          const isCurrent = currentIdx === idx;

                          return (
                            <div
                              key={step}
                              className={`step-point ${isComplete ? "complete" : ""} ${isCurrent ? "current" : ""}`}
                            >
                              <div className="step-circle">
                                {isComplete && !isCurrent ? "✓" : idx + 1}
                              </div>
                              <span className="step-text">{step.replace("_", " ")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="track-details-grid">
                      <div className="track-detail-item">
                        <span>Category:</span>
                        <strong>{trackedComplaint.category}</strong>
                      </div>
                      <div className="track-detail-item">
                        <span>Assigned Department:</span>
                        <strong>{trackedComplaint.assignedDepartment || "Triage Review"}</strong>
                      </div>
                      <div className="track-detail-item">
                        <span>Responsible Officer:</span>
                        <strong>{trackedComplaint.assignedOfficer || "Pending Allocation"}</strong>
                      </div>
                      <div className="track-detail-item">
                        <span>Location Landmark:</span>
                        <strong>{trackedComplaint.location}</strong>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="track-description-section">
                      <h5>Grievance Description:</h5>
                      <p>{trackedComplaint.description}</p>
                    </div>

                    {/* Attached Evidence Preview */}
                    {trackedComplaint.attachmentData && (
                      <div className="track-evidence-section">
                        <h5>Attached Photographic Evidence:</h5>
                        <img
                          src={trackedComplaint.attachmentData}
                          alt="Evidence"
                          className="evidence-image-preview"
                        />
                      </div>
                    )}

                    {/* Timeline Audit History */}
                    <div className="track-timeline-section">
                      <h5>Audit & Progress History</h5>
                      <div className="timeline-trail">
                        {trackedComplaint.statusHistory?.map((item, i) => (
                          <div key={i} className="timeline-entry">
                            <div className="timeline-marker" />
                            <div className="timeline-body">
                              <div className="timeline-top">
                                <span className={`status-badge small ${item.status?.toLowerCase()}`}>
                                  {item.status?.replace("_", " ")}
                                </span>
                                <small>
                                  {item.timestamp
                                    ? new Date(item.timestamp).toLocaleString([], {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Recorded"}
                                </small>
                              </div>
                              <p className="timeline-remarks">{item.remarks}</p>
                              <small className="timeline-by">By: {item.updatedBy || "Administration"}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 6. NOTIFICATIONS TAB ==================== */}
          {activeTab === "notifications" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="card-header-flex">
                  <div>
                    <h3>Notification Center</h3>
                    <p className="card-subtitle">
                      Live status milestone transitions and administrative communications.
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className="btn-mark-all"
                      onClick={async () => {
                        await notificationAPI.markAllAsRead();
                        const refreshed = await notificationAPI.getMyNotifications();
                        setNotifications(refreshed?.notifications || []);
                        setUnreadCount(0);
                        showToast("All notifications marked as read.");
                      }}
                    >
                      ✓ Mark all as read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="empty-icon">🔕</div>
                    <h4>No notifications right now</h4>
                    <p>You will receive instant alerts when your grievance status changes.</p>
                  </div>
                ) : (
                  <div className="notifications-stream">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notification-card ${!n.read ? "unread" : ""}`}
                        onClick={async () => {
                          if (!n.read) {
                            await notificationAPI.markAsRead(n.id);
                            n.read = true;
                            setUnreadCount((prev) => Math.max(0, prev - 1));
                          }
                          if (n.complaintTrackingId) {
                            setTrackQuery(n.complaintTrackingId);
                            handleTrackSearch(n.complaintTrackingId);
                            setActiveTab("track");
                          }
                        }}
                      >
                        <div className="notif-icon">
                          {n.type === "STATUS_UPDATE" ? "🔄" : n.type === "ASSIGNMENT" ? "📋" : n.type === "ANNOUNCEMENT" ? "📢" : "⚡"}
                        </div>
                        <div className="notif-content">
                          <div className="notif-header">
                            <strong>{n.title}</strong>
                            <small>
                              {n.createdAt
                                ? new Date(n.createdAt).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Recently"}
                            </small>
                          </div>
                          <p>{n.message}</p>
                          {n.complaintTrackingId && (
                            <span className="notif-link">
                              View Grievance #{n.complaintTrackingId} →
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 7. FEEDBACK TAB ==================== */}
          {activeTab === "feedback" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="card-header">
                  <h3>Citizen Feedback & Satisfaction Rating</h3>
                  <p className="card-subtitle">
                    Rate the resolution quality of completed municipal works to help ensure department accountability.
                  </p>
                </div>

                {complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="empty-icon">⭐</div>
                    <h4>No resolved grievances ready for feedback</h4>
                    <p>Once a filed complaint is marked resolved by municipal engineers, you can rate the outcome here.</p>
                  </div>
                ) : (
                  <div className="feedback-list-grid">
                    {complaints
                      .filter((c) => c.status === "RESOLVED" || c.status === "CLOSED")
                      .map((c) => (
                        <div key={c.id} className="feedback-item-card">
                          <div className="feedback-card-top">
                            <div>
                              <strong className="text-mono">{c.trackingId}</strong>
                              <h4>{c.title}</h4>
                              <small>Department: {c.assignedDepartment || "Civic Services"}</small>
                            </div>
                            <span className="status-badge resolved">RESOLVED ✓</span>
                          </div>

                          {c.rating ? (
                            <div className="feedback-submitted-box">
                              <div className="stars-display">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`star ${star <= c.rating ? "filled" : ""}`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="rating-score">({c.rating}/5 Stars)</span>
                              </div>
                              {c.feedback && <p className="feedback-quote">"{c.feedback}"</p>}
                              <small className="text-muted">
                                Submitted on{" "}
                                {c.feedbackSubmittedAt
                                  ? new Date(c.feedbackSubmittedAt).toLocaleDateString()
                                  : "Record"}
                              </small>
                            </div>
                          ) : (
                            <div className="feedback-input-box">
                              <label>Rate Department Performance:</label>
                              <div className="star-picker">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    className={`btn-star ${star <= feedbackRating ? "active" : ""}`}
                                    onClick={() => setFeedbackRating(star)}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>

                              <textarea
                                rows="2"
                                placeholder="Add comments regarding service timeliness and cleanliness of work..."
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                              />

                              <button
                                className="btn-primary-glow small"
                                onClick={() => handleSaveFeedback(c.id)}
                                disabled={feedbackSubmitting}
                              >
                                {feedbackSubmitting ? "Submitting..." : "Submit Rating →"}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 8. CONTACT US TAB ==================== */}
          {activeTab === "contact" && (
            <div className="tab-pane animate-fade-in">
              {/* Sector Navigation Tabs */}
              <div className="contact-domain-tabs">
                {Object.entries(DOMAIN_META).map(([key, meta]) => (
                  <button
                    key={key}
                    className={`contact-domain-tab-btn ${contactDomain === key ? "active" : ""}`}
                    onClick={() => setContactDomain(key)}
                  >
                    <span>{meta.icon}</span> {meta.label}
                  </button>
                ))}
              </div>

              <div className="contact-grid">
                <div className="portal-card">
                  <div className="card-header">
                    <h3>
                      {DOMAIN_META[contactDomain]?.icon} {DOMAIN_META[contactDomain]?.label} Support Helplines
                    </h3>
                    <p className="card-subtitle">
                      24/7 emergency escalation numbers and dedicated department helpdesks.
                    </p>
                  </div>

                  <div className="contact-helpline-list">
                    {contactDomain === "MUNICIPALITY" && (
                      <>
                        <div className="helpline-item">
                          <span className="helpline-icon">🚰</span>
                          <div>
                            <strong>Water Supply & Sewerage Emergency Cell</strong>
                            <p>1800-WATER-REPAIR · Toll-Free 24x7</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">⚡</span>
                          <div>
                            <strong>Electricity Board & Transformer Breakdown</strong>
                            <p>1800-POWER-HELP · Quick Response Unit</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">🛣️</span>
                          <div>
                            <strong>Road Pothole & Caved Asphalt Helpline</strong>
                            <p>1800-ROADS-CIVIC · Highway Works Division</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">🗑️</span>
                          <div>
                            <strong>Sanitation & Public Health Directorate</strong>
                            <p>1800-WASTE-CLEAN · Solid Waste Control</p>
                          </div>
                        </div>
                      </>
                    )}

                    {contactDomain === "COLLEGE" && (
                      <>
                        <div className="helpline-item">
                          <span className="helpline-icon">💻</span>
                          <div>
                            <strong>Campus IT & Wi-Fi Network Operations</strong>
                            <p>ithelp@apex.edu · Extension 102</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">🛏️</span>
                          <div>
                            <strong>Hostel & Residential Life Office</strong>
                            <p>hostel@apex.edu · Chief Warden: ext-101</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">🚌</span>
                          <div>
                            <strong>College Transport & Route Dispatch</strong>
                            <p>transport@apex.edu · Dispatcher: ext-103</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">📄</span>
                          <div>
                            <strong>Examination & Evaluation Cell</strong>
                            <p>exams@apex.edu · Hall Tickets & Marksheets: ext-105</p>
                          </div>
                        </div>
                      </>
                    )}

                    {contactDomain === "CORPORATE" && (
                      <>
                        <div className="helpline-item">
                          <span className="helpline-icon">🖥️</span>
                          <div>
                            <strong>Enterprise IT & Workstation Support</strong>
                            <p>itops@techcorp.com · Hotline ext-201</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">🏢</span>
                          <div>
                            <strong>Facilities, HVAC & Workplace Desk</strong>
                            <p>facilities@techcorp.com · Building Mgr: ext-202</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">⚖️</span>
                          <div>
                            <strong>HR & People Operations (Confidential)</strong>
                            <p>people@techcorp.com · HRBP Hotline: ext-203</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">💰</span>
                          <div>
                            <strong>Finance & Payroll Inquiries</strong>
                            <p>payroll@techcorp.com · Extension 204</p>
                          </div>
                        </div>
                      </>
                    )}

                    {contactDomain === "HEALTHCARE" && (
                      <>
                        <div className="helpline-item">
                          <span className="helpline-icon">🚨</span>
                          <div>
                            <strong>Emergency & Critical Care Trauma Hotline</strong>
                            <p>108 / 1800-APOLLO-CARE · 24x7 Ambulance Dispatch</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">📋</span>
                          <div>
                            <strong>Cashless Insurance TPA Desk</strong>
                            <p>billing@apollo.org · Pre-Auth Team: ext-302</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">🩺</span>
                          <div>
                            <strong>Patient Relations & Nursing Superintendent</strong>
                            <p>nursing@apollo.org · Chief Matron: ext-301</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">🧼</span>
                          <div>
                            <strong>Hospital Sanitation & Infection Control</strong>
                            <p>hygiene@apollo.org · Safety Desk: ext-303</p>
                          </div>
                        </div>
                      </>
                    )}

                    {contactDomain === "TRANSPORT" && (
                      <>
                        <div className="helpline-item">
                          <span className="helpline-icon">🚆</span>
                          <div>
                            <strong>Metro Train Control & Delay Operations</strong>
                            <p>metro@citytransit.gov · Controller: ext-501</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">💳</span>
                          <div>
                            <strong>Automated AFC Smartcard Refund Desk</strong>
                            <p>tickets@citytransit.gov · System Admin: ext-503</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">🚌</span>
                          <div>
                            <strong>Bus Rapid Transit (BRT) Depot Hotline</strong>
                            <p>brt@citytransit.gov · Depot Incharge: ext-502</p>
                          </div>
                        </div>
                        <div className="helpline-item">
                          <span className="helpline-icon">🛡️</span>
                          <div>
                            <strong>Transit Safety, Security & Lost Property</strong>
                            <p>security@citytransit.gov · Marshals: ext-505</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="portal-card">
                  <div className="card-header">
                    <h3>Administrative Authority Profile</h3>
                    <p className="card-subtitle">
                      Authorized address, designated grievance officers, and operational hours.
                    </p>
                  </div>

                  <div className="office-info-list">
                    <div className="office-row">
                      <span>Authority Name:</span>
                      <strong>{DOMAIN_META[contactDomain]?.authority}</strong>
                    </div>

                    <div className="office-row">
                      <span>Office Address:</span>
                      <strong>{DOMAIN_META[contactDomain]?.office}</strong>
                    </div>

                    <div className="office-row">
                      <span>Operational Hours:</span>
                      <strong>Monday to Friday: 08:30 AM – 06:00 PM (Emergency cells: 24/7)</strong>
                    </div>

                    <div className="office-row">
                      <span>Central Support Desk:</span>
                      <strong>{DOMAIN_META[contactDomain]?.email}</strong>
                    </div>

                    <div className="office-row">
                      <span>Toll-Free Helpline:</span>
                      <strong className="text-emerald">{DOMAIN_META[contactDomain]?.hotline}</strong>
                    </div>
                  </div>

                  <div className="faq-mini-box">
                    <strong>💡 Cross-Sector SLA Escalation Policy</strong>
                    <p>
                      Every complaint lodged under {DOMAIN_META[contactDomain]?.label} is tracked with legal timestamps. Issues remaining unresolved beyond target SLA hours are automatically flagged to oversight inspectors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="modal-backdrop">
          <div className="modal-card detail-modal animate-fade-in">
            <div className="modal-header">
              <div>
                <span className="modal-tag">GRIEVANCE DOSSIER</span>
                <h2>{selectedComplaint.trackingId}</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedComplaint(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-top-meta">
                <span className={`badge-domain ${getDomainInfo(selectedComplaint).badgeClass}`}>
                  {getDomainInfo(selectedComplaint).icon} {selectedComplaint.organizationName || getDomainInfo(selectedComplaint).label}
                </span>
                <span className={`status-badge large ${selectedComplaint.status?.toLowerCase()}`}>
                  {selectedComplaint.status?.replace("_", " ")}
                </span>
                <span className={`priority-tag ${selectedComplaint.priority?.toLowerCase()}`}>
                  {selectedComplaint.priority} Priority
                </span>
                <span className="tag-category">{selectedComplaint.category}</span>
              </div>

              <h3 className="modal-case-title">{selectedComplaint.title}</h3>

              <div className="modal-info-grid">
                <div>
                  <small>Location Landmark</small>
                  <strong>{selectedComplaint.location}</strong>
                </div>
                <div>
                  <small>Assigned Department</small>
                  <strong>{selectedComplaint.assignedDepartment || "Pending Review"}</strong>
                </div>
                <div>
                  <small>Responsible Officer</small>
                  <strong>{selectedComplaint.assignedOfficer || "Not Assigned Yet"}</strong>
                </div>
                <div>
                  <small>Submission Date</small>
                  <strong>
                    {selectedComplaint.createdAt
                      ? new Date(selectedComplaint.createdAt).toLocaleString()
                      : "Recently"}
                  </strong>
                </div>
              </div>

              <div className="modal-desc-box">
                <h4>Description:</h4>
                <p>{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.attachmentData && (
                <div className="modal-evidence-box">
                  <h4>Uploaded Photographic Evidence:</h4>
                  <img
                    src={selectedComplaint.attachmentData}
                    alt="Evidence attachment"
                    className="modal-evidence-img"
                  />
                </div>
              )}

              {/* Progress History */}
              <div className="modal-history-box">
                <h4>Status Timeline & Audit Logs:</h4>
                <div className="timeline-trail">
                  {selectedComplaint.statusHistory?.map((item, idx) => (
                    <div key={idx} className="timeline-entry">
                      <div className="timeline-marker" />
                      <div className="timeline-body">
                        <div className="timeline-top">
                          <span className={`status-badge small ${item.status?.toLowerCase()}`}>
                            {item.status?.replace("_", " ")}
                          </span>
                          <small>
                            {item.timestamp
                              ? new Date(item.timestamp).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </small>
                        </div>
                        <p className="timeline-remarks">{item.remarks}</p>
                        <small className="timeline-by">Staff: {item.updatedBy || "System"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary-light"
                onClick={() => setSelectedComplaint(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


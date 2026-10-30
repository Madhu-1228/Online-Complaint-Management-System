import React, { useState, useEffect } from "react";
import { complaintAPI, organizationAPI, authAPI, notificationAPI } from "../services/api";

const STATUS_OPTIONS = [
  "SUBMITTED",
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
];

export const DOMAIN_META = {
  MUNICIPALITY: {
    label: "Civic & Municipality",
    shortLabel: "Civic",
    icon: "🏛️",
    badgeClass: "muni",
    authority: "Apex Municipal Corporation",
  },
  COLLEGE: {
    label: "University & Campus",
    shortLabel: "Campus",
    icon: "🎓",
    badgeClass: "college",
    authority: "Apex Institute of Technology",
  },
  CORPORATE: {
    label: "Corporate Workplace",
    shortLabel: "Workplace",
    icon: "🏢",
    badgeClass: "corp",
    authority: "TechCorp Global Headquarters",
  },
  HEALTHCARE: {
    label: "Healthcare & Hospital",
    shortLabel: "Hospital",
    icon: "🏥",
    badgeClass: "health",
    authority: "Apollo Care Multi-Specialty Hospital",
  },
  TRANSPORT: {
    label: "Public Transit & Transport",
    shortLabel: "Transit",
    icon: "🚆",
    badgeClass: "transit",
    authority: "City Metro & Transit Express",
  },
};

export function getDomainInfo(complaintOrOrg) {
  const type = (complaintOrOrg?.domain || complaintOrOrg?.type || "MUNICIPALITY").toUpperCase();
  return DOMAIN_META[type] || {
    label: complaintOrOrg?.organizationName || "Public Authority",
    shortLabel: "General",
    icon: "📌",
    badgeClass: "other",
    authority: complaintOrOrg?.organizationName || "General Authority",
  };
}

export default function AdminPortal({ user, onLogout, onUpdateUser }) {
  // Navigation tabs:
  // dashboard, citizens, all-complaints, pending, assign, departments, resolved, reports, notifications, feedback, settings, profile
  const [activeTab, setActiveTab] = useState("dashboard");

  const [complaints, setComplaints] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("ALL");
  const [domainFilter, setDomainFilter] = useState("ALL");
  const [deptDomainOrg, setDeptDomainOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [citizenSearch, setCitizenSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Status Update Modal
  const [statusModalComplaint, setStatusModalComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState("IN_PROGRESS");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [statusPriority, setStatusPriority] = useState("MEDIUM");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Assign Modal
  const [assignModalComplaint, setAssignModalComplaint] = useState(null);
  const [assignDept, setAssignDept] = useState("");
  const [assignOfficer, setAssignOfficer] = useState("");
  const [assignDescription, setAssignDescription] = useState("");
  const [assignStatus, setAssignStatus] = useState("ASSIGNED");
  const [assignUpdating, setAssignUpdating] = useState(false);

  // Department Modal State (Add / Edit)
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDeptName, setEditingDeptName] = useState(null); // null = adding, string = editing
  const [deptForm, setDeptForm] = useState({
    name: "",
    headOfficer: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [deptSaving, setDeptSaving] = useState(false);

  // Notification Broadcast Form
  const [notifForm, setNotifForm] = useState({
    title: "",
    message: "",
    userId: "ALL",
    type: "ANNOUNCEMENT",
  });
  const [notifSending, setNotifSending] = useState(false);

  // Admin Profile Form
  const [adminProfileForm, setAdminProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    newPassword: "",
    currentPassword: "",
  });
  const [adminProfileSaving, setAdminProfileSaving] = useState(false);

  // System Settings State
  const [settings, setSettings] = useState({
    portalName: "Apex Multi-Domain Grievance Administration",
    emergencyHelpline: "1800-CIVIC-MUNI",
    urgentSlaHours: 24,
    highSlaHours: 48,
    mediumSlaHours: 72,
    lowSlaHours: 120,
    autoEscalationEnabled: true,
  });

  // Selected complaint for full dossier inspection
  const [inspectComplaint, setInspectComplaint] = useState(null);

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, [user]);

  async function loadAllAdminData(domain = selectedDomain) {
    setLoading(true);
    try {
      const domParam = domain !== "ALL" ? domain : null;
      const [allComplaints, analyticsData, orgList, citizenList, feedbackList] = await Promise.all([
        complaintAPI.getAll(null, domParam),
        complaintAPI.getAnalytics(null, domParam),
        organizationAPI.getActive().catch(() => []),
        authAPI.getCitizens().catch(() => []),
        complaintAPI.getFeedbacks().catch(() => []),
      ]);

      setComplaints(allComplaints || []);
      setAnalytics(analyticsData || null);
      setOrganizations(orgList || []);
      const activeOrg = orgList?.find((o) => o.id === user?.organizationId) || orgList?.[0] || null;
      setOrganization(activeOrg);
      if (!deptDomainOrg && activeOrg) {
        setDeptDomainOrg(activeOrg);
        setDepartments(activeOrg.departments || []);
      }
      setCitizens(citizenList || []);
      setFeedbacks(feedbackList || []);

      setAdminProfileForm({
        name: user?.name || "",
        phone: user?.phone || "",
        address: user?.address || "",
        newPassword: "",
        currentPassword: "",
      });
    } catch (err) {
      console.error("Error loading admin data:", err);
      showToast("Failed to load administration dataset.", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleDomainSwitch(dom) {
    setSelectedDomain(dom);
    loadAllAdminData(dom);
  }

  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  }

  // Handle Status Update
  function openStatusModal(complaint) {
    setStatusModalComplaint(complaint);
    setNewStatus(complaint.status || "IN_PROGRESS");
    setStatusPriority(complaint.priority || "MEDIUM");
    setStatusRemarks(complaint.adminRemarks || "");
  }

  async function handleSaveStatus(e) {
    e.preventDefault();
    if (!statusModalComplaint) return;
    setStatusUpdating(true);
    try {
      const updated = await complaintAPI.updateStatus(statusModalComplaint.id, {
        status: newStatus,
        priority: statusPriority,
        adminRemarks: statusRemarks,
      });

      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      complaintAPI.getAnalytics().then(setAnalytics).catch(() => {});
      showToast(`Status updated to '${newStatus.replace("_", " ")}' for ${updated.trackingId}`);
      setStatusModalComplaint(null);
    } catch (err) {
      showToast(err.customMessage || "Failed to update status.", "error");
    } finally {
      setStatusUpdating(false);
    }
  }

  // Handle Assignment
  function openAssignModal(complaint) {
    setAssignModalComplaint(complaint);
    const complaintOrg = organizations.find((o) => o.id === complaint.organizationId || o.slug === complaint.organizationId) || organization;
    const orgDepts = complaintOrg?.departments || departments;
    setAssignDept(complaint.assignedDepartment || orgDepts[0]?.name || "");
    setAssignOfficer(complaint.assignedOfficer || "");
    setAssignDescription(complaint.adminRemarks || "");
    setAssignStatus("ASSIGNED");
  }

  async function handleSaveAssignment(e) {
    e.preventDefault();
    if (!assignModalComplaint) return;
    if (!assignDept) {
      showToast("Please choose a department.", "error");
      return;
    }

    setAssignUpdating(true);
    try {
      const updated = await complaintAPI.assign(assignModalComplaint.id, {
        department: assignDept,
        officer: assignOfficer,
        description: assignDescription,
        status: assignStatus,
      });

      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      complaintAPI.getAnalytics().then(setAnalytics).catch(() => {});
      showToast(`Assigned ${updated.trackingId} to ${assignDept}!`);
      setAssignModalComplaint(null);
    } catch (err) {
      showToast(err.customMessage || "Assignment failed.", "error");
    } finally {
      setAssignUpdating(false);
    }
  }

  // Handle Citizen Account Status Toggle
  async function handleToggleCitizenStatus(citizen) {
    const nextStatus = citizen.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
    try {
      const res = await authAPI.updateCitizenStatus(citizen.id, nextStatus);
      setCitizens((prev) =>
        prev.map((u) => (u.id === citizen.id ? { ...u, status: nextStatus } : u))
      );
      showToast(`Citizen account ${citizen.name} is now ${nextStatus}.`);
    } catch (err) {
      showToast(err.customMessage || "Failed to update citizen status.", "error");
    }
  }

  // Handle Add/Edit Department
  function openAddDeptModal() {
    setEditingDeptName(null);
    setDeptForm({ name: "", headOfficer: "", contactEmail: "", contactPhone: "" });
    setShowDeptModal(true);
  }

  function openEditDeptModal(dept) {
    setEditingDeptName(dept.name);
    setDeptForm({
      name: dept.name,
      headOfficer: dept.headOfficer || "",
      contactEmail: dept.contactEmail || "",
      contactPhone: dept.contactPhone || "",
    });
    setShowDeptModal(true);
  }

  async function handleSaveDepartment(e) {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      showToast("Department name is required.", "error");
      return;
    }

    setDeptSaving(true);
    try {
      const targetOrg = deptDomainOrg || organization;
      const orgId = targetOrg?.id || user?.organizationId;
      if (!orgId) throw new Error("Organization reference missing.");

      if (editingDeptName) {
        // Edit
        await organizationAPI.editDepartment(orgId, editingDeptName, deptForm);
        showToast(`Department '${deptForm.name}' updated successfully!`);
      } else {
        // Add
        await organizationAPI.addDepartment(orgId, deptForm);
        showToast(`Department '${deptForm.name}' added successfully!`);
      }

      const refreshedOrg = await organizationAPI.getById(orgId);
      setDeptDomainOrg(refreshedOrg);
      setDepartments(refreshedOrg?.departments || []);
      setOrganizations((prev) => prev.map((o) => (o.id === refreshedOrg.id ? refreshedOrg : o)));
      setShowDeptModal(false);
    } catch (err) {
      showToast(err.customMessage || "Department operation failed.", "error");
    } finally {
      setDeptSaving(false);
    }
  }

  async function handleDeleteDepartment(deptName) {
    if (!window.confirm(`Are you sure you want to delete department '${deptName}'?`)) return;
    try {
      const targetOrg = deptDomainOrg || organization;
      const orgId = targetOrg?.id || user?.organizationId;
      await organizationAPI.deleteDepartment(orgId, deptName);
      setDepartments((prev) => prev.filter((d) => d.name !== deptName));
      if (deptDomainOrg) {
        setDeptDomainOrg((prev) => ({
          ...prev,
          departments: prev.departments.filter((d) => d.name !== deptName),
        }));
      }
      showToast(`Department '${deptName}' removed.`);
    } catch (err) {
      showToast(err.customMessage || "Failed to delete department.", "error");
    }
  }

  // Handle Send Notification / Broadcast
  async function handleSendNotification(e) {
    e.preventDefault();
    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      showToast("Title and message are required.", "error");
      return;
    }

    setNotifSending(true);
    try {
      await notificationAPI.sendNotification({
        title: notifForm.title.trim(),
        message: notifForm.message.trim(),
        userId: notifForm.userId,
        type: notifForm.type,
      });
      showToast("Notification broadcast transmitted successfully!");
      setNotifForm({ title: "", message: "", userId: "ALL", type: "ANNOUNCEMENT" });
    } catch (err) {
      showToast(err.customMessage || "Failed to transmit notification.", "error");
    } finally {
      setNotifSending(false);
    }
  }

  // Handle Admin Profile Update
  async function handleSaveAdminProfile(e) {
    e.preventDefault();
    setAdminProfileSaving(true);
    try {
      const payload = {
        name: adminProfileForm.name.trim(),
        phone: adminProfileForm.phone.trim(),
        address: adminProfileForm.address.trim(),
      };
      if (adminProfileForm.newPassword) {
        payload.newPassword = adminProfileForm.newPassword;
        payload.currentPassword = adminProfileForm.currentPassword;
      }
      const res = await authAPI.updateProfile(payload);
      showToast("Administrator profile saved!");
      if (onUpdateUser && res.user) onUpdateUser(res.user);
      setAdminProfileForm((prev) => ({ ...prev, newPassword: "", currentPassword: "" }));
    } catch (err) {
      showToast(err.customMessage || "Failed to update profile.", "error");
    } finally {
      setAdminProfileSaving(false);
    }
  }

  // Export Reports as CSV
  function handleExportCSV() {
    if (complaints.length === 0) {
      showToast("No complaint records available to export.", "error");
      return;
    }

    const headers = [
      "Tracking ID",
      "Sector",
      "Authority",
      "Title",
      "Category",
      "Priority",
      "Status",
      "Department",
      "Officer",
      "Citizen Name",
      "Citizen Email",
      "Location",
      "Created At",
    ];

    const rows = complaints.map((c) => [
      `"${c.trackingId || ""}"`,
      `"${getDomainInfo(c).label}"`,
      `"${c.organizationName || getDomainInfo(c).authority}"`,
      `"${(c.title || "").replace(/"/g, '""')}"`,
      `"${c.category || ""}"`,
      `"${c.priority || ""}"`,
      `"${c.status || ""}"`,
      `"${c.assignedDepartment || ""}"`,
      `"${c.assignedOfficer || ""}"`,
      `"${c.userName || ""}"`,
      `"${c.userEmail || ""}"`,
      `"${(c.location || "").replace(/"/g, '""')}"`,
      `"${c.createdAt || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `civiccare-complaints-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV report generated and downloaded!");
  }

  // Delete Complaint
  async function handleDeleteComplaint(id, trackingId) {
    if (!window.confirm(`Are you sure you want to permanently delete grievance ${trackingId}?`)) return;
    try {
      await complaintAPI.deleteComplaint(id);
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      complaintAPI.getAnalytics().then(setAnalytics).catch(() => {});
      showToast(`Complaint ${trackingId} deleted from database.`);
      setInspectComplaint(null);
    } catch (err) {
      showToast(err.customMessage || "Failed to delete complaint.", "error");
    }
  }

  // Filtered Lists
  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.trackingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedDepartment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.organizationName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING" && (c.status === "SUBMITTED" || c.status === "PENDING")) ||
      c.status === statusFilter;

    const matchesPriority = priorityFilter === "ALL" || c.priority === priorityFilter;

    const cDom = (c.domain || "MUNICIPALITY").toUpperCase();
    const matchesDomain = domainFilter === "ALL" || cDom === domainFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesPriority && matchesDomain;
  });

  const pendingComplaints = complaints.filter(
    (c) => c.status === "SUBMITTED" || c.status === "PENDING"
  );
  const resolvedComplaints = complaints.filter(
    (c) => c.status === "RESOLVED" || c.status === "CLOSED"
  );

  const filteredCitizens = citizens.filter((u) => {
    if (!citizenSearch.trim()) return true;
    const q = citizenSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  // Analytics counts
  const totalCount = analytics?.total || complaints.length;
  const pendingCount = analytics?.pending || pendingComplaints.length;
  const assignedCount = analytics?.assigned || complaints.filter((c) => c.status === "ASSIGNED").length;
  const inProgressCount = analytics?.inProgress || complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount = analytics?.resolved || resolvedComplaints.length;
  const totalCitizensCount = analytics?.totalCitizens || citizens.length;

  return (
    <div className="portal-layout admin animate-fade-in">
      {/* Toast */}
      {toast.show && (
        <div className={`portal-toast ${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <p>{toast.message}</p>
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <aside className={`portal-sidebar admin-theme ${mobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon admin">🛡️</div>
          <div>
            <h3>CivicCare Admin</h3>
            <span className="badge-role admin">Administration</span>
          </div>
        </div>

        <div className="sidebar-user-card admin-variant">
          <div className="sidebar-user-avatar admin">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="sidebar-user-info">
            <strong>{user?.name || "Administrator"}</strong>
            <span>{user?.email || "admin@.com"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "citizens" ? "active" : ""}`}
            onClick={() => { setActiveTab("citizens"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Manage Citizens</span>
            <span className="nav-counter admin">{totalCitizensCount}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "all-complaints" ? "active" : ""}`}
            onClick={() => { setActiveTab("all-complaints"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">📁</span>
            <span className="nav-label">All Complaints</span>
            <span className="nav-counter admin">{totalCount}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => { setActiveTab("pending"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">⏳</span>
            <span className="nav-label">Pending Complaints</span>
            {pendingCount > 0 && <span className="nav-counter urgent">{pendingCount}</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "assign" ? "active" : ""}`}
            onClick={() => { setActiveTab("assign"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-label">Assign Complaints</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "departments" ? "active" : ""}`}
            onClick={() => { setActiveTab("departments"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">🏢</span>
            <span className="nav-label">Manage Departments</span>
            <span className="nav-counter admin">{departments.length}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "resolved" ? "active" : ""}`}
            onClick={() => { setActiveTab("resolved"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">✅</span>
            <span className="nav-label">Resolved Complaints</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => { setActiveTab("reports"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-label">Reports & Analytics</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => { setActiveTab("notifications"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">📢</span>
            <span className="nav-label">Notifications</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "feedback" ? "active" : ""}`}
            onClick={() => { setActiveTab("feedback"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Feedback Management</span>
            {feedbacks.length > 0 && <span className="nav-counter admin">{feedbacks.length}</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => { setActiveTab("profile"); setMobileMenuOpen(false); }}
          >
            <span className="nav-icon">🛡️</span>
            <span className="nav-label">Admin Profile</span>
          </button>

          <div className="sidebar-divider" />

          <button className="sidebar-nav-item logout" onClick={onLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Administrative Work Area */}
      <main className="portal-main-area">
        <header className="portal-topbar admin">
          <div className="topbar-left">
            <button
              className="btn-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <div className="topbar-title-block">
              <h2>
                {activeTab === "dashboard" && "Executive Command Dashboard"}
                {activeTab === "citizens" && "Citizen User Directory & Governance"}
                {activeTab === "all-complaints" && "Master Complaints Registry"}
                {activeTab === "pending" && "Pending Grievance Action Queue"}
                {activeTab === "assign" && "Department & Officer Assignment Desk"}
                {activeTab === "departments" && "Municipal Department Configurations"}
                {activeTab === "resolved" && "Resolved Grievances Audit"}
                {activeTab === "reports" && "Reports, SLA Analytics & Export"}
                {activeTab === "notifications" && "Citizen Notification & Broadcast Center"}
                {activeTab === "feedback" && "Citizen CSAT & Feedback Review"}
                {activeTab === "settings" && "System & SLA Policy Settings"}
                {activeTab === "profile" && "Administrator Profile & Security"}
              </h2>
              <span className="topbar-subtitle">
                {organization?.name || "Apex Municipal Corporation"} · Official Admin Console
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <button
              className="topbar-quick-action admin"
              onClick={handleExportCSV}
              title="Download full CSV report"
            >
              📥 Export CSV Report
            </button>
            <button
              className="topbar-quick-action"
              onClick={() => setActiveTab("notifications")}
            >
              📢 Broadcast Alert
            </button>
          </div>
        </header>

        {/* Multi-Domain Sector Switcher Bar */}
        <div className="admin-domain-switcher-bar">
          <span>Target Sector:</span>
          <div className="domain-switcher-pills">
            <button
              className={`domain-switch-pill ${selectedDomain === "ALL" ? "active" : ""}`}
              onClick={() => handleDomainSwitch("ALL")}
            >
              🌐 All Domains (Enterprise View)
            </button>
            {Object.entries(DOMAIN_META).map(([key, meta]) => (
              <button
                key={key}
                className={`domain-switch-pill ${selectedDomain === key ? "active" : ""}`}
                onClick={() => handleDomainSwitch(key)}
              >
                <span>{meta.icon}</span> {meta.label}
              </button>
            ))}
          </div>
        </div>

        <div className="portal-content-box">
          {/* ==================== 1. DASHBOARD TAB ==================== */}
          {activeTab === "dashboard" && (
            <div className="tab-pane animate-fade-in">
              {/* Multi-Domain Cross-Sector Overview */}
              {selectedDomain === "ALL" && (
                <div className="portal-card animate-fade-in" style={{ marginBottom: "20px" }}>
                  <div className="card-header-flex">
                    <div>
                      <h3>Cross-Sector Multi-Domain Governance</h3>
                      <p className="card-subtitle">Real-time complaint distribution and department readiness across all public sectors</p>
                    </div>
                    <span className="badge-domain muni">5 Integrated Sectors</span>
                  </div>

                  <div className="domain-comparison-grid">
                    {Object.entries(DOMAIN_META).map(([key, meta]) => {
                      const domCount = complaints.filter(c => (c.domain || "MUNICIPALITY").toUpperCase() === key).length;
                      const resolvedDomCount = complaints.filter(c => (c.domain || "MUNICIPALITY").toUpperCase() === key && (c.status === "RESOLVED" || c.status === "CLOSED")).length;
                      const pct = complaints.length > 0 ? Math.round((domCount / complaints.length) * 100) : 0;
                      return (
                        <div
                          key={key}
                          className="domain-stat-box"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDomainSwitch(key)}
                        >
                          <div className="domain-stat-header">
                            <span className="domain-stat-title">{meta.icon} {meta.label}</span>
                            <span className={`badge-domain ${meta.badgeClass}`}>{pct}% of total</span>
                          </div>
                          <div className="domain-stat-count">{domCount} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>issues</span></div>
                          <div className="domain-progress-bar-bg">
                            <div className="domain-progress-bar-fill" style={{ width: `${Math.max(5, pct)}%` }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
                            <span>Authority: {meta.authority}</span>
                            <span style={{ color: "#16a34a", fontWeight: 600 }}>{resolvedDomCount} Resolved</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6 Metric Cards */}
              <div className="portal-metrics-grid six-cols">
                <div className="portal-stat-card total" onClick={() => setActiveTab("all-complaints")}>
                  <div className="stat-icon-wrapper blue">📊</div>
                  <div className="stat-info">
                    <span className="stat-label">Total Grievances</span>
                    <strong className="stat-value">{totalCount}</strong>
                    <small>All logged records</small>
                  </div>
                </div>

                <div className="portal-stat-card pending" onClick={() => setActiveTab("pending")}>
                  <div className="stat-icon-wrapper amber">⏳</div>
                  <div className="stat-info">
                    <span className="stat-label">Pending Triage</span>
                    <strong className="stat-value text-amber">{pendingCount}</strong>
                    <small>Needs assignment</small>
                  </div>
                </div>

                <div className="portal-stat-card assigned" onClick={() => setActiveTab("assign")}>
                  <div className="stat-icon-wrapper purple">🎯</div>
                  <div className="stat-info">
                    <span className="stat-label">Assigned</span>
                    <strong className="stat-value text-purple">{assignedCount}</strong>
                    <small>Routed to officers</small>
                  </div>
                </div>

                <div className="portal-stat-card progress" onClick={() => setActiveTab("all-complaints")}>
                  <div className="stat-icon-wrapper sky">🛠️</div>
                  <div className="stat-info">
                    <span className="stat-label">In Progress</span>
                    <strong className="stat-value text-sky">{inProgressCount}</strong>
                    <small>Active in field</small>
                  </div>
                </div>

                <div className="portal-stat-card resolved" onClick={() => setActiveTab("resolved")}>
                  <div className="stat-icon-wrapper emerald">✅</div>
                  <div className="stat-info">
                    <span className="stat-label">Resolved</span>
                    <strong className="stat-value text-emerald">{resolvedCount}</strong>
                    <small>Completed & verified</small>
                  </div>
                </div>

                <div className="portal-stat-card citizens" onClick={() => setActiveTab("citizens")}>
                  <div className="stat-icon-wrapper indigo">👥</div>
                  <div className="stat-info">
                    <span className="stat-label">Registered Citizens</span>
                    <strong className="stat-value text-indigo">{totalCitizensCount}</strong>
                    <small>Verified residents</small>
                  </div>
                </div>
              </div>

              {/* Graphical Statistics & Charts Row */}
              <div className="analytics-grid-row">
                {/* Category Chart */}
                <div className="analytics-card">
                  <h3>Complaints by Category</h3>
                  <p className="analytics-sub">Grievance volume distribution across public services</p>

                  <div className="bar-chart-container">
                    {analytics?.byCategory && Object.keys(analytics.byCategory).length > 0 ? (
                      Object.entries(analytics.byCategory).map(([cat, count]) => {
                        const maxVal = Math.max(...Object.values(analytics.byCategory), 1);
                        const pct = Math.round((count / maxVal) * 100);
                        return (
                          <div key={cat} className="bar-chart-item">
                            <div className="bar-labels">
                              <span className="bar-dept">{cat}</span>
                              <span className="bar-count">{count} cases</span>
                            </div>
                            <div className="bar-track">
                              <div className="bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="empty-chart-note">No categorized complaints recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Status Breakdown & CSAT */}
                <div className="analytics-card">
                  <h3>Status & SLA Redressal Summary</h3>
                  <p className="analytics-sub">Operational efficiency and citizen satisfaction metrics</p>

                  <div className="dashboard-metric-strip">
                    <div className="metric-strip-item">
                      <span>CSAT Rating:</span>
                      <strong className="text-amber">★ {analytics?.avgRating || 4.8} / 5.0</strong>
                    </div>
                    <div className="metric-strip-item">
                      <span>Resolution Rate:</span>
                      <strong className="text-emerald">
                        {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100}%
                      </strong>
                    </div>
                    <div className="metric-strip-item">
                      <span>SLA Escalations:</span>
                      <strong className={analytics?.escalated > 0 ? "text-rose" : "text-emerald"}>
                        {analytics?.escalated || 0} Breaches
                      </strong>
                    </div>
                  </div>

                  <div className="bar-chart-container" style={{ marginTop: "16px" }}>
                    {[
                      { label: "Resolved / Closed", count: resolvedCount, color: "emerald" },
                      { label: "In Field Progress", count: inProgressCount, color: "cyan" },
                      { label: "Pending Assignment", count: pendingCount, color: "amber" },
                    ].map((item) => {
                      const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                      return (
                        <div key={item.label} className="bar-chart-item">
                          <div className="bar-labels">
                            <span className="bar-dept">{item.label}</span>
                            <span className="bar-count">{item.count} ({pct}%)</span>
                          </div>
                          <div className="bar-track">
                            <div className={`bar-fill ${item.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Priority Action Queue Preview */}
              <div className="portal-card" style={{ marginTop: "24px" }}>
                <div className="card-header-flex">
                  <div>
                    <h3>Pending Administrative Action Queue</h3>
                    <p className="card-subtitle">Complaints requiring immediate review or dispatch</p>
                  </div>
                  <button className="btn-link-action" onClick={() => setActiveTab("pending")}>
                    Manage All Pending ({pendingCount}) →
                  </button>
                </div>

                {pendingComplaints.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="empty-icon">🎉</div>
                    <h4>All queues are clear!</h4>
                    <p>No complaints currently waiting for administrative assignment.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Complaint ID</th>
                          <th>Citizen</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingComplaints.slice(0, 5).map((c) => (
                          <tr key={c.id}>
                            <td><strong className="text-mono">{c.trackingId}</strong></td>
                            <td>{c.userName || "Citizen"}</td>
                            <td>
                              <div className="cell-title">{c.title}</div>
                              <small className="cell-location">📍 {c.location}</small>
                            </td>
                            <td><span className="tag-category">{c.category}</span></td>
                            <td><span className={`priority-tag ${c.priority?.toLowerCase()}`}>{c.priority}</span></td>
                            <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent"}</td>
                            <td>
                              <div className="action-buttons-group">
                                <button className="btn-table-action assign" onClick={() => openAssignModal(c)}>
                                  🎯 Assign
                                </button>
                                <button className="btn-table-action status" onClick={() => openStatusModal(c)}>
                                  🔄 Status
                                </button>
                              </div>
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

          {/* ==================== 2. MANAGE CITIZENS TAB ==================== */}
          {activeTab === "citizens" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="filter-bar">
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search registered citizens by name, email, or phone..."
                      value={citizenSearch}
                      onChange={(e) => setCitizenSearch(e.target.value)}
                    />
                  </div>
                  <span className="record-count-pill">{filteredCitizens.length} Citizens Enrolled</span>
                </div>

                {filteredCitizens.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="empty-icon">👥</div>
                    <h4>No citizens found</h4>
                    <p>No registered citizen accounts match your search query.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Citizen Name</th>
                          <th>Email Address</th>
                          <th>Phone</th>
                          <th>Residential Ward / Address</th>
                          <th>Enrolled Date</th>
                          <th>Account Status</th>
                          <th>Governance Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCitizens.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <div className="user-name-cell">
                                <div className="user-avatar-small">
                                  {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                                </div>
                                <strong>{c.name}</strong>
                              </div>
                            </td>
                            <td><span className="text-mono">{c.email}</span></td>
                            <td>{c.phone || "Not Provided"}</td>
                            <td>{c.address || "Apex Municipality"}</td>
                            <td>
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Enrolled"}
                            </td>
                            <td>
                              <span className={`status-badge ${c.status === "DEACTIVATED" ? "deactivated" : "active"}`}>
                                {c.status || "ACTIVE"}
                              </span>
                            </td>
                            <td>
                              <button
                                className={`btn-account-toggle ${c.status === "DEACTIVATED" ? "activate" : "deactivate"}`}
                                onClick={() => handleToggleCitizenStatus(c)}
                              >
                                {c.status === "DEACTIVATED" ? "✓ Activate Account" : "⛔ Deactivate Account"}
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

          {/* ==================== 3. ALL COMPLAINTS TAB ==================== */}
          {activeTab === "all-complaints" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="filter-bar">
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by ID, title, citizen name, department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-select-group">
                    <select
                      className="admin-select"
                      value={domainFilter}
                      onChange={(e) => setDomainFilter(e.target.value)}
                    >
                      <option value="ALL">All Sectors / Domains</option>
                      {Object.entries(DOMAIN_META).map(([key, meta]) => (
                        <option key={key} value={key}>
                          {meta.icon} {meta.label}
                        </option>
                      ))}
                    </select>

                    <select
                      className="admin-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All Statuses</option>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>

                    <select
                      className="admin-select"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                {filteredComplaints.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="empty-icon">📁</div>
                    <h4>No complaints match filter</h4>
                    <p>Try clearing your search query or changing status filters.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Complaint ID</th>
                          <th>Sector</th>
                          <th>Citizen</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Assigned Dept</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComplaints.map((c) => (
                          <tr key={c.id}>
                            <td><strong className="text-mono">{c.trackingId}</strong></td>
                            <td>
                              <span className={`badge-domain ${getDomainInfo(c).badgeClass}`}>
                                {getDomainInfo(c).icon} {getDomainInfo(c).shortLabel}
                              </span>
                            </td>
                            <td>
                              <strong>{c.userName || "Citizen"}</strong>
                              <br />
                              <small className="text-muted">{c.userEmail}</small>
                            </td>
                            <td>
                              <div className="cell-title">{c.title}</div>
                              <small className="cell-location">📍 {c.location}</small>
                            </td>
                            <td><span className="tag-category">{c.category}</span></td>
                            <td><span className={`priority-tag ${c.priority?.toLowerCase()}`}>{c.priority}</span></td>
                            <td>{c.assignedDepartment || "Triage Pending"}</td>
                            <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent"}</td>
                            <td>
                              <span className={`status-badge ${c.status?.toLowerCase()}`}>
                                {c.status?.replace("_", " ")}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons-group">
                                <button className="btn-table-action inspect" onClick={() => setInspectComplaint(c)} title="Full dossier">
                                  👁️ View
                                </button>
                                <button className="btn-table-action status" onClick={() => openStatusModal(c)} title="Update status">
                                  🔄 Status
                                </button>
                                <button className="btn-table-action assign" onClick={() => openAssignModal(c)} title="Assign department">
                                  🎯 Assign
                                </button>
                                <button className="btn-table-action delete" onClick={() => handleDeleteComplaint(c.id, c.trackingId)} title="Delete record">
                                  🗑️
                                </button>
                              </div>
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

          {/* ==================== 4. PENDING COMPLAINTS TAB ==================== */}
          {activeTab === "pending" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="card-header-flex">
                  <div>
                    <h3>Pending Review & Assignment Queue</h3>
                    <p className="card-subtitle">
                      Grievances submitted by citizens awaiting departmental triage.
                    </p>
                  </div>
                  <span className="urgent-tag">{pendingComplaints.length} Action Required</span>
                </div>

                {pendingComplaints.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="empty-icon">✅</div>
                    <h4>No pending grievances!</h4>
                    <p>All complaints have been assigned and actioned.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Complaint ID</th>
                          <th>Sector</th>
                          <th>Citizen</th>
                          <th>Grievance Summary</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Location</th>
                          <th>Submission Date</th>
                          <th>Immediate Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingComplaints.map((c) => (
                          <tr key={c.id}>
                            <td><strong className="text-mono">{c.trackingId}</strong></td>
                            <td>
                              <span className={`badge-domain ${getDomainInfo(c).badgeClass}`}>
                                {getDomainInfo(c).icon} {getDomainInfo(c).shortLabel}
                              </span>
                            </td>
                            <td>
                              <strong>{c.userName}</strong>
                              <br />
                              <small>{c.userEmail}</small>
                            </td>
                            <td>
                              <div className="cell-title">{c.title}</div>
                              <p className="cell-desc-preview">{c.description}</p>
                            </td>
                            <td><span className="tag-category">{c.category}</span></td>
                            <td><span className={`priority-tag ${c.priority?.toLowerCase()}`}>{c.priority}</span></td>
                            <td>📍 {c.location}</td>
                            <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent"}</td>
                            <td>
                              <div className="action-buttons-group">
                                <button className="btn-table-action assign" onClick={() => openAssignModal(c)}>
                                  🎯 Assign Dept
                                </button>
                                <button className="btn-table-action status" onClick={() => openStatusModal(c)}>
                                  🔄 Status
                                </button>
                              </div>
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

          {/* ==================== 5. ASSIGN COMPLAINTS TAB ==================== */}
          {activeTab === "assign" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="card-header">
                  <h3>Department & Field Officer Assignment Desk</h3>
                  <p className="card-subtitle">
                    Select any complaint from the queue to route it to responsible municipal engineering divisions.
                  </p>
                </div>

                <div className="table-responsive">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Complaint ID</th>
                        <th>Sector</th>
                        <th>Title & Citizen</th>
                        <th>Current Dept</th>
                        <th>Assigned Officer</th>
                        <th>Status</th>
                        <th>Dispatch Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((c) => (
                        <tr key={c.id}>
                          <td><strong className="text-mono">{c.trackingId}</strong></td>
                          <td>
                            <span className={`badge-domain ${getDomainInfo(c).badgeClass}`}>
                              {getDomainInfo(c).icon} {getDomainInfo(c).shortLabel}
                            </span>
                          </td>
                          <td>
                            <div className="cell-title">{c.title}</div>
                            <small className="text-muted">By: {c.userName || "Citizen"} · 📍 {c.location}</small>
                          </td>
                          <td>
                            <strong>{c.assignedDepartment || "Not Assigned"}</strong>
                          </td>
                          <td>{c.assignedOfficer || "—"}</td>
                          <td>
                            <span className={`status-badge ${c.status?.toLowerCase()}`}>
                              {c.status?.replace("_", " ")}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-table-action assign"
                              onClick={() => openAssignModal(c)}
                            >
                              🎯 {c.assignedDepartment ? "Reassign Dept" : "Assign Dept"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 6. MANAGE DEPARTMENTS TAB ==================== */}
          {activeTab === "departments" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                {/* Domain Selector for Department Management */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
                  {organizations.map((org) => {
                    const meta = getDomainInfo(org);
                    const isActive = (deptDomainOrg?.id === org.id) || (!deptDomainOrg && org.id === organization?.id);
                    return (
                      <button
                        key={org.id}
                        className={`domain-switch-pill ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setDeptDomainOrg(org);
                          setDepartments(org.departments || []);
                        }}
                      >
                        <span>{meta.icon}</span> {org.name} ({org.departments?.length || 0} Depts)
                      </button>
                    );
                  })}
                </div>

                <div className="card-header-flex">
                  <div>
                    <h3>{getDomainInfo(deptDomainOrg || organization).icon} {deptDomainOrg?.name || organization?.name || "Authority"} Department Configurations</h3>
                    <p className="card-subtitle">
                      Configure service divisions, lead officers, and direct contact details for {deptDomainOrg?.name || organization?.name}.
                    </p>
                  </div>
                  <button className="btn-primary-glow" onClick={openAddDeptModal}>
                    + Add Department to {getDomainInfo(deptDomainOrg || organization).shortLabel}
                  </button>
                </div>

                <div className="department-cards-grid">
                  {departments.map((dept) => (
                    <div key={dept.name} className="dept-config-card">
                      <div className="dept-card-top">
                        <span className="dept-icon-glow">🏢</span>
                        <div className="dept-card-actions">
                          <button
                            className="btn-icon-edit"
                            onClick={() => openEditDeptModal(dept)}
                            title="Edit department details"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon-delete"
                            onClick={() => handleDeleteDepartment(dept.name)}
                            title="Delete department"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <h4>{dept.name}</h4>

                      <div className="dept-meta-stack">
                        <div className="meta-line">
                          <span>Officer in Charge:</span>
                          <strong>{dept.headOfficer || "Executive Engineer"}</strong>
                        </div>
                        <div className="meta-line">
                          <span>Official Email:</span>
                          <strong>{dept.contactEmail || "department@civiccare.gov"}</strong>
                        </div>
                        <div className="meta-line">
                          <span>Helpline / Ext:</span>
                          <strong>{dept.contactPhone || "1800-CIVIC"}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 7. RESOLVED COMPLAINTS TAB ==================== */}
          {activeTab === "resolved" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="card-header-flex">
                  <div>
                    <h3>Successfully Resolved Grievances</h3>
                    <p className="card-subtitle">
                      Audit completed civic works, resolution remarks, and citizen ratings.
                    </p>
                  </div>
                  <span className="resolved-tag-counter">{resolvedComplaints.length} Resolved Cases</span>
                </div>

                {resolvedComplaints.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="empty-icon">📂</div>
                    <h4>No resolved grievances yet</h4>
                    <p>When complaints are investigated and closed, they will appear here.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Complaint ID</th>
                          <th>Sector</th>
                          <th>Citizen</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Department</th>
                          <th>Resolution Remarks</th>
                          <th>Citizen CSAT</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resolvedComplaints.map((c) => (
                          <tr key={c.id}>
                            <td><strong className="text-mono">{c.trackingId}</strong></td>
                            <td>
                              <span className={`badge-domain ${getDomainInfo(c).badgeClass}`}>
                                {getDomainInfo(c).icon} {getDomainInfo(c).shortLabel}
                              </span>
                            </td>
                            <td>{c.userName}</td>
                            <td>{c.title}</td>
                            <td><span className="tag-category">{c.category}</span></td>
                            <td>{c.assignedDepartment || "Civic Services"}</td>
                            <td>
                              <span className="resolution-text">
                                {c.adminRemarks || "Work completed and verified."}
                              </span>
                            </td>
                            <td>
                              {c.rating ? (
                                <span className="star-rating-badge">★ {c.rating} / 5</span>
                              ) : (
                                <span className="text-muted">Awaiting Rating</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn-action-view"
                                onClick={() => setInspectComplaint(c)}
                              >
                                View Dossier →
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

          {/* ==================== 8. REPORTS & ANALYTICS TAB ==================== */}
          {activeTab === "reports" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="card-header-flex">
                  <div>
                    <h3>Operational Analytics & Executive Reporting</h3>
                    <p className="card-subtitle">
                      Official statistical reports on grievance categories, monthly volume trends, and SLA resolution performance.
                    </p>
                  </div>
                  <button className="btn-primary-glow" onClick={handleExportCSV}>
                    📥 Export CSV Dataset
                  </button>
                </div>

                {/* Statistics Summary Grid */}
                <div className="report-summary-boxes">
                  <div className="report-box">
                    <span>Overall Resolution Rate</span>
                    <strong>{totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100}%</strong>
                    <small>{resolvedCount} of {totalCount} completed</small>
                  </div>
                  <div className="report-box">
                    <span>Average Citizen CSAT</span>
                    <strong className="text-amber">★ {analytics?.avgRating || 4.8} / 5.0</strong>
                    <small>From verified citizens</small>
                  </div>
                  <div className="report-box">
                    <span>Average Resolution Turnaround</span>
                    <strong>{analytics?.avgResolutionHours || 36} Hours</strong>
                    <small>Target SLA standard: 48h</small>
                  </div>
                  <div className="report-box">
                    <span>SLA Breaches / Escalated</span>
                    <strong className={analytics?.escalated > 0 ? "text-rose" : "text-emerald"}>
                      {analytics?.escalated || 0} Cases
                    </strong>
                    <small>Auto-escalated to supervisor</small>
                  </div>
                </div>

                {/* Cross-Domain Comparative Reports */}
                <div className="analytics-card" style={{ marginTop: "24px" }}>
                  <h4>Cross-Sector Multi-Domain Operational Report</h4>
                  <p className="analytics-sub">Comparative breakdown across municipal, academic, corporate, healthcare, and transport domains</p>
                  <div className="table-responsive" style={{ marginTop: "12px" }}>
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Sector / Domain</th>
                          <th>Responsible Authority</th>
                          <th>Total Logged</th>
                          <th>Pending</th>
                          <th>In Progress</th>
                          <th>Resolved</th>
                          <th>Resolution Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(DOMAIN_META).map(([key, meta]) => {
                          const domList = complaints.filter(c => (c.domain || "MUNICIPALITY").toUpperCase() === key);
                          const totalD = domList.length;
                          const pendD = domList.filter(c => c.status === "SUBMITTED" || c.status === "PENDING").length;
                          const progD = domList.filter(c => c.status === "IN_PROGRESS" || c.status === "ASSIGNED").length;
                          const resD = domList.filter(c => c.status === "RESOLVED" || c.status === "CLOSED").length;
                          const rate = totalD > 0 ? Math.round((resD / totalD) * 100) : 100;
                          return (
                            <tr key={key}>
                              <td>
                                <span className={`badge-domain ${meta.badgeClass}`}>
                                  {meta.icon} {meta.label}
                                </span>
                              </td>
                              <td><strong>{meta.authority}</strong></td>
                              <td><strong className="text-mono">{totalD}</strong></td>
                              <td><span className="text-amber font-bold">{pendD}</span></td>
                              <td><span className="text-sky font-bold">{progD}</span></td>
                              <td><span className="text-emerald font-bold">{resD}</span></td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div className="domain-progress-bar-bg" style={{ width: "80px" }}>
                                    <div className="domain-progress-bar-fill" style={{ width: `${rate}%` }} />
                                  </div>
                                  <span style={{ fontSize: "12px", fontWeight: 700 }}>{rate}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Monthly Volume Trend Chart */}
                <div className="analytics-card" style={{ marginTop: "24px" }}>
                  <h4>Monthly Grievance Volume Reports</h4>
                  <p className="analytics-sub">Grievances logged by calendar month</p>

                  <div className="bar-chart-container">
                    {analytics?.monthlyStats && Object.keys(analytics.monthlyStats).length > 0 ? (
                      Object.entries(analytics.monthlyStats).map(([month, count]) => {
                        const maxVal = Math.max(...Object.values(analytics.monthlyStats), 1);
                        const pct = Math.round((count / maxVal) * 100);
                        return (
                          <div key={month} className="bar-chart-item">
                            <div className="bar-labels">
                              <span className="bar-dept">{month}</span>
                              <span className="bar-count">{count} grievances</span>
                            </div>
                            <div className="bar-track">
                              <div className="bar-fill cyan" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="empty-chart-note">Monthly records will populate with incoming complaints.</p>
                    )}
                  </div>
                </div>

                {/* Resolved vs Pending Graphical Comparison */}
                <div className="analytics-card" style={{ marginTop: "20px" }}>
                  <h4>Resolved vs. Pending Comparison</h4>
                  <div className="ratio-bar-wrapper">
                    <div
                      className="ratio-fill resolved"
                      style={{ width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 50}%` }}
                      title={`Resolved: ${resolvedCount}`}
                    >
                      Resolved ({resolvedCount})
                    </div>
                    <div
                      className="ratio-fill pending"
                      style={{ width: `${totalCount > 0 ? (pendingCount / totalCount) * 100 : 50}%` }}
                      title={`Pending: ${pendingCount}`}
                    >
                      Pending ({pendingCount})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 9. NOTIFICATIONS BROADCAST TAB ==================== */}
          {activeTab === "notifications" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="card-header">
                  <h3>Broadcast Administrative Notifications</h3>
                  <p className="card-subtitle">
                    Send official announcements or important civic updates directly to citizen inboxes.
                  </p>
                </div>

                <form onSubmit={handleSendNotification} className="portal-form">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Target Audience <span className="required">*</span></label>
                      <select
                        className="admin-select full-width"
                        value={notifForm.userId}
                        onChange={(e) => setNotifForm({ ...notifForm, userId: e.target.value })}
                      >
                        <option value="ALL">📢 All Registered Citizens (Public Broadcast)</option>
                        {citizens.map((c) => (
                          <option key={c.id} value={c.id}>
                            👤 {c.name} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Notification Type</label>
                      <select
                        className="admin-select full-width"
                        value={notifForm.type}
                        onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                      >
                        <option value="ANNOUNCEMENT">Public Civic Announcement</option>
                        <option value="STATUS_UPDATE">Grievance Milestone Alert</option>
                        <option value="ESCALATION">Urgent Public Health / Safety Notice</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notification Headline / Title <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Scheduled Water Pipeline Maintenance in Sector 4"
                      value={notifForm.title}
                      onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Notification Content / Message <span className="required">*</span></label>
                    <textarea
                      rows="4"
                      placeholder="Enter the full message details, advisory precautions, and affected areas..."
                      value={notifForm.message}
                      onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-glow"
                    disabled={notifSending}
                  >
                    {notifSending ? "Transmitting..." : "Send Broadcast Notification →"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ==================== 10. FEEDBACK MANAGEMENT TAB ==================== */}
          {activeTab === "feedback" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="card-header-flex">
                  <div>
                    <h3>Citizen CSAT Ratings & Feedback</h3>
                    <p className="card-subtitle">
                      Verified reviews submitted by citizens upon resolution of grievances.
                    </p>
                  </div>
                  <div className="csat-summary-pill">
                    ★ Average CSAT: <strong>{analytics?.avgRating || 4.8} / 5.0</strong>
                  </div>
                </div>

                {feedbacks.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="empty-icon">⭐</div>
                    <h4>No feedback submissions yet</h4>
                    <p>Feedback ratings submitted by citizens will appear here.</p>
                  </div>
                ) : (
                  <div className="feedback-cards-grid">
                    {feedbacks.map((c) => (
                      <div key={c.id} className="feedback-review-card">
                        <div className="review-card-top">
                          <div>
                            <strong>{c.userName || "Verified Citizen"}</strong>
                            <small className="text-muted">Grievance: {c.trackingId}</small>
                          </div>
                          <div className="review-stars">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} className={`star ${s <= c.rating ? "filled" : ""}`}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="review-comment">
                          "{c.feedback || "Satisfied with prompt resolution."}"
                        </p>

                        <div className="review-meta-bottom">
                          <span>Department: {c.assignedDepartment || "Civic Services"}</span>
                          <small>
                            {c.feedbackSubmittedAt
                              ? new Date(c.feedbackSubmittedAt).toLocaleDateString()
                              : "Recently"}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 11. SETTINGS TAB ==================== */}
          {activeTab === "settings" && (
            <div className="tab-pane animate-fade-in">
              <div className="portal-card">
                <div className="card-header">
                  <h3>Portal Policy & System Settings</h3>
                  <p className="card-subtitle">
                    Configure civic service policies, SLA turnaround defaults, and helpline disclosures.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    showToast("System settings updated successfully!");
                  }}
                  className="portal-form"
                >
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Public Authority Portal Name</label>
                      <input
                        type="text"
                        value={settings.portalName}
                        onChange={(e) => setSettings({ ...settings, portalName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Primary Emergency Helpline</label>
                      <input
                        type="text"
                        value={settings.emergencyHelpline}
                        onChange={(e) => setSettings({ ...settings, emergencyHelpline: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-section-header">
                    <h4>Default Priority SLA Resolution Windows (Hours)</h4>
                    <small>Complaints not resolved within these timeframes trigger supervisor escalation.</small>
                  </div>

                  <div className="form-grid-4">
                    <div className="form-group">
                      <label>Urgent (Hours)</label>
                      <input
                        type="number"
                        value={settings.urgentSlaHours}
                        onChange={(e) => setSettings({ ...settings, urgentSlaHours: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>High (Hours)</label>
                      <input
                        type="number"
                        value={settings.highSlaHours}
                        onChange={(e) => setSettings({ ...settings, highSlaHours: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Medium (Hours)</label>
                      <input
                        type="number"
                        value={settings.mediumSlaHours}
                        onChange={(e) => setSettings({ ...settings, mediumSlaHours: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Low (Hours)</label>
                      <input
                        type="number"
                        value={settings.lowSlaHours}
                        onChange={(e) => setSettings({ ...settings, lowSlaHours: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-glow">
                    Save System Settings →
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ==================== 12. ADMIN PROFILE TAB ==================== */}
          {activeTab === "profile" && (
            <div className="tab-pane animate-fade-in">
              <div className="profile-grid">
                <div className="portal-card profile-id-card admin">
                  <div className="profile-avatar-large admin">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                  </div>
                  <h3>{user?.name || "Administrator"}</h3>
                  <span className="badge-role admin">System Administrator</span>
                  <div className="profile-meta-list">
                    <div className="meta-row">
                      <span>Email Account:</span>
                      <strong>{user?.email || "admin@.com"}</strong>
                    </div>
                    <div className="meta-row">
                      <span>Authority:</span>
                      <strong>{organization?.name || "Apex Municipal Corporation"}</strong>
                    </div>
                    <div className="meta-row">
                      <span>Permissions:</span>
                      <strong className="text-emerald">Full Root Access ✓</strong>
                    </div>
                  </div>
                </div>

                <div className="portal-card">
                  <div className="card-header">
                    <h3>Administrator Details & Credentials</h3>
                    <p className="card-subtitle">Update administrator identity and access security credentials.</p>
                  </div>

                  <form onSubmit={handleSaveAdminProfile} className="portal-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Administrator Name</label>
                        <input
                          type="text"
                          value={adminProfileForm.name}
                          onChange={(e) => setAdminProfileForm({ ...adminProfileForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address (Locked)</label>
                        <input
                          type="email"
                          value={user?.email || "admin@.com"}
                          disabled
                          className="input-disabled"
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Contact Phone</label>
                        <input
                          type="text"
                          value={adminProfileForm.phone}
                          onChange={(e) => setAdminProfileForm({ ...adminProfileForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Office Address</label>
                        <input
                          type="text"
                          value={adminProfileForm.address}
                          onChange={(e) => setAdminProfileForm({ ...adminProfileForm, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-section-header">
                      <h4>Change Password</h4>
                      <small>Leave blank if keeping current password.</small>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Current Password</label>
                        <input
                          type="password"
                          value={adminProfileForm.currentPassword}
                          onChange={(e) => setAdminProfileForm({ ...adminProfileForm, currentPassword: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          value={adminProfileForm.newPassword}
                          onChange={(e) => setAdminProfileForm({ ...adminProfileForm, newPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary-glow"
                      disabled={adminProfileSaving}
                    >
                      {adminProfileSaving ? "Saving..." : "Update Administrator Profile →"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ==================== MODALS ==================== */}

      {/* 1. Status Update Modal */}
      {statusModalComplaint && (
        <div className="modal-backdrop">
          <div className="modal-card animate-fade-in">
            <div className="modal-header">
              <div>
                <span className="modal-tag">STATUS WORKFLOW DISPATCH</span>
                <h3>Update Grievance Status: {statusModalComplaint.trackingId}</h3>
              </div>
              <button className="modal-close" onClick={() => setStatusModalComplaint(null)}>×</button>
            </div>

            <form onSubmit={handleSaveStatus} className="portal-form">
              <div className="form-group">
                <label>Complaint Title</label>
                <input type="text" value={statusModalComplaint.title} disabled className="input-disabled" />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Next Workflow Status <span className="required">*</span></label>
                  <select
                    className="admin-select full-width"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority Override</label>
                  <select
                    className="admin-select full-width"
                    value={statusPriority}
                    onChange={(e) => setStatusPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Administrative Remarks / Inspection Notes</label>
                <textarea
                  rows="3"
                  placeholder="Enter remarks visible to citizen on their progress timeline..."
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                />
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn-secondary-light"
                  onClick={() => setStatusModalComplaint(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-glow"
                  disabled={statusUpdating}
                >
                  {statusUpdating ? "Updating..." : "Commit Status Change →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Assignment Modal */}
      {assignModalComplaint && (
        <div className="modal-backdrop">
          <div className="modal-card animate-fade-in">
            <div className="modal-header">
              <div>
                <span className="modal-tag">DEPARTMENT ROUTING</span>
                <h3>Assign Grievance: {assignModalComplaint.trackingId}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <span className={`badge-domain ${getDomainInfo(assignModalComplaint).badgeClass}`}>
                    {getDomainInfo(assignModalComplaint).icon} {assignModalComplaint.organizationName || getDomainInfo(assignModalComplaint).label}
                  </span>
                  <span className={`priority-tag ${assignModalComplaint.priority?.toLowerCase()}`}>
                    {assignModalComplaint.priority} Priority
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setAssignModalComplaint(null)}>×</button>
            </div>

            <form onSubmit={handleSaveAssignment} className="portal-form">
              <div className="form-group">
                <label>Complaint Summary</label>
                <input type="text" value={assignModalComplaint.title} disabled className="input-disabled" />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Target Department ({assignModalComplaint.organizationName || "Authority"}) <span className="required">*</span></label>
                  <select
                    className="admin-select full-width"
                    value={assignDept}
                    onChange={(e) => setAssignDept(e.target.value)}
                    required
                  >
                    {(() => {
                      const cOrg = organizations.find((o) => o.id === assignModalComplaint.organizationId || o.slug === assignModalComplaint.organizationId) || organization;
                      const depts = (cOrg && cOrg.departments && cOrg.departments.length > 0) ? cOrg.departments : departments;
                      return depts.map((d) => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ));
                    })()}
                  </select>
                </div>

                <div className="form-group">
                  <label>Responsible Field Officer / Staff</label>
                  <input
                    type="text"
                    placeholder="e.g. Inspector R. Sharma"
                    value={assignOfficer}
                    onChange={(e) => setAssignOfficer(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assignment Remarks & Instructions</label>
                <textarea
                  rows="3"
                  placeholder="Provide technical instructions for the field team..."
                  value={assignDescription}
                  onChange={(e) => setAssignDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn-secondary-light"
                  onClick={() => setAssignModalComplaint(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-glow"
                  disabled={assignUpdating}
                >
                  {assignUpdating ? "Routing..." : "Confirm Department Assignment →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add/Edit Department Modal */}
      {showDeptModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-fade-in">
            <div className="modal-header">
              <div>
                <span className="modal-tag">MUNICIPAL INFRASTRUCTURE</span>
                <h3>{editingDeptName ? `Edit Department: ${editingDeptName}` : "Add New Department"}</h3>
              </div>
              <button className="modal-close" onClick={() => setShowDeptModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveDepartment} className="portal-form">
              <div className="form-group">
                <label>Department Name <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Public Health & Vector Control"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Head Officer / Superintendent</label>
                <input
                  type="text"
                  placeholder="e.g. Chief Medical Officer Dr. Bannerjee"
                  value={deptForm.headOfficer}
                  onChange={(e) => setDeptForm({ ...deptForm, headOfficer: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Department Email</label>
                  <input
                    type="email"
                    placeholder="e.g. health@apex-municipality.gov"
                    value={deptForm.contactEmail}
                    onChange={(e) => setDeptForm({ ...deptForm, contactEmail: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Department Phone / Extension</label>
                  <input
                    type="text"
                    placeholder="e.g. 1800-HEALTH-EXT"
                    value={deptForm.contactPhone}
                    onChange={(e) => setDeptForm({ ...deptForm, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn-secondary-light"
                  onClick={() => setShowDeptModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-glow"
                  disabled={deptSaving}
                >
                  {deptSaving ? "Saving..." : editingDeptName ? "Update Department" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Full Dossier Inspection Modal */}
      {inspectComplaint && (
        <div className="modal-backdrop">
          <div className="modal-card detail-modal animate-fade-in">
            <div className="modal-header">
              <div>
                <span className="modal-tag">OFFICIAL GRIEVANCE DOSSIER</span>
                <h2>{inspectComplaint.trackingId}</h2>
              </div>
              <button className="modal-close" onClick={() => setInspectComplaint(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-top-meta">
                <span className={`badge-domain ${getDomainInfo(inspectComplaint).badgeClass}`}>
                  {getDomainInfo(inspectComplaint).icon} {inspectComplaint.organizationName || getDomainInfo(inspectComplaint).label}
                </span>
                <span className={`status-badge large ${inspectComplaint.status?.toLowerCase()}`}>
                  {inspectComplaint.status?.replace("_", " ")}
                </span>
                <span className={`priority-tag ${inspectComplaint.priority?.toLowerCase()}`}>
                  {inspectComplaint.priority} Priority
                </span>
                <span className="tag-category">{inspectComplaint.category}</span>
              </div>

              <h3 className="modal-case-title">{inspectComplaint.title}</h3>

              <div className="modal-info-grid">
                <div>
                  <small>Lodging Citizen</small>
                  <strong>{inspectComplaint.userName} ({inspectComplaint.userEmail})</strong>
                </div>
                <div>
                  <small>Location Landmark</small>
                  <strong>{inspectComplaint.location}</strong>
                </div>
                <div>
                  <small>Assigned Department</small>
                  <strong>{inspectComplaint.assignedDepartment || "Pending"}</strong>
                </div>
                <div>
                  <small>Assigned Officer</small>
                  <strong>{inspectComplaint.assignedOfficer || "Pending"}</strong>
                </div>
              </div>

              <div className="modal-desc-box">
                <h4>Citizen Description:</h4>
                <p>{inspectComplaint.description}</p>
              </div>

              {inspectComplaint.attachmentData && (
                <div className="modal-evidence-box">
                  <h4>Uploaded Photographic Evidence:</h4>
                  <img
                    src={inspectComplaint.attachmentData}
                    alt="Evidence"
                    className="modal-evidence-img"
                  />
                </div>
              )}

              {/* Status History */}
              <div className="modal-history-box">
                <h4>Audit & Progress Trail:</h4>
                <div className="timeline-trail">
                  {inspectComplaint.statusHistory?.map((item, i) => (
                    <div key={i} className="timeline-entry">
                      <div className="timeline-marker" />
                      <div className="timeline-body">
                        <div className="timeline-top">
                          <span className={`status-badge small ${item.status?.toLowerCase()}`}>
                            {item.status?.replace("_", " ")}
                          </span>
                          <small>
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Recorded"}
                          </small>
                        </div>
                        <p className="timeline-remarks">{item.remarks}</p>
                        <small className="timeline-by">Actioned by: {item.updatedBy || "System"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-table-action status"
                onClick={() => {
                  const comp = inspectComplaint;
                  setInspectComplaint(null);
                  openStatusModal(comp);
                }}
              >
                🔄 Update Status
              </button>
              <button
                className="btn-table-action assign"
                onClick={() => {
                  const comp = inspectComplaint;
                  setInspectComplaint(null);
                  openAssignModal(comp);
                }}
              >
                🎯 Assign Department
              </button>
              <button
                className="btn-secondary-light"
                onClick={() => setInspectComplaint(null)}
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

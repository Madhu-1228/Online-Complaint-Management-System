import React, { useState } from "react";

export default function Navbar({
  activePage,
  setActivePage,
  user,
  onOpenAuth,
  onLogout,
  systemOnline,
  notifications,
  unreadCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNotificationClick,
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const isSuperAdmin = user?.role === "ROLE_SUPER_ADMIN";
  const isOrgAdmin = user?.role === "ROLE_ORG_ADMIN";
  const isOfficer = user?.role === "ROLE_OFFICER";

  return (
    <header className={`navbar-container ${isSuperAdmin ? "super-admin-mode" : isOrgAdmin ? "org-admin-mode" : ""}`}>
      {/* Platform/Tenant Stripe */}
      {user && (
        <div className={`admin-banner-stripe ${isSuperAdmin ? "super" : "tenant"}`}>
          <div className="admin-banner-inner">
            <span className="admin-banner-text">
              {isSuperAdmin ? (
                <>👑 <strong>PLATFORM MASTER ADMIN CONSOLE</strong> · Multi-Tenant Governance</>
              ) : isOrgAdmin ? (
                <>🏛️ <strong>ORGANIZATION ADMIN</strong> · {user.organizationName || "Municipal Division"}</>
              ) : isOfficer ? (
                <>🛠️ <strong>STAFF / FIELD OFFICER</strong> · {user.organizationName || "Municipal Division"} ({user.department || "Operations"})</>
              ) : (
                <>👤 <strong>CITIZEN / MEMBER PORTAL</strong> · {user.organizationName || "Apex Municipal Corporation"}</>
              )}
            </span>
            <span className="admin-banner-status">{user.email}</span>
          </div>
        </div>
      )}

      <div className="navbar-inner">
        {/* Brand */}
        <button className="navbar-brand" onClick={() => setActivePage("home")}>
          <div className="brand-logo-glow">
            <span className="brand-icon">🏛️</span>
          </div>
          <div className="brand-text">
            <div className="brand-title">
              Civic<strong>Care</strong>
            </div>
            <div className="brand-subtitle">Multi-Tenant Grievance Engine</div>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="navbar-nav">
          <button
            className={`nav-link ${activePage === "home" ? "active" : ""}`}
            onClick={() => setActivePage("home")}
          >
            Home
          </button>
          <button
            className={`nav-link ${activePage === "submit" ? "active" : ""}`}
            onClick={() => setActivePage("submit")}
          >
            Lodge Grievance
          </button>
          <button
            className={`nav-link ${activePage === "track" ? "active" : ""}`}
            onClick={() => setActivePage("track")}
          >
            Track Status
          </button>

          {/* Citizen Dashboard Pill */}
          {user && user.role === "ROLE_USER" && (
            <button
              className={`nav-link citizen-pill ${activePage === "citizen" ? "active" : ""}`}
              onClick={() => setActivePage("citizen")}
            >
              <span>👤 Citizen Dashboard</span>
            </button>
          )}

          {/* Admin Dashboard Pill */}
          {user && user.role !== "ROLE_USER" && (
            <button
              className={`nav-link admin-pill ${activePage === "admin" ? "active" : ""}`}
              onClick={() => setActivePage("admin")}
            >
              <span>🛡️ Admin Command Center</span>
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Health Pill */}
          <div className="system-status-pill" title="MongoDB Multi-Tenant Engine">
            <span className={`status-pulse ${systemOnline ? "online" : "checking"}`} />
            <span className="status-label">{systemOnline ? "Database Online" : "Connecting..."}</span>
          </div>

          {/* In-App Notifications Bell */}
          {user && (
            <div className="notification-bell-container">
              <button
                className="btn-notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-counter-badge">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown animate-fade-in">
                  <div className="notifications-header">
                    <h4>Alerts & Milestones</h4>
                    {unreadCount > 0 && (
                      <button
                        className="btn-mark-all"
                        onClick={() => {
                          onMarkAllNotificationsRead();
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notifications-list">
                    {notifications && notifications.length > 0 ? (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className={`notification-item ${!n.read ? "unread" : ""}`}
                          onClick={() => {
                            if (!n.read) onMarkNotificationRead(n.id);
                            if (n.complaintTrackingId) {
                              onNotificationClick(n.complaintTrackingId);
                              setShowNotifications(false);
                            }
                          }}
                        >
                          <div className="notification-item-icon">
                            {n.type === "RESOLUTION" ? "✅" : n.type === "ASSIGNMENT" ? "📋" : n.type === "ESCALATION" ? "🚨" : "📢"}
                          </div>
                          <div className="notification-item-content">
                            <strong>{n.title}</strong>
                            <p>{n.message}</p>
                            <small>
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                            </small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notifications-empty">
                        <span>🔕</span>
                        <p>No new alerts at this time.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile or Sign In */}
          {user ? (
            <div className="user-profile-menu">
              <div
                className="user-profile-clickable"
                onClick={() => setActivePage(user.role === "ROLE_USER" ? "citizen" : "admin")}
                title="Go to Dashboard"
              >
                <div className="user-avatar" title={user.email}>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role-badge">
                    {user.role === "ROLE_USER" ? "CITIZEN" : "ADMIN"}
                  </span>
                </div>
              </div>
              <button className="logout-btn" onClick={onLogout} title="Sign Out">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="navbar-auth-group">
              <button
                className="btn-signin-citizen"
                onClick={() => onOpenAuth("citizen", "login")}
                title="Sign in as Citizen"
              >
                <span>👤</span> Citizen Login
              </button>
              <button
                className="btn-signin-admin"
                onClick={() => onOpenAuth("admin", "login")}
                title="Sign in as Municipal Admin or Department Staff"
              >
                <span>🛡️</span> Admin Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

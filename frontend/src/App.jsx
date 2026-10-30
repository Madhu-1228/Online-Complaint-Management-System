import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import CitizenPortal from "./components/CitizenPortal";
import AdminPortal from "./components/AdminPortal";
import SubmitComplaint from "./components/SubmitComplaint";
import TrackComplaint from "./components/TrackComplaint";
import MyComplaints from "./components/MyComplaints";
import SuperAdminPortal from "./components/SuperAdminPortal";
import AuthModal from "./components/AuthModal";
import { complaintAPI, notificationAPI } from "./services/api";
import "./App.css";

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [user, setUser] = useState(null);
  const [selectedOrgIdOverride, setSelectedOrgIdOverride] = useState("");
  const [authModalConfig, setAuthModalConfig] = useState({
    isOpen: false,
    portal: "citizen",
    mode: "login",
  });
  const [trackedTrackingId, setTrackedTrackingId] = useState("");
  const [stats, setStats] = useState(null);
  const [systemOnline, setSystemOnline] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize user from local storage & load database stats
  useEffect(() => {
    const savedUser = localStorage.getItem("civiccare_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.role === "ROLE_USER") {
          setActivePage("citizen");
        } else {
          setActivePage("admin");
        }
      } catch (e) {
        localStorage.removeItem("civiccare_user");
      }
    }

    checkHealthAndStats();
  }, []);

  // Poll notifications when user is authenticated
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  async function checkHealthAndStats() {
    try {
      const [dbHealth, statsData] = await Promise.all([
        complaintAPI.checkDatabase(),
        complaintAPI.getAnalytics(),
      ]);
      if (dbHealth && dbHealth.databaseName) {
        setSystemOnline(true);
      }
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.warn("Database or backend status notice:", err);
      setSystemOnline(false);
    }
  }

  async function fetchNotifications() {
    try {
      const data = await notificationAPI.getMyNotifications();
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Ignore background notification fetch errors
    }
  }

  async function handleMarkNotificationRead(id) {
    try {
      await notificationAPI.markAsRead(id);
      fetchNotifications();
    } catch (e) {}
  }

  async function handleMarkAllNotificationsRead() {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
    } catch (e) {}
  }

  function handleLoginSuccess(loggedInUser) {
    setUser(loggedInUser);
    showToast(`Welcome back, ${loggedInUser.name}!`);
    if (loggedInUser.role === "ROLE_USER") {
      setActivePage("citizen");
    } else {
      setActivePage("admin");
    }
  }

  function handleNavigatePage(targetPage) {
    // Role-based Access Control Guard
    if (targetPage === "admin") {
      if (!user) {
        handleOpenAuth("admin", "login");
        showToast("Administrator sign-in required.", "error");
        return;
      }
      if (user.role === "ROLE_USER") {
        showToast("Access Denied: Administrator role required.", "error");
        setActivePage("citizen");
        return;
      }
    }

    if (targetPage === "citizen") {
      if (!user) {
        handleOpenAuth("citizen", "login");
        showToast("Citizen login required.", "error");
        return;
      }
      if (user.role !== "ROLE_USER") {
        showToast("Redirected to Admin Dashboard.", "error");
        setActivePage("admin");
        return;
      }
    }

    setActivePage(targetPage);
  }

  function handleLogout() {
    localStorage.removeItem("civiccare_token");
    localStorage.removeItem("civiccare_user");
    setUser(null);
    setSelectedOrgIdOverride("");
    setNotifications([]);
    setUnreadCount(0);
    showToast("Signed out successfully.");
    setActivePage("home");
  }

  function handleTrackComplaint(id) {
    setTrackedTrackingId(id);
    setActivePage("track");
  }

  function handleOpenAuth(portal = "citizen", mode = "login") {
    setAuthModalConfig({
      isOpen: true,
      portal: portal,
      mode: mode,
    });
  }

  function handleComplaintSubmitted(newComplaint) {
    checkHealthAndStats();
    if (user) fetchNotifications();
    showToast(`Grievance lodged! Reference: ${newComplaint.trackingId}`);
  }

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  }

  return (
    <div className="app-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="alert-box success toast-floating animate-fade-in">
          <span className="alert-icon">✓</span>
          <p>{toastMessage}</p>
        </div>
      )}

      {/* Modern Light Theme Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={handleNavigatePage}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        systemOnline={systemOnline}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onNotificationClick={handleTrackComplaint}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activePage === "citizen" && (
          <CitizenPortal
            user={user}
            onLogout={handleLogout}
            onUpdateUser={(updated) => {
              setUser(updated);
              localStorage.setItem("civiccare_user", JSON.stringify(updated));
            }}
          />
        )}

        {activePage === "admin" && (
          <AdminPortal
            user={user}
            onLogout={handleLogout}
            onUpdateUser={(updated) => {
              setUser(updated);
              localStorage.setItem("civiccare_user", JSON.stringify(updated));
            }}
          />
        )}

        {activePage === "home" && (
          <Home
            setActivePage={handleNavigatePage}
            stats={stats}
            onOpenAuth={handleOpenAuth}
            user={user}
          />
        )}

        {activePage === "submit" && (
          <SubmitComplaint
            user={user}
            onComplaintSubmitted={handleComplaintSubmitted}
            onTrackComplaint={handleTrackComplaint}
          />
        )}

        {activePage === "track" && (
          <TrackComplaint initialTrackingId={trackedTrackingId} />
        )}

        {activePage === "my-complaints" && (
          <MyComplaints
            user={user}
            onTrackComplaint={handleTrackComplaint}
            onGoToSubmit={() => setActivePage("submit")}
          />
        )}

        {activePage === "super-admin" && (
          <SuperAdminPortal
            onSelectOrg={(orgId) => {
              setSelectedOrgIdOverride(orgId);
              setActivePage("admin");
            }}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalConfig.isOpen}
        initialPortal={authModalConfig.portal}
        initialMode={authModalConfig.mode}
        onClose={() => setAuthModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Modern Clean Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <strong>CivicCare Public Portal</strong>
            <span>Online Complaint Management System · B.Tech IT Capstone</span>
          </div>
          <div className="footer-tech-stack">
            <span>React + Vite (Light SaaS)</span>
            <span>•</span>
            <span>Spring Boot</span>
            <span>•</span>
            <span>MongoDB Driver</span>
            <span>•</span>
            <span>JWT Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

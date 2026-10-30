import React, { useState, useEffect } from "react";
import { authAPI, organizationAPI } from "../services/api";

// Accepts standard email format (name@domain.com) and test pattern (name@.com)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialPortal = "citizen",
  initialMode = "login",
}) {
  // Modes: "login" | "register"
  const [authMode, setAuthMode] = useState(initialMode);
  // Portals: "citizen" | "admin" (Placify style segmented switch)
  const [loginPortal, setLoginPortal] = useState(initialPortal);

  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    organizationId: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState(null); // { valid: boolean, message: string }

  // Sync state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode || "login");
      setLoginPortal(initialPortal || "citizen");
      setError("");
      setShowPassword(false);
      setShowConfirmPassword(false);

      organizationAPI
        .getActive()
        .then((orgs) => {
          setOrganizations(orgs || []);
          if (orgs && orgs.length > 0) {
            setFormData((prev) => ({
              ...prev,
              organizationId: prev.organizationId || orgs[0].id,
            }));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialPortal, initialMode]);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time format validation for email / username field
    if (name === "email") {
      const trimmed = value.trim();
      if (!trimmed) {
        setEmailStatus(null);
      } else if (EMAIL_REGEX.test(trimmed)) {
        setEmailStatus({ valid: true, message: "Valid email format ✓" });
      } else {
        setEmailStatus({
          valid: false,
          message: "Format required: name@domain.com (e.g. devan@example.com)",
        });
      }
    }
  }

  function handleSwitchPortal(portal) {
    setLoginPortal(portal);
    setError("");
  }

  function handleSwitchMode(mode) {
    setAuthMode(mode);
    setError("");
    setEmailStatus(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmedEmail = formData.email.trim();

    // Strict Email Format Check
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(
        "Invalid email format. Please provide a valid email format such as name@domain.com (e.g. devan@example.com)."
      );
      return;
    }

    // Validation for Citizen Registration
    if (authMode === "register") {
      if (!formData.name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match. Please verify both passwords.");
        return;
      }
    }

    setLoading(true);

    try {
      if (authMode === "login") {
        const data = await authAPI.login(trimmedEmail, formData.password);
        localStorage.setItem("civiccare_token", data.token);
        localStorage.setItem("civiccare_user", JSON.stringify(data.user));
        onLoginSuccess(data.user);
        onClose();
      } else {
        // Dedicated Citizen Registration
        const registerPayload = {
          name: formData.name.trim(),
          email: trimmedEmail,
          password: formData.password,
          phone: formData.phone.trim(),
          role: "ROLE_USER", // Citizen Public User
          organizationId: formData.organizationId || (organizations[0]?.id || ""),
        };

        const data = await authAPI.register(registerPayload);
        localStorage.setItem("civiccare_token", data.token);
        localStorage.setItem("civiccare_user", JSON.stringify(data.user));
        onLoginSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError(
        err.customMessage || "Authentication failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  // 1-Click Multi-Role Demo Logins
  async function handleDemoLogin(email, password) {
    setError("");
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem("civiccare_token", data.token);
      localStorage.setItem("civiccare_user", JSON.stringify(data.user));
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.customMessage || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="auth-card animate-fade-in">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">🏛️</div>
          <h2>
            {authMode === "register"
              ? "Create Citizen Account"
              : loginPortal === "citizen"
              ? "Citizen Grievance Portal"
              : "Administrative & Official Portal"}
          </h2>
          <p>
            {authMode === "register"
              ? "Register as a citizen or resident under your municipality to submit and track public grievances."
              : loginPortal === "citizen"
              ? "Sign in to report civic issues, track SLA progress live, and review resolution history."
              : "Administrative access for Platform Super Admins, Municipal Administrators & Department Field Officers."}
          </p>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        {/* Primary Auth Mode Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${authMode === "login" ? "active" : ""}`}
            onClick={() => handleSwitchMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${authMode === "register" ? "active" : ""}`}
            onClick={() => handleSwitchMode("register")}
          >
            Register as Citizen
          </button>
        </div>

        {/* In Sign In mode: Segmented Placify-style Toggle between Citizen and Admin */}
        {authMode === "login" && (
          <>
            <div className="auth-segmented-switch">
              <button
                type="button"
                className={`auth-switch-btn ${loginPortal === "citizen" ? "active citizen" : ""}`}
                onClick={() => handleSwitchPortal("citizen")}
              >
                <span>👤</span> Citizen Portal
              </button>
              <button
                type="button"
                className={`auth-switch-btn ${loginPortal === "admin" ? "active admin" : ""}`}
                onClick={() => handleSwitchPortal("admin")}
              >
                <span>🛡️</span> Admin & Official
              </button>
            </div>

            {/* Mode Context Notice */}
            <div className={`auth-mode-notice ${loginPortal}`}>
              {loginPortal === "citizen" ? (
                <>
                  <span className="notice-icon">👤</span>
                  <span>
                    <strong>Citizen Portal:</strong> Lodge complaints, track live investigation milestones, and rate civic service outcomes.
                  </span>
                </>
              ) : (
                <>
                  <span className="notice-icon">🛡️</span>
                  <span>
                    <strong>Admin & Official Portal:</strong> Manage departmental queues, update SLA workflows, and conduct field inspections.
                  </span>
                </>
              )}
            </div>
          </>
        )}

        {/* In Register mode: Context notice for Citizen registration */}
        {authMode === "register" && (
          <div className="auth-mode-notice citizen">
            <span className="notice-icon">👤</span>
            <span>
              <strong>Citizen Account Registration:</strong> Provide your name and email to lodge complaints with real-time audit trails.
            </span>
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div className="alert-box error animate-fade-in">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <p>{error}</p>
            </div>
            <button className="alert-dismiss" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {/* Main Authentication Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Citizen Registration Fields */}
          {authMode === "register" && (
            <>
              <div className="form-group">
                <label>
                  Select Municipality / Organization <span className="required">*</span>
                </label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleChange}
                  className="admin-select full-width"
                  required
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.type})
                    </option>
                  ))}
                </select>
                <small className="form-hint">Choose your civic body or college authority.</small>
              </div>

              <div className="form-group">
                <label>
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Devan Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Contact Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          {/* Email / Username Input (Validated strictly with proper format) */}
          <div className="form-group">
            <label>
              {authMode === "register"
                ? "Citizen Username / Email Address"
                : loginPortal === "citizen"
                ? "Citizen Username or Email Address"
                : "Official / Administrative Email"}{" "}
              <span className="required">*</span>
            </label>
            <input
              type="text"
              name="email"
              placeholder={
                loginPortal === "citizen" || authMode === "register"
                  ? "e.g. name@domain.com (e.g. devan@example.com)"
                  : "e.g. admin@civiccare.com or superadmin@civiccare.com"
              }
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            {/* Real-Time Format Feedback */}
            <div
              className={`email-format-hint ${
                emailStatus === null
                  ? "neutral"
                  : emailStatus.valid
                  ? "valid"
                  : "invalid"
              }`}
            >
              {emailStatus
                ? emailStatus.message
                : "Format required: name@domain.com (e.g. name@.com)"}
            </div>
          </div>

          {/* Password Input with Show/Hide toggle */}
          <div className="form-group">
            <label>
              Account Password <span className="required">*</span>
            </label>
            <div className="input-with-toggle">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={authMode === "register" ? "At least 6 characters" : "Enter account password"}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Confirm Password for Citizen Registration */}
          {authMode === "register" && (
            <div className="form-group">
              <label>
                Confirm Password <span className="required">*</span>
              </label>
              <div className="input-with-toggle">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading
              ? "Authenticating..."
              : authMode === "register"
              ? "Register as Citizen →"
              : loginPortal === "citizen"
              ? "Sign In as Citizen →"
              : "Sign In as Official / Admin →"}
          </button>
        </form>

        {/* Context Link at bottom */}
        <div className="auth-footer-prompt">
          {authMode === "login" ? (
            loginPortal === "citizen" ? (
              <span>
                Don't have a citizen account?{" "}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => handleSwitchMode("register")}
                >
                  Register as a Citizen →
                </button>
              </span>
            ) : (
              <span>
                Looking for citizen grievance portal?{" "}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => handleSwitchPortal("citizen")}
                >
                  Switch to Citizen Login →
                </button>
              </span>
            )
          ) : (
            <span>
              Already have a citizen account?{" "}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => handleSwitchMode("login")}
              >
                Sign In as Citizen →
              </button>
            </span>
          )}
        </div>

        {/* Tailored 1-Click Quick Demo Logins */}
        {authMode === "login" && (
          <div className="demo-logins-box">
            {loginPortal === "citizen" ? (
              <>
                <span className="demo-label">⚡ 1-CLICK OFFICIAL CITIZEN DEMO LOGIN</span>
                <div className="demo-buttons-citizen-single">
                  <button
                    type="button"
                    className="btn-demo-badge citizen full-width"
                    onClick={() => handleDemoLogin("devan@.com", "madhu@300526")}
                    disabled={loading}
                  >
                    <strong>👤 Devan Kumar (Citizen)</strong>
                    <small>Email: devan@.com · Password: madhu@300526</small>
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="demo-label">⚡ 1-CLICK OFFICIAL ADMIN DEMO LOGIN</span>
                <div className="demo-buttons-citizen-single">
                  <button
                    type="button"
                    className="btn-demo-badge admin full-width"
                    onClick={() => handleDemoLogin("admin@.com", "admin123")}
                    disabled={loading}
                  >
                    <strong>🛡️ Civic Administrator (Admin)</strong>
                    <small>Email: admin@.com · Password: admin123</small>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

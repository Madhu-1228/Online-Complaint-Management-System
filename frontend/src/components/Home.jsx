import React from "react";

export default function Home({ setActivePage, stats, onOpenAuth, user }) {
  const total = stats?.total || 0;
  const resolved = stats?.resolved || 0;
  const inProgress = stats?.inProgress || 0;
  const overdue = stats?.overdue || 0;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;
  const avgRating = stats?.avgRating || 4.8;

  return (
    <div className="home-container animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-sparkle">🏛️</span>
            <span>Official Civic Grievance & Public Redressal Portal</span>
          </div>

          <h1 className="hero-title">
            Direct Governance, <br />
            <span className="gradient-text">Accountable Resolution.</span>
          </h1>

          <p className="hero-subtitle">
            Report public municipal issues, track live status milestones with verifiable audit trails, 
            and rate municipal department performance upon resolution.
          </p>

          <div className="hero-cta-group">
            {user?.role === "ROLE_USER" ? (
              <button
                className="btn-primary-glow"
                onClick={() => setActivePage("citizen")}
              >
                <span>👤 Open Citizen Dashboard</span>
                <span className="btn-arrow">→</span>
              </button>
            ) : user && user.role !== "ROLE_USER" ? (
              <button
                className="btn-admin-cta"
                onClick={() => setActivePage("admin")}
              >
                <span>🛡️ Admin Command Center</span>
                <span className="btn-arrow">→</span>
              </button>
            ) : (
              <>
                <button
                  className="btn-primary-glow"
                  onClick={() => onOpenAuth("citizen", "login")}
                >
                  <span>👤 Citizen Portal Login</span>
                  <span className="btn-arrow">→</span>
                </button>
                <button
                  className="btn-admin-cta"
                  onClick={() => onOpenAuth("admin", "login")}
                >
                  <span>🛡️ Admin Login</span>
                </button>
              </>
            )}

            <button
              className="btn-secondary-light"
              onClick={() => setActivePage("track")}
            >
              <span>🔍 Track Existing Case</span>
            </button>
          </div>

          {/* Quick Info Points */}
          <div className="hero-perks">
            <div className="perk-item">
              <span className="perk-icon">⚡</span>
              <span>Unique Reference ID</span>
            </div>
            <div className="perk-divider" />
            <div className="perk-item">
              <span className="perk-icon">⏱️</span>
              <span>SLA Escalation Monitoring</span>
            </div>
            <div className="perk-divider" />
            <div className="perk-item">
              <span className="perk-icon">⭐</span>
              <span>Citizen CSAT Rating</span>
            </div>
          </div>
        </div>

        {/* Hero Operational Dashboard Metric Card */}
        <div className="hero-visual-card">
          <div className="visual-card-header">
            <div className="visual-header-left">
              <span className="live-dot" />
              <span className="visual-title">Live Municipal Status</span>
            </div>
            <span className="visual-tag">MongoDB Verified</span>
          </div>

          <div className="visual-metrics-grid">
            <div className="metric-box">
              <span className="metric-label">Total Grievances</span>
              <span className="metric-number">{total}</span>
              <span className="metric-trend text-emerald">↑ Public Records</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Resolution Rate</span>
              <span className="metric-number text-cyan">{resolutionRate}%</span>
              <span className="metric-trend">Verified Solved</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">In Field Progress</span>
              <span className="metric-number text-sky">{inProgress}</span>
              <span className="metric-trend">Dispatched Officers</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Citizen CSAT Rating</span>
              <span className="metric-number text-amber">{avgRating > 0 ? avgRating : 5.0} ★</span>
              <span className="metric-trend">Satisfaction Score</span>
            </div>
          </div>

          <div className="visual-preview-action">
            <div className="preview-info">
              <strong>Facing water, roads, or electrical disruptions?</strong>
              <small>File your concern now with optional photo evidence.</small>
            </div>
            <button
              className="btn-visual-action"
              onClick={() => setActivePage("submit")}
            >
              Report Issue →
            </button>
          </div>
        </div>
      </section>

      {/* Workflow Stepper */}
      <section className="workflow-section">
        <div className="section-header text-center">
          <span className="section-tag">HOW IT WORKS</span>
          <h2 className="section-title">End-to-End Complaint Lifecycle</h2>
          <p className="section-subtitle">Transparent civic governance from report submission to citizen rating.</p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card">
            <div className="step-badge">01</div>
            <div className="step-icon-wrapper">
              <span>📸</span>
            </div>
            <h3>1. Lodge & Attach Evidence</h3>
            <p>Select department category, attach photographs, and specify location with landmark.</p>
          </div>

          <div className="workflow-card">
            <div className="step-badge">02</div>
            <div className="step-icon-wrapper">
              <span>⚡</span>
            </div>
            <h3>2. SLA & Triage Assignment</h3>
            <p>Assigned a unique CMP ID and routed to municipal engineers with defined SLA deadlines.</p>
          </div>

          <div className="workflow-card">
            <div className="step-badge">03</div>
            <div className="step-icon-wrapper">
              <span>🛠️</span>
            </div>
            <h3>3. Live Status Timeline</h3>
            <p>Monitor real-time status transitions with officer inspection remarks and timestamps.</p>
          </div>

          <div className="workflow-card">
            <div className="step-badge">04</div>
            <div className="step-icon-wrapper">
              <span>⭐</span>
            </div>
            <h3>4. CSAT Rating or Reopen</h3>
            <p>Rate the service outcome (1-5 stars) or reopen the grievance if unresolved.</p>
          </div>
        </div>
      </section>

      {/* Departments Grid */}
      <section className="categories-section">
        <div className="section-header">
          <span className="section-tag">COVERED MUNICIPAL DEPARTMENTS</span>
          <h2 className="section-title">Public Service Divisions</h2>
          <p className="section-subtitle">File complaints across all civic administrative departments.</p>
        </div>

        <div className="categories-grid">
          {[
            { name: "Water Supply Board", icon: "🚰", desc: "Pipeline ruptures, water contamination, low pressure" },
            { name: "Roads & Highway Works", icon: "🛣️", desc: "Dangerous road potholes, broken asphalt, sidewalk cave-ins" },
            { name: "Electricity & Power Board", icon: "⚡", desc: "Transformer outages, hanging live wires, streetlights" },
            { name: "Sanitation & Solid Waste", icon: "🗑️", desc: "Overflowing public dumpsters, uncollected garbage, open waste" },
            { name: "Urban Drainage & Sewerage", icon: "🌊", desc: "Blocked stormwater drains, road waterlogging, sewer overflow" },
            { name: "Public Safety & Hazards", icon: "🚨", desc: "Missing manhole lids, falling trees, safety hazards" },
          ].map((cat) => (
            <div
              key={cat.name}
              className="category-card"
              onClick={() => setActivePage("submit")}
            >
              <div className="category-icon">{cat.icon}</div>
              <h4>{cat.name}</h4>
              <p>{cat.desc}</p>
              <span className="category-action">Report to this department →</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>Have an active civic problem in your area?</h2>
          <p>Lodge a trackable complaint in less than 2 minutes and monitor departmental response.</p>
        </div>
        <div className="cta-buttons">
          {user?.role === "ROLE_USER" ? (
            <button className="btn-primary-glow" onClick={() => setActivePage("citizen")}>
              👤 Go to Citizen Dashboard →
            </button>
          ) : user && user.role !== "ROLE_USER" ? (
            <button className="btn-admin-cta" onClick={() => setActivePage("admin")}>
              🛡️ Go to Admin Command Center →
            </button>
          ) : (
            <>
              <button className="btn-primary-glow" onClick={() => onOpenAuth("citizen", "login")}>
                👤 Citizen Sign In / Register
              </button>
              <button className="btn-admin-cta" onClick={() => onOpenAuth("admin", "login")}>
                🛡️ Admin Portal Login
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

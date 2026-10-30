import React, { useState, useEffect } from "react";
import { organizationAPI } from "../services/api";

export default function SuperAdminPortal({ onSelectOrg }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Organization Form State
  const [newOrg, setNewOrg] = useState({
    name: "",
    slug: "",
    type: "COLLEGE",
    description: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  async function fetchOrganizations() {
    setLoading(true);
    setError("");
    try {
      const data = await organizationAPI.getAll();
      setOrganizations(data || []);
    } catch (err) {
      setError(err.customMessage || "Unable to fetch platform organizations.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(org) {
    const newStatus = org.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const updated = await organizationAPI.updateStatus(org.id, newStatus);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
    } catch (err) {
      alert("Failed to update organization status: " + (err.customMessage || err.message));
    }
  }

  async function handleCreateOrg(e) {
    e.preventDefault();
    if (!newOrg.name.trim()) return;
    setCreateLoading(true);
    try {
      const created = await organizationAPI.create(newOrg);
      setOrganizations((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewOrg({
        name: "",
        slug: "",
        type: "COLLEGE",
        description: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
      });
    } catch (err) {
      alert("Error onboarding organization: " + (err.customMessage || err.message));
    } finally {
      setCreateLoading(false);
    }
  }

  const domainIcons = {
    MUNICIPALITY: "🏛️",
    COLLEGE: "🎓",
    CORPORATE: "🏢",
    HEALTHCARE: "🏥",
    RESIDENTIAL: "🏘️",
    OTHER: "🌐",
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <div className="admin-badge-row">
              <span className="badge-pill admin">PLATFORM SUPER ADMIN</span>
              <span className="db-badge">● Multi-Tenant Control Hub</span>
            </div>
            <h1 className="form-title">Platform Tenant Governance</h1>
            <p className="form-subtitle">
              Manage client organizations, onboard educational institutes, municipal corporations, healthcare centers, and corporate facilities.
            </p>
          </div>
          <div className="admin-header-actions">
            <button className="btn-secondary-light" onClick={fetchOrganizations}>
              🔄 Refresh
            </button>
            <button className="btn-primary-glow" onClick={() => setShowAddModal(true)}>
              + Onboard New Organization
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-box error animate-fade-in">
            <p>{error}</p>
          </div>
        )}

        {/* Organizations Grid */}
        <div className="orgs-grid-container">
          {loading ? (
            <div className="loading-state">
              <span className="spinner-icon">⏳</span>
              <p>Loading multi-tenant organizations...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="empty-state-card">
              <h3>No Organizations Registered</h3>
              <button className="btn-primary-glow" onClick={() => setShowAddModal(true)}>
                Onboard First Tenant
              </button>
            </div>
          ) : (
            <div className="org-cards-grid">
              {organizations.map((org) => (
                <div key={org.id} className={`org-card ${org.status?.toLowerCase()}`}>
                  <div className="org-card-header">
                    <span className="org-domain-icon">{domainIcons[org.type] || "🌐"}</span>
                    <span className={`status-pill ${org.status === "ACTIVE" ? "resolved" : "rejected"}`}>
                      ● {org.status}
                    </span>
                  </div>

                  <h3 className="org-card-title">{org.name}</h3>
                  <span className="org-type-tag">{org.type}</span>
                  <p className="org-card-desc">{org.description || "Public Grievance and Support Division"}</p>

                  <div className="org-card-meta">
                    <div className="meta-pair">
                      <span>Departments:</span>
                      <strong>{org.departments?.length || 0}</strong>
                    </div>
                    <div className="meta-pair">
                      <span>Categories:</span>
                      <strong>{org.categories?.length || 0}</strong>
                    </div>
                  </div>

                  <div className="org-card-footer">
                    <button
                      className="btn-card-action"
                      onClick={() => onSelectOrg(org.id)}
                    >
                      View Tenant Portal →
                    </button>
                    <button
                      className={`btn-status-toggle ${org.status === "ACTIVE" ? "suspend" : "activate"}`}
                      onClick={() => handleToggleStatus(org)}
                    >
                      {org.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Onboard Organization Modal */}
        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal-card animate-fade-in">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">TENANT ONBOARDING</span>
                  <h3>Onboard New Organization</h3>
                </div>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
              </div>

              <form onSubmit={handleCreateOrg} className="modal-form">
                <div className="form-group">
                  <label>Organization Name <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. National Institute of Technology"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Domain Template Type <span className="required">*</span></label>
                  <select
                    value={newOrg.type}
                    onChange={(e) => setNewOrg({ ...newOrg, type: e.target.value })}
                    className="admin-select full-width"
                  >
                    <option value="COLLEGE">Educational Institution / College</option>
                    <option value="MUNICIPALITY">Municipal & Civic Authority</option>
                    <option value="CORPORATE">Corporate & Private Office</option>
                    <option value="HEALTHCARE">Hospital & Healthcare Facility</option>
                    <option value="RESIDENTIAL">Apartment & Housing Community</option>
                    <option value="OTHER">Other Custom Organization</option>
                  </select>
                  <small className="field-hint">
                    Default categories, SLA rules, and initial departments will be auto-generated based on this domain.
                  </small>
                </div>

                <div className="form-group">
                  <label>Custom URL Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. nit-campus"
                    value={newOrg.slug}
                    onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="2"
                    placeholder="Describe the organization's scope and jurisdiction..."
                    value={newOrg.description}
                    onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Official Contact Email</label>
                    <input
                      type="email"
                      placeholder="admin@nit.edu"
                      value={newOrg.contactEmail}
                      onChange={(e) => setNewOrg({ ...newOrg, contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 40-12345678"
                      value={newOrg.contactPhone}
                      onChange={(e) => setNewOrg({ ...newOrg, contactPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary-light" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-glow" disabled={createLoading}>
                    {createLoading ? "Creating Organization..." : "Complete Onboarding"}
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

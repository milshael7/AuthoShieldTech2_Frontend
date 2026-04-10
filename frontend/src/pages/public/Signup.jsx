// ==========================================================
// 🛡️ AUTOSHIELD TECH — v41.0 (SECURE ONBOARDING)
// FILE: frontend/src/pages/public/Signup.jsx
// ==========================================================

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/main.css";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🛰️ PUSH 4.3 FIX: Catch Tier from Pricing Page
  const initialTier = location.state?.selectedTier || "individual";

  const [form, setForm] = useState({
    role: initialTier,
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    industry: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill company logic if they picked a company tier
  useEffect(() => {
    if (location.state?.selectedTier) {
      setForm(prev => ({ ...prev, role: location.state.selectedTier }));
    }
  }, [location.state]);

  /* ================= HELPERS ================= */

  function isBusinessEmail(email) {
    const blocked = [
      "gmail.com", "yahoo.com", "hotmail.com", 
      "outlook.com", "icloud.com", "aol.com", "protonmail.com"
    ];
    const domain = email.split("@")[1] || "";
    return domain && !blocked.includes(domain.toLowerCase());
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.firstName || !form.lastName) {
      setLoading(false);
      return setError("Full legal name is required for KYC compliance.");
    }

    if (!form.email || !isBusinessEmail(form.email)) {
      setLoading(false);
      return setError("Valid business domain required. Public providers (Gmail/Yahoo) restricted.");
    }

    if (form.role !== "individual" && !form.companyName) {
      setLoading(false);
      return setError("Entity name required for Enterprise/Team nodes.");
    }

    // 🛰️ PUSH 4.3: Simulate Secure Provisioning
    setTimeout(() => {
      // In a real flow, this sends data to /api/auth/onboard
      navigate("/login", { state: { registered: true } });
    }, 1500);
  }

  return (
    <div className="signup-page">
      <header className="public-header">
        <div className="brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <div style={{ fontWeight: 900, letterSpacing: "0.2em", color: "#00ff88" }}>
            AUTOSHIELD
          </div>
        </div>
        <nav className="public-nav">
          <button className="text-btn" onClick={() => navigate("/login")}>Sign In</button>
          <button className="text-btn" onClick={() => navigate("/pricing")}>View Plans</button>
        </nav>
      </header>

      <section className="signup-container">
        <div className="signup-card">
          <div className="status-label">KYC_PROVISIONING_v4.1</div>
          <h1>Node Initialization</h1>
          <p className="muted">Enter your professional credentials to begin onboarding.</p>

          {error && <div className="alert-box error">{error}</div>}

          <form onSubmit={submit} className="onboarding-form">
            
            <label className="input-group">
              <span className="label-text">OPERATIONAL_ROLE</span>
              <select
                className="custom-select"
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              >
                <option value="individual">Operator (Individual)</option>
                <option value="smallCompany">Team (Small Company)</option>
                <option value="company">Enterprise (Company)</option>
              </select>
            </label>

            <div className="grid-2">
              <label className="input-group">
                <span className="label-text">LEGAL_FIRST_NAME</span>
                <input
                  className="custom-input"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="e.g. John"
                  required
                />
              </label>

              <label className="input-group">
                <span className="label-text">LEGAL_LAST_NAME</span>
                <input
                  className="custom-input"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="e.g. Doe"
                  required
                />
              </label>
            </div>

            <label className="input-group">
              <span className="label-text">BUSINESS_COMM_ENDPOINT</span>
              <input
                className="custom-input"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="name@company.com"
                required
              />
              <small className="input-hint">Public domains will be flagged for secondary review.</small>
            </label>

            {form.role !== "individual" && (
              <div className="fade-in">
                <label className="input-group">
                  <span className="label-text">ENTITY_LEGAL_NAME</span>
                  <input
                    className="custom-input"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="AutoShield Corp"
                    required
                  />
                </label>

                <label className="input-group">
                  <span className="label-text">VERTICAL_INDUSTRY</span>
                  <input
                    className="custom-input"
                    value={form.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    placeholder="e.g. Finance, Tech, Infrastructure"
                  />
                </label>
              </div>
            )}

            <button type="submit" className="primary-btn wide" disabled={loading}>
              {loading ? "VERIFYING_CREDENTIALS..." : "INITIALIZE_ONBOARDING"}
            </button>
          </form>

          <p className="footer-note">
            By proceeding, you agree to the Operational Terms. Access is subject to manual security audit.
          </p>
        </div>
      </section>
    </div>
  );
}

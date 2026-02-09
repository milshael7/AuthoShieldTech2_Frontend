// frontend/src/pages/PublicLanding.jsx
// Public Landing Page — AutoShield Tech
// Phase 1: Commercial + Free Cybersecurity Tools
//
// RULES:
// - Public access (no auth)
// - NO AI wording
// - AutoDev 6.5 mentioned as system technology only
// - Heavy upgrade CTA
// - Free but limited tools

import React from "react";
import { useNavigate } from "react-router-dom";

export default function PublicLanding() {
  const navigate = useNavigate();

  return (
    <div className="public-root">
      {/* ================= HERO ================= */}
      <section className="public-hero">
        <div className="public-hero-inner">
          <h1>AutoShield Tech</h1>
          <p className="public-subtitle">
            Enterprise-grade cybersecurity protection for individuals,
            small companies, and growing organizations.
          </p>

          <div className="public-hero-actions">
            <button
              className="btn primary"
              onClick={() => navigate("/pricing")}
            >
              View Plans & Pricing
            </button>

            <button
              className="btn ghost"
              onClick={() =>
                document
                  .getElementById("free-tools")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Try Free Tools
            </button>
          </div>

          <p className="public-hero-note">
            Powered by AutoDev 6.5 security automation
          </p>
        </div>
      </section>

      {/* ================= TRUST STRIP ================= */}
      <section className="public-trust">
        <div className="trust-item">🔐 Zero Trust Architecture</div>
        <div className="trust-item">🛡️ Continuous Monitoring</div>
        <div className="trust-item">📊 Real-Time Visibility</div>
        <div className="trust-item">⚙️ SOC-Aligned Operations</div>
      </section>

      {/* ================= FREE TOOLS ================= */}
      <section id="free-tools" className="public-section">
        <h2>Free Cybersecurity Tools</h2>
        <p className="muted">
          Start protecting your environment today. No payment required.
          Limited access.
        </p>

        <div className="tool-grid">
          <div className="tool-card">
            <h3>Exposure Check</h3>
            <p>
              Identify internet-facing assets and basic misconfigurations.
            </p>
            <button
              className="btn small"
              onClick={() => navigate("/pricing")}
            >
              Upgrade for Full Scan
            </button>
          </div>

          <div className="tool-card">
            <h3>Email Risk Test</h3>
            <p>
              Check if your domain appears in recent phishing or breach data.
            </p>
            <button
              className="btn small"
              onClick={() => navigate("/pricing")}
            >
              Unlock Continuous Monitoring
            </button>
          </div>

          <div className="tool-card">
            <h3>Security Posture Preview</h3>
            <p>
              High-level snapshot of your security readiness.
            </p>
            <button
              className="btn small"
              onClick={() => navigate("/pricing")}
            >
              View Full Dashboard
            </button>
          </div>

          <div className="tool-card">
            <h3>Threat Landscape Overview</h3>
            <p>
              Understand common attack patterns targeting businesses today.
            </p>
            <button
              className="btn small"
              onClick={() => navigate("/pricing")}
            >
              Get Alerts & Reports
            </button>
          </div>
        </div>
      </section>

      {/* ================= PLATFORM PREVIEW ================= */}
      <section className="public-section dark">
        <h2>Inside the Platform</h2>
        <p className="muted">
          Designed for real cybersecurity work — not just dashboards.
        </p>

        <div className="preview-grid">
          <div className="preview-card">
            <b>Security Posture</b>
            <small>Live scoring, controls, and risk signals</small>
          </div>

          <div className="preview-card">
            <b>Assets & Inventory</b>
            <small>Users, endpoints, cloud, and servers</small>
          </div>

          <div className="preview-card">
            <b>Threats & Incidents</b>
            <small>Detection, containment, and response</small>
          </div>

          <div className="preview-card">
            <b>Reports</b>
            <small>Executive-ready summaries and evidence</small>
          </div>
        </div>
      </section>

      {/* ================= AUTODEV EXPLANATION ================= */}
      <section className="public-section">
        <h2>AutoDev 6.5</h2>
        <p className="muted">
          Advanced security automation that assists professionals — not
          replaces them.
        </p>

        <ul className="feature-list">
          <li>✔ Works on defined schedules</li>
          <li>✔ Generates detailed security reports</li>
          <li>✔ Escalates when human action is required</li>
          <li>✔ Maintains full audit history</li>
          <li>✔ Never acts without accountability</li>
        </ul>

        <button
          className="btn primary"
          onClick={() => navigate("/pricing")}
        >
          See Who Can Use AutoDev 6.5
        </button>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="public-cta">
        <h2>Ready to Secure Your Organization?</h2>
        <p>
          Start free. Upgrade when you’re ready.
        </p>

        <div className="cta-actions">
          <button
            className="btn primary"
            onClick={() => navigate("/pricing")}
          >
            View Pricing
          </button>

          <button
            className="btn ghost"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </div>
      </section>
    </div>
  );
}

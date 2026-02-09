// frontend/src/pages/public/Home.jsx
// AutoShield Tech — Commercial Front Page
// PURPOSE:
// - Trust-first landing page
// - Limited FREE cybersecurity tools
// - Visual previews of platform capabilities
// - NO pricing pressure
// - Upgrade entry points everywhere
// - Business-grade, professional tone

import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/main.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="public-home">
      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-content">
          <h1>AutoShield Tech</h1>
          <p className="hero-sub">
            Enterprise-grade cybersecurity visibility, response, and protection
            — built for professionals, companies, and growing teams.
          </p>

          <div className="hero-actions">
            <button
              className="btn primary"
              onClick={() => navigate("/pricing")}
            >
              View Plans
            </button>
            <button
              className="btn"
              onClick={() => navigate("/signup")}
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* ================= FREE TOOLS ================= */}
      <section className="free-tools">
        <h2>Free Cybersecurity Tools</h2>
        <p className="muted center">
          Try limited tools instantly. No payment. No commitment.
        </p>

        <div className="tool-grid">
          <div className="tool-card">
            <h3>Security Posture Snapshot</h3>
            <p>
              Get a high-level view of your organization’s current security
              posture and exposure.
            </p>
            <button
              className="link"
              onClick={() => navigate("/pricing")}
            >
              Upgrade for Full Coverage →
            </button>
          </div>

          <div className="tool-card">
            <h3>Asset Discovery Preview</h3>
            <p>
              Identify visible devices, users, and internet-facing assets
              with limited depth.
            </p>
            <button
              className="link"
              onClick={() => navigate("/pricing")}
            >
              Unlock Full Inventory →
            </button>
          </div>

          <div className="tool-card">
            <h3>Threat Signal Demo</h3>
            <p>
              See example threat detections and how incidents are surfaced
              and prioritized.
            </p>
            <button
              className="link"
              onClick={() => navigate("/pricing")}
            >
              Activate Live Monitoring →
            </button>
          </div>
        </div>
      </section>

      {/* ================= PLATFORM PREVIEW ================= */}
      <section className="preview">
        <h2>What You Get With AutoShield Tech</h2>
        <p className="muted center">
          Built for real cybersecurity work — not dashboards that look good
          but do nothing.
        </p>

        <div className="preview-grid">
          <div className="preview-card">
            <h4>Security Overview</h4>
            <p>
              Unified posture, coverage, and risk visibility across your
              environment.
            </p>
          </div>

          <div className="preview-card">
            <h4>Assets & Inventory</h4>
            <p>
              Track users, endpoints, cloud resources, and exposure points
              in one place.
            </p>
          </div>

          <div className="preview-card">
            <h4>Threats & Incidents</h4>
            <p>
              Analyst-ready threat detection, investigation, and response
              workflows.
            </p>
          </div>

          <div className="preview-card">
            <h4>Advisory & Automation</h4>
            <p>
              Guided security actions powered by AutoDev 6.5 — advisory,
              reporting, and execution (where permitted).
            </p>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="cta">
        <h2>Ready to Secure Your Environment?</h2>
        <p className="muted center">
          Start free. Upgrade only when you’re ready.
        </p>

        <div className="cta-actions">
          <button
            className="btn primary"
            onClick={() => navigate("/signup")}
          >
            Start Free
          </button>
          <button
            className="btn"
            onClick={() => navigate("/pricing")}
          >
            View Pricing
          </button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="public-footer">
        <p>
          © {new Date().getFullYear()} AutoShield Tech. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// frontend/src/pages/public/Pricing.jsx
// AutoShield Tech — Plans & Pricing
// PURPOSE:
// - Clear, professional pricing
// - No forced upgrades
// - Contract-aware (monthly / yearly)
// - Notification-driven upgrade model
// - Role-based limits explained clearly

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/main.css";

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");

  const yearlyNote = billing === "yearly"
    ? "Yearly contract includes a 5% contract fee."
    : "Month-to-month. Cancel anytime.";

  return (
    <div className="pricing-page">
      {/* ================= HEADER ================= */}
      <section className="pricing-header">
        <h1>Plans & Pricing</h1>
        <p className="muted center">
          Choose the plan that fits your role. Upgrade only when you’re ready.
        </p>

        <div className="billing-toggle">
          <button
            className={billing === "monthly" ? "active" : ""}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            className={billing === "yearly" ? "active" : ""}
            onClick={() => setBilling("yearly")}
          >
            Yearly Contract
          </button>
        </div>

        <small className="muted center">{yearlyNote}</small>
      </section>

      {/* ================= PLANS ================= */}
      <section className="pricing-grid">
        {/* ===== INDIVIDUAL ===== */}
        <div className="price-card">
          <h2>Individual</h2>
          <p className="price">
            {billing === "monthly" ? "$250 / month" : "$250 × 12 + 5%"}
          </p>
          <p className="muted">
            For solo cybersecurity professionals serving one role per company.
          </p>

          <ul>
            <li>Single professional account</li>
            <li>One role per client company</li>
            <li>Core SOC visibility</li>
            <li>Manual cybersecurity work</li>
            <li>AutoDev 6.5 available as upgrade</li>
          </ul>

          <button onClick={() => navigate("/signup")}>
            Get Started
          </button>
        </div>

        {/* ===== SMALL COMPANY ===== */}
        <div className="price-card">
          <h2>Small Company</h2>
          <p className="price">
            {billing === "monthly"
              ? "$350 → $700 (growth-based)"
              : "Contract-based + 5%"}
          </p>
          <p className="muted">
            For growing companies with limited team size.
          </p>

          <ul>
            <li>Up to 10–15 users</li>
            <li>Limited SOC visibility</li>
            <li>No AutoDev 6.5 access</li>
            <li>Upgrade notifications only</li>
            <li>Cannot add users beyond limit</li>
          </ul>

          <button onClick={() => navigate("/signup")}>
            Start as Small Company
          </button>
        </div>

        {/* ===== COMPANY ===== */}
        <div className="price-card highlight">
          <h2>Company</h2>
          <p className="price">
            {billing === "monthly"
              ? "$1,000 → $1,500 (after 6 months)"
              : "Contract-based + 5%"}
          </p>
          <p className="muted">
            Full enterprise-grade cybersecurity operations.
          </p>

          <ul>
            <li>Unlimited users</li>
            <li>Full SOC visibility</li>
            <li>Manager & admin roles</li>
            <li>Incident, threat, asset governance</li>
            <li>Human-operated cybersecurity only</li>
          </ul>

          <button onClick={() => navigate("/signup")}>
            Contact & Start
          </button>
        </div>
      </section>

      {/* ================= AUTODEV ================= */}
      <section className="pricing-autodev">
        <h2>AutoDev 6.5</h2>
        <p className="muted center">
          Advanced cybersecurity execution and reporting — available to
          individuals only.
        </p>

        <div className="price-card wide">
          <p className="price">
            First Month: $100<br />
            Ongoing: $450 / month
          </p>

          <ul>
            <li>Autonomous cybersecurity execution</li>
            <li>Scheduled work hours (not 24/7 by default)</li>
            <li>Human intervention alerts when required</li>
            <li>Immutable reporting & audit trail</li>
            <li>Owner-branded reporting</li>
          </ul>

          <p className="muted">
            AutoDev 6.5 never replaces people. It supports professionals
            and protects companies continuously.
          </p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="public-footer">
        <p>
          Pricing subject to change by platform administrators.
          No automatic upgrades. Notifications only.
        </p>
      </footer>
    </div>
  );
}

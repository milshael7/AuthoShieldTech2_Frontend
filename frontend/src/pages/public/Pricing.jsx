// ==========================================================
// 💳 AUTOSHIELD TECH — v41.0 (TIER-AWARE PRICING)
// FILE: frontend/src/pages/public/Pricing.jsx
// ==========================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRICING } from "../../config/pricing.config";
import "../../styles/main.css";

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");

  /**
   * 🛰️ PUSH 4.2 FIX: HAND-OFF LOGIC
   * We pass the selected tier into the location state so the 
   * Signup page can auto-configure the role and company fields.
   */
  const handleSelectTier = (tierKey) => {
    navigate("/signup", { state: { selectedTier: tierKey, billingCycle: billing } });
  };

  const yearlyNote = billing === "yearly"
      ? "Yearly contracts include a 5% security maintenance fee."
      : "Standard monthly billing. Cancel anytime.";

  return (
    <div className="pricing-page">
      {/* --- HEADER --- */}
      <section className="pricing-header">
        <h1 className="glitch-text" data-text="OPERATIONAL_TIERS">Plans & Pricing</h1>
        <p className="muted center">
          Select your operational level. Tier transitions require admin verification.
        </p>

        <div className="billing-toggle">
          <button
            className={billing === "monthly" ? "active" : ""}
            onClick={() => setBilling("monthly")}
          >
            MONTHLY
          </button>
          <button
            className={billing === "yearly" ? "active" : ""}
            onClick={() => setBilling("yearly")}
          >
            YEARLY_CONTRACT
          </button>
        </div>
        <small className="status-label">{yearlyNote}</small>
      </section>

      {/* --- PLANS --- */}
      <section className="pricing-grid">
        
        {/* ===== INDIVIDUAL ===== */}
        <div className="price-card">
          <div className="tier-label">OPERATOR</div>
          <h2>Individual</h2>
          <div className="price-display">
            {billing === "monthly"
              ? <span className="amt">${PRICING.individual.monthly}<b>/mo</b></span>
              : <span className="amt">${(PRICING.individual.monthly * 0.95).toFixed(0)}<b>/mo*</b></span>
            }
          </div>

          <ul className="feature-list">
            <li>Single professional node</li>
            <li>One role per client cluster</li>
            <li>Core SOC Visibility</li>
            <li>Manual Security Operations</li>
            <li className="highlight-li">AutoDev 6.5 Ready</li>
          </ul>

          <button className="pricing-btn" onClick={() => handleSelectTier("individual")}>
            Initialize Operator
          </button>
        </div>

        {/* ===== SMALL COMPANY ===== */}
        <div className="price-card">
          <div className="tier-label">TEAM</div>
          <h2>Small Company</h2>
          <div className="price-display">
            {billing === "monthly"
              ? <span className="amt">${PRICING.smallCompany.start}+<b>/mo</b></span>
              : <span className="amt">Contract<b>Based</b></span>
            }
          </div>

          <ul className="feature-list">
            <li>Up to {PRICING.smallCompany.userLimit} user nodes</li>
            <li>Regional SOC visibility</li>
            <li>Incident Tracking</li>
            <li>Manager-level Dashboards</li>
            <li className="muted-li">No AutoDev 6.5 Access</li>
          </ul>

          <button className="pricing-btn" onClick={() => handleSelectTier("smallCompany")}>
            Deploy Team Node
          </button>
        </div>

        {/* ===== COMPANY ===== */}
        <div className="price-card highlight">
          <div className="tier-label top">ENTERPRISE</div>
          <h2>Company</h2>
          <div className="price-display">
            <span className="amt">Custom<b>Quote</b></span>
          </div>

          <ul className="feature-list">
            <li>Unlimited user nodes</li>
            <li>Full Global SOC Access</li>
            <li>Root & Admin hierarchy</li>
            <li>Immutable Asset Governance</li>
            <li>Priority Incident Response</li>
          </ul>

          <button className="pricing-btn primary" onClick={() => handleSelectTier("company")}>
            Provision Enterprise
          </button>
        </div>
      </section>

      {/* --- AUTODEV ADD-ON --- */}
      <section className="pricing-autodev">
        <div className="autodev-banner">
          <div className="banner-left">
            <h3>AUTODEV 6.5 <span className="status-tag">ACTIVE_EXECUTION</span></h3>
            <p>Upgrade any Individual tier to Autonomous Operational Status.</p>
          </div>
          <div className="banner-right">
            <div className="price-tag">
              <span className="label">SETUP:</span> <b>${PRICING.individual.autodev.firstMonth}</b>
              <span className="label">ONGOING:</span> <b>${PRICING.individual.autodev.ongoing}/mo</b>
            </div>
          </div>
        </div>
      </section>

      <footer className="public-footer">
        <p>All tiers are subject to KYC verification. No automatic upgrades. All billing is notification-driven.</p>
      </footer>
    </div>
  );
}

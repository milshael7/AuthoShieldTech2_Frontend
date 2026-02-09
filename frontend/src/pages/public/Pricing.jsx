import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRICING } from "../../config/pricing.config";
import "../../styles/main.css";

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");

  const yearlyNote =
    billing === "yearly"
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
            {billing === "monthly"
              ? `$${PRICING.individual.monthly} / month`
              : `$${PRICING.individual.monthly} × ${PRICING.individual.yearlyMultiplier} + ${PRICING.individual.yearlyFeePercent}%`}
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
              ? `$${PRICING.smallCompany.start} → $${PRICING.smallCompany.max}`
              : `Contract-based + ${PRICING.smallCompany.yearlyFeePercent}%`}
          </p>

          <ul>
            <li>Up to {PRICING.smallCompany.userLimit} users</li>
            <li>Limited SOC visibility</li>
            <li>No AutoDev 6.5 access</li>
            <li>Upgrade notifications only</li>
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
              ? `$${PRICING.company.start} → $${PRICING.company.afterSixMonths}`
              : `Contract-based + ${PRICING.company.yearlyFeePercent}%`}
          </p>

          <ul>
            <li>Unlimited users</li>
            <li>Full SOC visibility</li>
            <li>Manager & admin roles</li>
            <li>Incident, threat, asset governance</li>
          </ul>

          <button onClick={() => navigate("/signup")}>
            Contact & Start
          </button>
        </div>
      </section>

      {/* ================= AUTODEV ================= */}
      <section className="pricing-autodev">
        <h2>AutoDev 6.5</h2>

        <div className="price-card wide">
          <p className="price">
            First Month: ${PRICING.individual.autodev.firstMonth}
            <br />
            Ongoing: ${PRICING.individual.autodev.ongoing} / month
          </p>

          <ul>
            <li>Autonomous cybersecurity execution</li>
            <li>Human intervention alerts</li>
            <li>Immutable reporting & audit trail</li>
            <li>Owner-branded reports</li>
          </ul>
        </div>
      </section>

      <footer className="public-footer">
        <p>
          Pricing is controlled by administrators.
          No automatic upgrades. Notifications only.
        </p>
      </footer>
    </div>
  );
}

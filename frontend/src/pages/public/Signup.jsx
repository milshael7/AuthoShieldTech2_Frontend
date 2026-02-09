// frontend/src/pages/public/Signup.jsx
// AutoShield Tech — Secure Signup & Intake (UPGRADED)
//
// PURPOSE:
// - Business-grade onboarding
// - Business email enforcement
// - Role-aware intake
// - Public header consistency
// - NO payment logic yet
// - NO AI wording

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/main.css";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: "individual",
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    industry: "",
  });

  const [error, setError] = useState("");

  /* ================= HELPERS ================= */

  function isBusinessEmail(email) {
    const blocked = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
      "aol.com",
      "protonmail.com",
    ];
    const domain = email.split("@")[1] || "";
    return domain && !blocked.includes(domain.toLowerCase());
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.firstName || !form.lastName) {
      return setError("Please enter your full legal name.");
    }

    if (!form.email || !isBusinessEmail(form.email)) {
      return setError(
        "Please use a valid business email address. Personal emails are not accepted."
      );
    }

    if (form.role !== "individual" && !form.companyName) {
      return setError("Company name is required for this account type.");
    }

    // Backend onboarding hook will be added later
    navigate("/login");
  }

  /* ================= UI ================= */

  return (
    <div className="signup-page">
      {/* ================= PUBLIC HEADER ================= */}
      <header className="public-header">
        <div className="brand">
          <img
            src="/public/logo.png"
            alt="AutoShield Tech"
            className="brand-logo"
          />
          <span className="brand-name">AutoShield Tech</span>
        </div>

        <nav className="public-nav">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/pricing")}>Pricing</button>
        </nav>
      </header>

      {/* ================= SIGNUP CARD ================= */}
      <section className="signup-card">
        <h1>Create Your Account</h1>
        <p className="muted">
          Professional onboarding for secure cybersecurity operations.
        </p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit}>
          {/* ===== ROLE ===== */}
          <label>
            Account Type
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
            >
              <option value="individual">Individual</option>
              <option value="small_company">Small Company</option>
              <option value="company">Company</option>
            </select>
          </label>

          {/* ===== NAME ===== */}
          <div className="grid-2">
            <label>
              First Name
              <input
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                required
              />
            </label>

            <label>
              Last Name
              <input
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                required
              />
            </label>
          </div>

          {/* ===== EMAIL ===== */}
          <label>
            Business Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
            <small className="muted">
              Personal email addresses are not accepted.
            </small>
          </label>

          {/* ===== COMPANY INFO ===== */}
          {form.role !== "individual" && (
            <>
              <label>
                Company Name
                <input
                  value={form.companyName}
                  onChange={(e) =>
                    update("companyName", e.target.value)
                  }
                  required
                />
              </label>

              <label>
                Industry
                <input
                  value={form.industry}
                  onChange={(e) => update("industry", e.target.value)}
                  placeholder="e.g. Finance, Healthcare, SaaS"
                />
              </label>
            </>
          )}

          {/* ===== SUBMIT ===== */}
          <button type="submit" className="primary">
            Continue Securely
          </button>
        </form>

        <p className="muted small">
          Accurate information is required for cybersecurity operations.
          No automatic upgrades. Notifications only.
        </p>
      </section>
    </div>
  );
}

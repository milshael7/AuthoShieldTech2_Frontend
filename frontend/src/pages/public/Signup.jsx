// frontend/src/pages/public/Signup.jsx
// AutoShield Tech — Secure Signup & Professional Intake (UPGRADED)
//
// PURPOSE:
// - Business-grade onboarding
// - Business email enforcement
// - Role-aware setup
// - Cybersecurity branch selection
// - Insurance opt-in placeholder
// - NO payment logic
// - NO automation wording
// - Prepares company connection for protection

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
    branch: "",
    insuranceOptIn: false,
    acknowledge: false,
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
        "Please use a valid business email address. Personal email addresses are not accepted."
      );
    }

    if (form.role !== "individual" && !form.companyName) {
      return setError("Company name is required for this account type.");
    }

    if (!form.branch) {
      return setError("Please select your cybersecurity specialization.");
    }

    if (!form.acknowledge) {
      return setError(
        "You must acknowledge professional responsibility to continue."
      );
    }

    // Placeholder: backend onboarding hook will go here
    navigate("/login");
  }

  /* ================= UI ================= */

  return (
    <div className="signup-page">
      <section className="signup-card">
        <h1>Create Your Account</h1>
        <p className="muted">
          Professional onboarding for cybersecurity operations.
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

          {/* ===== CYBERSECURITY BRANCH ===== */}
          <label>
            Cybersecurity Specialization
            <select
              value={form.branch}
              onChange={(e) => update("branch", e.target.value)}
              required
            >
              <option value="">Select specialization</option>
              <option value="soc">SOC Operations</option>
              <option value="incident_response">Incident Response</option>
              <option value="cloud_security">Cloud Security</option>
              <option value="grc">Governance, Risk & Compliance</option>
              <option value="appsec">Application Security</option>
              <option value="network">Network Security</option>
            </select>
          </label>

          {/* ===== INSURANCE PLACEHOLDER ===== */}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.insuranceOptIn}
              onChange={(e) =>
                update("insuranceOptIn", e.target.checked)
              }
            />
            Interested in cybersecurity insurance options
            <small className="muted">
              (Details provided later — no commitment)
            </small>
          </label>

          {/* ===== ACKNOWLEDGEMENT ===== */}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.acknowledge}
              onChange={(e) =>
                update("acknowledge", e.target.checked)
              }
            />
            I acknowledge that cybersecurity operations require
            active participation and professional responsibility.
          </label>

          {/* ===== SUBMIT ===== */}
          <button type="submit" className="primary">
            Continue Securely
          </button>
        </form>

        <p className="muted small">
          No automatic upgrades. No forced payments.
          Professional use only.
        </p>
      </section>
    </div>
  );
}

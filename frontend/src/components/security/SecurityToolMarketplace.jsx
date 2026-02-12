// frontend/src/components/SecurityToolMarketplace.jsx
// Executive Security Control Marketplace
// Tiered • Installable • Enterprise-grade • Scalable

import React, { useState } from "react";

const TOOL_TIERS = [
  {
    title: "Core Defense",
    description: "Foundational protection layers",
    tools: [
      { id: "edr", name: "Endpoint Detection (EDR)" },
      { id: "email", name: "Email Protection" },
      { id: "itdr", name: "Identity Threat Detection (ITDR)" },
      { id: "phishing", name: "Phishing Simulation" },
      { id: "browsing", name: "Secure Browsing" },
      { id: "darkweb", name: "Dark Web Monitoring" },
    ],
  },
  {
    title: "Advanced Intelligence",
    description: "Behavioral & AI-driven security layers",
    tools: [
      { id: "threatintel", name: "Threat Intelligence Feed" },
      { id: "behavioral", name: "Behavioral AI Detection" },
      { id: "cloud", name: "Cloud Data Monitoring" },
      { id: "api", name: "API Abuse Detection" },
      { id: "insider", name: "Insider Risk Monitoring" },
    ],
  },
  {
    title: "Governance & Compliance",
    description: "Audit, risk, and compliance automation",
    tools: [
      { id: "audit", name: "Audit Log Engine" },
      { id: "risk", name: "Risk Scoring Engine" },
      { id: "compliance", name: "Compliance Scanner" },
      { id: "incident", name: "Incident Response Automation" },
    ],
  },
];

export default function SecurityToolMarketplace() {
  const [installed, setInstalled] = useState({});

  function toggleInstall(id) {
    setInstalled((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <div className="postureCard">
      <div className="postureTop">
        <div>
          <h2>Security Control Marketplace</h2>
          <small>Layered security architecture • Modular • Scalable</small>
        </div>
        <span className="badge ok">Enterprise</span>
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 32 }}>
        {TOOL_TIERS.map((tier) => (
          <div key={tier.title}>
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>{tier.title}</h3>
              <small className="muted">{tier.description}</small>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {tier.tools.map((tool) => {
                const active = installed[tool.id];

                return (
                  <div
                    key={tool.id}
                    className="card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 140,
                    }}
                  >
                    <div>
                      <b>{tool.name}</b>
                      <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                        {active
                          ? "Protection active and monitoring."
                          : "Not installed. Click to enable."}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 14,
                      }}
                    >
                      <span className={`badge ${active ? "ok" : ""}`}>
                        {active ? "Installed" : "Available"}
                      </span>

                      <button
                        className={`btn ${active ? "warn" : "ok"}`}
                        onClick={() => toggleInstall(tool.id)}
                      >
                        {active ? "Disable" : "Install"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

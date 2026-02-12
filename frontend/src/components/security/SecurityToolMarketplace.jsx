import React, { useState } from "react";

/*
  SecurityToolMarketplace
  Enterprise Tool Deployment Panel
  Institutional-grade UI
  Production-safe (UI only)
*/

const TOOL_CATALOG = [
  {
    id: "edr",
    name: "Endpoint Detection & Response",
    category: "Endpoint",
    description:
      "Real-time behavioral monitoring, ransomware blocking, and device-level threat response.",
    riskLevel: "critical",
  },
  {
    id: "itdr",
    name: "Identity Threat Detection",
    category: "Identity",
    description:
      "Detect credential abuse, privilege escalation, and anomalous login behavior.",
    riskLevel: "high",
  },
  {
    id: "email",
    name: "Email Protection",
    category: "Email Security",
    description:
      "AI-driven phishing detection, spoof protection, and malicious attachment blocking.",
    riskLevel: "high",
  },
  {
    id: "data",
    name: "Cloud Data Shield",
    category: "Cloud",
    description:
      "Continuous scanning for exposed storage, misconfigurations, and data leaks.",
    riskLevel: "medium",
  },
  {
    id: "sat",
    name: "Security Awareness Training",
    category: "Training",
    description:
      "Phishing simulations and employee training performance monitoring.",
    riskLevel: "medium",
  },
  {
    id: "darkweb",
    name: "Dark Web Monitoring",
    category: "Threat Intel",
    description:
      "Monitor credential leaks and compromised data across underground sources.",
    riskLevel: "medium",
  },
];

export default function SecurityToolMarketplace() {
  const [installed, setInstalled] = useState({});
  const [search, setSearch] = useState("");

  function toggleInstall(id) {
    setInstalled((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  const filteredTools = TOOL_CATALOG.filter((tool) =>
    tool.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="postureCard">
      <div style={{ marginBottom: 24 }}>
        <h3>Security Control Marketplace</h3>
        <small className="muted">
          Deploy, activate, and manage enterprise-grade security modules.
        </small>

        {/* Search Bar */}
        <div style={{ marginTop: 16 }}>
          <input
            type="text"
            placeholder="Search security controls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
      </div>

      <div className="toolGrid">
        {filteredTools.map((tool) => {
          const isInstalled = installed[tool.id];

          return (
            <div key={tool.id} className="toolCard">
              <div className="toolHeader">
                <div>
                  <b>{tool.name}</b>
                  <div className="toolCategory">
                    {tool.category}
                  </div>
                </div>

                <span
                  className={`badge ${
                    isInstalled ? "ok" : ""
                  }`}
                >
                  {isInstalled ? "Installed" : "Available"}
                </span>
              </div>

              <div className="toolDesc">
                {tool.description}
              </div>

              <div className="toolMeta">
                <span className={`risk ${tool.riskLevel}`}>
                  {tool.riskLevel.toUpperCase()} PRIORITY
                </span>
              </div>

              <div className="toolActions">
                <button
                  className={`btn ${
                    isInstalled ? "warn" : "ok"
                  }`}
                  onClick={() => toggleInstall(tool.id)}
                >
                  {isInstalled ? "Uninstall" : "Install"}
                </button>
              </div>
            </div>
          );
        })}

        {filteredTools.length === 0 && (
          <div className="muted">
            No matching security controls found.
          </div>
        )}
      </div>
    </div>
  );
}

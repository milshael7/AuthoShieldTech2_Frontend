import React, { useState } from "react";

/*
  SecurityToolMarketplace
  Enterprise Tool Deployment Panel
  Professional SOC-grade layout
*/

const TOOL_CATALOG = [
  {
    id: "edr",
    name: "Endpoint Detection & Response",
    category: "Endpoint",
    description:
      "Real-time behavioral monitoring, ransomware blocking, and device-level threat response.",
  },
  {
    id: "itdr",
    name: "Identity Threat Detection",
    category: "Identity",
    description:
      "Detect credential abuse, privilege escalation, and anomalous login behavior.",
  },
  {
    id: "email",
    name: "Email Protection",
    category: "Email Security",
    description:
      "AI-driven phishing detection, spoof protection, and malicious attachment blocking.",
  },
  {
    id: "data",
    name: "Cloud Data Shield",
    category: "Cloud",
    description:
      "Continuous scanning for exposed storage, misconfigurations, and data leaks.",
  },
  {
    id: "sat",
    name: "Security Awareness Training",
    category: "Training",
    description:
      "Phishing simulations and employee training performance monitoring.",
  },
  {
    id: "darkweb",
    name: "Dark Web Monitoring",
    category: "Threat Intel",
    description:
      "Monitor credential leaks and compromised data across underground sources.",
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
      <div style={{ marginBottom: 20 }}>
        <h3>Security Control Marketplace</h3>
        <small className="muted">
          Deploy and manage enterprise-grade security modules.
        </small>
      </div>

      <div className="toolGrid">
        {TOOL_CATALOG.map((tool) => {
          const isInstalled = installed[tool.id];

          return (
            <div key={tool.id} className="toolCard">
              <div className="toolHeader">
                <div>
                  <b>{tool.name}</b>
                  <div className="toolCategory">{tool.category}</div>
                </div>

                <span className={`badge ${isInstalled ? "ok" : ""}`}>
                  {isInstalled ? "Installed" : "Available"}
                </span>
              </div>

              <div className="toolDesc">
                {tool.description}
              </div>

              <div className="toolActions">
                <button
                  className={`btn ${isInstalled ? "warn" : "ok"}`}
                  onClick={() => toggleInstall(tool.id)}
                >
                  {isInstalled ? "Uninstall" : "Install"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

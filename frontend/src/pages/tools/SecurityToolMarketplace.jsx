import React, { useState } from "react";

/*
  Security Tool Marketplace
  Clean • Professional • No Context • No External Changes
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
      "AI-driven phishing detection and malicious attachment blocking.",
  },
  {
    id: "cloud",
    name: "Cloud Data Shield",
    category: "Cloud",
    description:
      "Continuous scanning for exposed storage and misconfigurations.",
  },
  {
    id: "darkweb",
    name: "Dark Web Monitoring",
    category: "Threat Intelligence",
    description:
      "Monitor credential leaks and compromised data across underground sources.",
  },
];

export default function SecurityToolMarketplace() {
  const [tools, setTools] = useState({});

  function installTool(id) {
    setTools((prev) => ({
      ...prev,
      [id]: { status: "installing", progress: 0 },
    }));

    let progress = 0;

    const interval = setInterval(() => {
      progress += 25;

      setTools((prev) => ({
        ...prev,
        [id]: {
          status: progress >= 100 ? "installed" : "installing",
          progress,
        },
      }));

      if (progress >= 100) clearInterval(interval);
    }, 500);
  }

  function uninstallTool(id) {
    setTools((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  return (
    <div className="postureCard">
      <div style={{ marginBottom: 24 }}>
        <h3>Security Control Marketplace</h3>
        <small className="muted">
          Deploy enterprise-grade security modules.
        </small>
      </div>

      <div className="toolGrid">
        {TOOL_CATALOG.map((tool) => {
          const toolState = tools[tool.id];
          const isInstalled = toolState?.status === "installed";
          const isInstalling = toolState?.status === "installing";

          return (
            <div key={tool.id} className="toolCard">
              <div className="toolHeader">
                <div>
                  <div className="toolTitle">{tool.name}</div>
                  <div className="toolCategory">{tool.category}</div>
                </div>

                <span
                  className={`badge ${
                    isInstalled ? "ok" : isInstalling ? "warn" : ""
                  }`}
                >
                  {isInstalling
                    ? `Deploying ${toolState.progress}%`
                    : isInstalled
                    ? "Installed"
                    : "Available"}
                </span>
              </div>

              <div className="toolDesc">{tool.description}</div>

              <div className="toolActions">
                <button
                  className={`btn ${
                    isInstalled ? "warn" : isInstalling ? "primary" : "ok"
                  }`}
                  onClick={() =>
                    isInstalled
                      ? uninstallTool(tool.id)
                      : installTool(tool.id)
                  }
                  disabled={isInstalling}
                >
                  {isInstalling
                    ? "Deploying..."
                    : isInstalled
                    ? "Uninstall"
                    : "Install"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

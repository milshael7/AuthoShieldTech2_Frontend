import React, { useState } from "react";

/*
  Installed Security Controls
  Operational SOC View
*/

const ACTIVE_TOOLS = [
  {
    id: "edr",
    name: "Endpoint Detection & Response",
    status: "Healthy",
    coverage: 92,
  },
  {
    id: "email",
    name: "Email Protection",
    status: "Monitoring",
    coverage: 87,
  },
  {
    id: "cloud",
    name: "Cloud Data Shield",
    status: "Warning",
    coverage: 71,
  },
];

export default function InstalledTools() {
  const [tools] = useState(ACTIVE_TOOLS);

  function statusColor(status) {
    if (status === "Healthy") return "#2bd576";
    if (status === "Monitoring") return "#ffd166";
    return "#ff5a5f";
  }

  return (
    <div className="postureCard">
      <div style={{ marginBottom: 24 }}>
        <h3>Installed Security Controls</h3>
        <small className="muted">
          Active protection modules across the platform.
        </small>
      </div>

      <div className="toolGrid">
        {tools.map((tool) => (
          <div key={tool.id} className="toolCard">
            <div className="toolHeader">
              <div>
                <div className="toolTitle">{tool.name}</div>
                <div
                  className="toolCategory"
                  style={{ color: statusColor(tool.status) }}
                >
                  {tool.status}
                </div>
              </div>

              <span className="badge ok">
                {tool.coverage}% Coverage
              </span>
            </div>

            <div className="toolDesc">
              System is actively monitoring threats and enforcing
              security policy across assigned assets.
            </div>

            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  height: 8,
                  background: "rgba(255,255,255,.08)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${tool.coverage}%`,
                    height: "100%",
                    background: statusColor(tool.status),
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

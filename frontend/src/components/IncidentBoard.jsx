import React, { useState, useEffect } from "react";
import IncidentModal from "./IncidentModal";

const SAMPLE_INCIDENTS = [
  {
    id: 1,
    title: "Suspicious Login Attempt",
    severity: "medium",
    status: "open",
    assignedTo: null,
    createdAt: Date.now() - 1000 * 60 * 12,
    description:
      "Multiple failed login attempts detected from unusual IP range.",
  },
  {
    id: 2,
    title: "Malware Detected on Endpoint",
    severity: "high",
    status: "investigating",
    assignedTo: "Analyst 1",
    createdAt: Date.now() - 1000 * 60 * 45,
    description:
      "Endpoint flagged by EDR engine with potential trojan behavior.",
  },
];

export default function IncidentBoard() {
  const [incidents, setIncidents] = useState(SAMPLE_INCIDENTS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [, forceTick] = useState(0);

  // Force timer update every 30 seconds
  useEffect(() => {
    const t = setInterval(() => {
      forceTick((v) => v + 1);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  function assignIncident(id) {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, assignedTo: "You", status: "investigating" } : i
      )
    );
  }

  function escalateIncident(id) {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, severity: "high" } : i
      )
    );
  }

  const filtered = incidents.filter((i) =>
    filter === "all" ? true : i.severity === filter
  );

  return (
    <div className="card">
      <Header filter={filter} setFilter={setFilter} />

      <div style={list}>
        {filtered.map((incident) => (
          <div
            key={incident.id}
            style={card(incident.severity)}
            onClick={() => setSelected(incident)}
          >
            <div style={rowTop}>
              <b>{incident.title}</b>
              <span style={severityBadge(incident.severity)}>
                {incident.severity}
              </span>
            </div>

            <div style={meta}>
              Status: {incident.status}
              <br />
              Assigned: {incident.assignedTo || "Unassigned"}
              <br />
              SLA: {formatSLA(incident.createdAt)}
            </div>

            <div style={actionRow}>
              {!incident.assignedTo && (
                <button
                  style={actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    assignIncident(incident.id);
                  }}
                >
                  Assign to Me
                </button>
              )}

              {incident.severity !== "high" && (
                <button
                  style={actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    escalateIncident(incident.id);
                  }}
                >
                  Escalate
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="muted">No incidents for this filter.</div>
        )}
      </div>

      <IncidentModal
        incident={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

/* ================= HEADER ================= */

function Header({ filter, setFilter }) {
  return (
    <div style={header}>
      <div>
        <b>Incident Command Center</b>
        <div className="muted" style={{ fontSize: 12 }}>
          Analyst workflow management
        </div>
      </div>

      <div style={filters}>
        {["all", "high", "medium", "low"].map((f) => (
          <button
            key={f}
            style={filterBtn(filter === f)}
            onClick={() => setFilter(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= UTIL ================= */

function formatSLA(createdAt) {
  const mins = Math.floor((Date.now() - createdAt) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} hr`;
}

/* ================= STYLES ================= */

const header = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 18,
};

const filters = {
  display: "flex",
  gap: 6,
};

const filterBtn = (active) => ({
  padding: "4px 10px",
  fontSize: 12,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.2)",
  background: active ? "rgba(122,167,255,0.25)" : "transparent",
  color: "#fff",
  cursor: "pointer",
});

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const card = (severity) => ({
  padding: 16,
  borderRadius: 16,
  background: "rgba(0,0,0,0.35)",
  border:
    severity === "high"
      ? "1px solid #ff5a5f"
      : severity === "medium"
      ? "1px solid #ffd166"
      : "1px solid #2bd576",
  cursor: "pointer",
  transition: "all 0.2s ease",
});

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
};

const meta = {
  marginTop: 8,
  fontSize: 12,
  opacity: 0.75,
};

const actionRow = {
  marginTop: 10,
  display: "flex",
  gap: 8,
};

const actionBtn = {
  fontSize: 11,
  padding: "4px 8px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(122,167,255,0.18)",
  color: "#fff",
  cursor: "pointer",
};

function severityBadge(sev) {
  return {
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 999,
    background:
      sev === "high"
        ? "#ff5a5f"
        : sev === "medium"
        ? "#ffd166"
        : "#2bd576",
    color: "#000",
    fontWeight: 700,
  };
}

// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — Global Priority SOC Engine (Layer 5)

import React, { useEffect, useState } from "react";
import "../../styles/platform.css";

/* ========================================================= */

function riskLevel(score) {
  if (score >= 75) return { label: "CRITICAL", cls: "warn" };
  if (score >= 50) return { label: "ELEVATED", cls: "warn" };
  if (score >= 25) return { label: "MODERATE", cls: "warn" };
  return { label: "STABLE", cls: "ok" };
}

function containmentFromRisk(risk) {
  if (risk >= 75) return "LOCKDOWN";
  if (risk >= 50) return "MONITORING";
  if (risk >= 25) return "CONTAINED";
  return "STABLE";
}

/* ========================================================= */

export default function AdminOverview() {

  const [mode, setMode] = useState("operator");
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const companies = [
    { id: "c1", name: "Alpha Systems" },
    { id: "c2", name: "Beta Holdings" },
    { id: "c3", name: "Gamma Logistics" },
    { id: "c4", name: "Delta Finance" }
  ];

  /* ================= COMPANY STATE ================= */

  const [companyState, setCompanyState] = useState(() => {
    const initial = {};
    companies.forEach(c => {
      initial[c.id] = {
        risk: Math.floor(Math.random() * 40),
        log: []
      };
    });
    return initial;
  });

  const [globalQueue, setGlobalQueue] = useState([]);

  /* ========================================================= */
  /* ================= PRIORITY ENGINE ======================= */
  /* ========================================================= */

  const calculatePriority = (risk, containment) => {
    let score = risk;
    if (containment === "LOCKDOWN") score += 30;
    if (containment === "MONITORING") score += 15;
    return score;
  };

  /* ========================================================= */
  /* ================= THREAT INJECTION ====================== */
  /* ========================================================= */

  useEffect(() => {

    const interval = setInterval(() => {

      setCompanyState(prev => {
        const updated = { ...prev };
        const newQueueEntries = [];

        Object.keys(updated).forEach(id => {

          if (Math.random() < 0.4) {

            const spike = Math.floor(Math.random() * 15);
            const newRisk = Math.min(100, updated[id].risk + spike);
            const containment = containmentFromRisk(newRisk);

            updated[id] = {
              ...updated[id],
              risk: newRisk,
              containment
            };

            const priority = calculatePriority(newRisk, containment);

            newQueueEntries.push({
              id: `${id}-${Date.now()}`,
              companyId: id,
              risk: newRisk,
              containment,
              priority,
              time: new Date()
            });
          }
        });

        if (newQueueEntries.length > 0) {
          setGlobalQueue(prevQueue =>
            [...newQueueEntries, ...prevQueue]
              .sort((a, b) => b.priority - a.priority)
              .slice(0, 20)
          );
        }

        return updated;

      });

    }, 12000);

    return () => clearInterval(interval);

  }, []);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const current = selectedCompany ? companyState[selectedCompany.id] : null;

  /* ========================================================= */

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 30 }}>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="sectionTitle">Global SOC Command</div>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="operator">Operator View</option>
        </select>
      </div>

      {/* ================= GLOBAL QUEUE ================= */}

      {mode === "operator" && (
        <>
          <div className="postureCard executivePanel">
            <h3>🔴 ACTIVE GLOBAL THREAT QUEUE</h3>

            {globalQueue.length === 0 && (
              <div className="muted">No active global threats.</div>
            )}

            {globalQueue.map(alert => (
              <div
                key={alert.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <b>{companies.find(c => c.id === alert.companyId)?.name}</b>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {alert.containment} — Risk {alert.risk}
                  </div>
                </div>

                <div>
                  <span className="badge warn">
                    P{alert.priority}
                  </span>

                  <button
                    className="btn"
                    style={{ marginLeft: 10 }}
                    onClick={() => setSelectedCompanyId(alert.companyId)}
                  >
                    Enter
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ================= FLEET GRID ================= */}

          {!selectedCompany && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
              {companies.map(c => {
                const state = companyState[c.id];
                const badge = riskLevel(state.risk);
                const glow = state.risk >= 75 ? "0 0 15px rgba(255,0,0,.6)" : "none";

                return (
                  <div
                    key={c.id}
                    className="postureCard"
                    style={{ cursor: "pointer", boxShadow: glow }}
                    onClick={() => setSelectedCompanyId(c.id)}
                  >
                    <h4>{c.name}</h4>
                    <div>Risk: <span className={`badge ${badge.cls}`}>{state.risk}</span></div>
                    <div>Status: {containmentFromRisk(state.risk)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= COMPANY CONSOLE ================= */}

          {selectedCompany && current && (
            <>
              <button className="btn" onClick={() => setSelectedCompanyId(null)}>
                ← Back to Fleet
              </button>

              <div className="postureCard executivePanel">
                <h3>{selectedCompany.name}</h3>
                <div>Risk: {current.risk}</div>
                <div>Status: {containmentFromRisk(current.risk)}</div>
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
}

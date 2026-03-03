// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — Layer 9 (Auto Escalation + Lock Engine)

import React, { useEffect, useState } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";

import ExecutiveRiskBanner from "../../components/ExecutiveRiskBanner";
import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityRadar from "../../components/SecurityRadar";
import IncidentBoard from "../../components/IncidentBoard";

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

function priorityFromRisk(risk) {
  if (risk >= 75) return "P1";
  if (risk >= 60) return "P2";
  if (risk >= 40) return "P3";
  return "P4";
}

function bumpPriority(priority) {
  if (priority === "P4") return "P3";
  if (priority === "P3") return "P2";
  if (priority === "P2") return "P1";
  return "P1";
}

function slaDuration(priority) {
  switch (priority) {
    case "P1": return 5 * 60 * 1000;
    case "P2": return 15 * 60 * 1000;
    case "P3": return 30 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}

function formatCountdown(ms) {
  if (ms <= 0) return "BREACHED";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/* ========================================================= */

export default function AdminOverview() {

  const { integrityAlert } = useSecurity();

  const [mode, setMode] = useState("platform");
  const [tick, setTick] = useState(Date.now());

  const companies = [
    { id: "c1", name: "Alpha Systems" },
    { id: "c2", name: "Beta Holdings" },
    { id: "c3", name: "Gamma Logistics" },
    { id: "c4", name: "Delta Finance" }
  ];

  const [companyState, setCompanyState] = useState(() => {
    const initial = {};
    companies.forEach(c => {
      initial[c.id] = {
        risk: Math.floor(Math.random() * 40),
        containment: "STABLE",
        log: []
      };
    });
    return initial;
  });

  const [globalQueue, setGlobalQueue] = useState([]);
  const [incidentRegistry, setIncidentRegistry] = useState([]);

  /* ================= GLOBAL TIMER ================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* ================= THREAT ENGINE ================= */

  useEffect(() => {

    const interval = setInterval(() => {

      setCompanyState(prev => {
        const updated = { ...prev };
        const newAlerts = [];

        Object.keys(updated).forEach(id => {

          if (Math.random() < 0.4) {

            const spike = Math.floor(Math.random() * 15);
            const newRisk = Math.min(100, updated[id].risk + spike);
            const containment = containmentFromRisk(newRisk);
            const priority = priorityFromRisk(newRisk);

            updated[id] = {
              ...updated[id],
              risk: newRisk,
              containment,
              log: [
                { time: new Date(), msg: `Threat spike detected (+${spike})` },
                ...updated[id].log
              ]
            };

            const createdAt = Date.now();
            const deadline = createdAt + slaDuration(priority);

            newAlerts.push({
              id: `${id}-${Date.now()}`,
              companyId: id,
              risk: newRisk,
              containment,
              priority,
              createdAt,
              deadline,
              status: "NEW",
              escalatedLocked: false
            });
          }
        });

        if (newAlerts.length > 0) {
          setGlobalQueue(prevQueue =>
            [...newAlerts, ...prevQueue].slice(0, 100)
          );
        }

        return updated;

      });

    }, 12000);

    return () => clearInterval(interval);

  }, []);

  /* ================= AUTO ESCALATION ENGINE ================= */

  useEffect(() => {

    setGlobalQueue(prev =>
      prev.map(alert => {

        if (alert.status === "RESOLVED") return alert;

        const remaining = alert.deadline - tick;

        if (remaining <= 0 && !alert.escalatedLocked) {

          const newPriority = bumpPriority(alert.priority);
          const newDeadline = Date.now() + slaDuration(newPriority);

          const escalatedAlert = {
            ...alert,
            priority: newPriority,
            deadline: newDeadline,
            escalatedLocked: true,
            autoEscalated: true
          };

          setIncidentRegistry(prevInc =>
            [{ ...escalatedAlert, escalatedAt: new Date() }, ...prevInc]
          );

          return escalatedAlert;
        }

        return alert;
      })
    );

  }, [tick]);

  /* ================= ACTIONS ================= */

  const resolveAlert = (alert) => {

    setGlobalQueue(prev =>
      prev.map(a =>
        a.id === alert.id
          ? { ...a, status: "RESOLVED" }
          : a
      )
    );

    setCompanyState(prev => ({
      ...prev,
      [alert.companyId]: {
        ...prev[alert.companyId],
        risk: Math.max(0, prev[alert.companyId].risk - 10),
        containment: containmentFromRisk(
          Math.max(0, prev[alert.companyId].risk - 10)
        ),
        log: [
          { time: new Date(), msg: "Threat resolved by operator" },
          ...prev[alert.companyId].log
        ]
      }
    }));
  };

  /* ========================================================= */

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="sectionTitle">
          {mode === "platform" ? "Platform Command Center" : "Operator Console"}
        </div>

        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="platform">Platform View</option>
          <option value="operator">Operator View</option>
        </select>
      </div>

      {mode === "operator" && (
        <div className="postureCard executivePanel">
          <h3>🔴 ACTIVE GLOBAL THREAT QUEUE</h3>

          <div style={{ height: 420, overflowY: "auto", marginTop: 15 }}>
            {globalQueue.map(alert => {

              const companyName = companies.find(c => c.id === alert.companyId)?.name;
              const remaining = alert.deadline - tick;
              const breached = remaining <= 0;

              return (
                <div
                  key={alert.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    background: breached ? "rgba(255,0,0,.08)" : "transparent"
                  }}
                >
                  <div>
                    <b>{companyName}</b>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      {alert.containment} — Risk {alert.risk}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      Priority: <b>{alert.priority}</b> | SLA:{" "}
                      <b style={{ color: breached ? "#ff4d4f" : "#eaf1ff" }}>
                        {formatCountdown(remaining)}
                      </b>
                    </div>
                    {alert.autoEscalated && (
                      <div style={{ fontSize: 11, color: "#ff4d4f" }}>
                        AUTO-ESCALATED (LOCKED)
                      </div>
                    )}
                  </div>

                  <button
                    className="btn primary"
                    onClick={() => resolveAlert(alert)}
                  >
                    Resolve
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "platform" && (
        <>
          {integrityAlert && (
            <div className="dashboard-warning">
              Integrity Alert Detected — Elevated State
            </div>
          )}

          <ExecutiveRiskBanner />
          <SecurityPostureDashboard />
          <IncidentBoard />
          <SecurityPipeline />
          <SecurityRadar />
          <SecurityFeedPanel />
        </>
      )}

    </div>
  );
}

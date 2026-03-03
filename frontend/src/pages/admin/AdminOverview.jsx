// FULL FINAL OPERATOR COMPLETE VERSION

import React, { useEffect, useState, useMemo } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";
import ExecutiveRiskBanner from "../../components/ExecutiveRiskBanner";
import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityRadar from "../../components/SecurityRadar";
import IncidentBoard from "../../components/IncidentBoard";
import "../../styles/platform.css";

/* ================= UTILITIES ================= */

const roles = ["Tier1", "Tier2", "Supervisor"];

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

/* ================= COMPONENT ================= */

export default function AdminOverview() {

  const { integrityAlert } = useSecurity();

  const [mode, setMode] = useState("platform");
  const [operatorMode, setOperatorMode] = useState("automatic");
  const [role, setRole] = useState("Supervisor");
  const [activeWorkspace, setActiveWorkspace] = useState("ALL");
  const [tick, setTick] = useState(Date.now());
  const [enginePaused, setEnginePaused] = useState(false);
  const [engineSpeed, setEngineSpeed] = useState("normal");
  const [selectedAlert, setSelectedAlert] = useState(null);

  const companies = [
    { id: "c1", name: "Alpha Systems" },
    { id: "c2", name: "Beta Holdings" },
    { id: "c3", name: "Gamma Logistics" },
    { id: "c4", name: "Delta Finance" }
  ];

  const speedMap = { slow: 20000, normal: 12000, aggressive: 6000 };

  const [companyState, setCompanyState] = useState(() => {
    const initial = {};
    companies.forEach(c => {
      initial[c.id] = { risk: Math.floor(Math.random() * 40), containment: "STABLE" };
    });
    return initial;
  });

  const [globalQueue, setGlobalQueue] = useState([]);
  const [archive, setArchive] = useState([]);

  /* ================= GLOBAL CLOCK ================= */

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ================= THREAT ENGINE ================= */

  useEffect(() => {

    if (enginePaused || operatorMode === "manual") return;

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

            updated[id] = { risk: newRisk, containment };

            const createdAt = Date.now();
            const deadline = createdAt + slaDuration(priority);

            newAlerts.push({
              id: `${id}-${Date.now()}`,
              companyId: id,
              priority,
              containment,
              createdAt,
              deadline,
              status: "NEW",
              activity: [{ time: new Date(), action: "CREATED" }],
              locked: false,
              resolution: null
            });
          }
        });

        if (newAlerts.length > 0) {
          setGlobalQueue(prev => [...newAlerts, ...prev]);
        }

        return updated;
      });

    }, speedMap[engineSpeed]);

    return () => clearInterval(interval);

  }, [enginePaused, engineSpeed, operatorMode]);

  /* ================= AUTO ESCALATION ================= */

  useEffect(() => {

    if (operatorMode === "manual") return;

    setGlobalQueue(prev =>
      prev.map(alert => {

        if (alert.status === "RESOLVED" || alert.locked) return alert;

        if (alert.deadline - tick <= 0 && !alert.autoEscalated) {
          return {
            ...alert,
            priority: bumpPriority(alert.priority),
            autoEscalated: true,
            activity: [{ time: new Date(), action: "AUTO_ESCALATED" }, ...alert.activity]
          };
        }

        return alert;
      })
    );

  }, [tick, operatorMode]);

  /* ================= ACTIONS ================= */

  const logActivity = (alert, action) => ({
    ...alert,
    activity: [{ time: new Date(), action }, ...alert.activity]
  });

  const resolveAlert = (alert, resolutionData) => {
    const updated = {
      ...alert,
      status: "RESOLVED",
      locked: true,
      resolution: resolutionData,
      activity: [{ time: new Date(), action: "RESOLVED" }, ...alert.activity]
    };

    setArchive(prev => [updated, ...prev]);
    setGlobalQueue(prev => prev.filter(a => a.id !== alert.id));
    setSelectedAlert(null);
  };

  /* ================= ANALYTICS ================= */

  const analytics = useMemo(() => {
    const total = globalQueue.length + archive.length;
    const resolved = archive.length;
    const p1 = globalQueue.filter(a => a.priority === "P1").length;
    return { total, resolved, p1 };
  }, [globalQueue, archive]);

  /* ================= RENDER ================= */

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", padding: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="sectionTitle">
          {mode === "platform" ? "Platform Command Center" : "Operator Console"}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="platform">Platform View</option>
            <option value="operator">Operator View</option>
          </select>

          {mode === "operator" && (
            <>
              <select value={operatorMode} onChange={(e) => setOperatorMode(e.target.value)}>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>

              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map(r => <option key={r}>{r}</option>)}
              </select>

              <select value={activeWorkspace} onChange={(e) => setActiveWorkspace(e.target.value)}>
                <option value="ALL">All Clients</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* ================= OPERATOR MODE ================= */}

      {mode === "operator" && (
        <>
          {/* Analytics */}
          <div className="postureCard" style={{ marginTop: 20 }}>
            Total: {analytics.total} | Resolved: {analytics.resolved} | Active P1: {analytics.p1}
          </div>

          {/* Queue */}
          <div className="postureCard executivePanel" style={{ marginTop: 20 }}>
            <h3>Active Alerts</h3>

            {globalQueue
              .filter(a => activeWorkspace === "ALL" || a.companyId === activeWorkspace)
              .map(alert => (
                <div
                  key={alert.id}
                  style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,.06)", cursor: "pointer" }}
                  onClick={() => setSelectedAlert(alert)}
                >
                  {companies.find(c => c.id === alert.companyId)?.name} —
                  {alert.priority} —
                  {formatCountdown(alert.deadline - tick)}
                </div>
              ))}
          </div>

          {/* Drill-Down Drawer */}
          {selectedAlert && (
            <div className="postureCard" style={{ marginTop: 20 }}>
              <h3>Investigation Panel</h3>

              <div>
                Priority: {selectedAlert.priority}
              </div>

              <div style={{ marginTop: 10 }}>
                <h4>Activity Timeline</h4>
                {selectedAlert.activity.map((a, i) => (
                  <div key={i}>{a.time.toLocaleString()} — {a.action}</div>
                ))}
              </div>

              {!selectedAlert.locked && (
                <div style={{ marginTop: 15 }}>
                  <textarea placeholder="Resolution Summary" id="summary" />
                  <textarea placeholder="Lessons Learned" id="lessons" />
                  <textarea placeholder="Root Cause" id="root" />
                  <button
                    className="btn primary"
                    onClick={() =>
                      resolveAlert(selectedAlert, {
                        summary: document.getElementById("summary").value,
                        lessons: document.getElementById("lessons").value,
                        rootCause: document.getElementById("root").value
                      })
                    }
                  >
                    Finalize & Archive
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Archive */}
          <div className="postureCard" style={{ marginTop: 20 }}>
            <h3>Archived Incidents</h3>
            {archive.map(a => (
              <div key={a.id}>
                {companies.find(c => c.id === a.companyId)?.name} — {a.priority}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================= PLATFORM MODE ================= */}

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

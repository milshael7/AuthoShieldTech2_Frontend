// ==========================================================
// FILE: frontend/src/pages/Dashboard.jsx
// VERSION: v3.0 (Institutional AI + Execution Command Center)
// ==========================================================

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

/* ================= SECURITY ================= */

import SecurityOverview from "../components/security/SecurityOverview";
import RiskMonitor from "../components/security/RiskMonitor";
import SessionMonitor from "../components/security/SessionMonitor";
import DeviceIntegrityPanel from "../components/security/DeviceIntegrityPanel";
import AuditStream from "../components/security/AuditStream";

/* ================= TRADING ================= */

import DashboardGrid from "../components/dashboard/DashboardGrid";
import AiPanel from "../components/dashboard/AiPanel";
import BrainPanel from "../components/dashboard/BrainPanel";
import ExecutionPanel from "../components/dashboard/ExecutionPanel";

/* ================= API ================= */

import { api } from "../services/api";

/* ========================================================= */

export default function Dashboard() {
  const { user } = useUser() || {};
  const role = user?.role;

  /* ================= STATE ================= */

  const [ai, setAi] = useState(null);
  const [brain, setBrain] = useState(null);
  const [execution, setExecution] = useState(null);
  const [performance, setPerformance] = useState(null);

  const [loading, setLoading] = useState(true);

  /* ================= LOAD AI DATA ================= */

  async function loadAI() {
    try {
      const [
        aiRes,
        brainRes,
        execRes,
        perfRes,
      ] = await Promise.all([
        api.aiSnapshot(),
        api.aiBrainStats?.(),       // safe optional
        api.executionMetrics?.(),   // safe optional
        api.performanceSummary?.(), // safe optional
      ]);

      /* ================= SAFE ASSIGN ================= */

      if (aiRes) setAi(aiRes?.data || aiRes);

      if (brainRes) {
        setBrain(brainRes?.data || brainRes);
      } else {
        // fallback if backend not ready
        setBrain({
          totalTrades: 0,
          winRate: 0,
          netPnL: 0,
          memoryDepth: 0,
        });
      }

      if (execRes) {
        const exec = execRes?.data || execRes;

        setExecution({
          ...exec,
          condition: classifyExecution(exec),
        });
      } else {
        // fallback simulated execution
        const fallback = {
          score: 0.8,
          avgLatency: 120,
          avgSlippage: 0.001,
        };

        setExecution({
          ...fallback,
          condition: classifyExecution(fallback),
        });
      }

      if (perfRes) {
        setPerformance(perfRes?.data || perfRes);
      }

    } catch (err) {
      console.error("AI load error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ================= EXECUTION CLASSIFIER ================= */

  function classifyExecution(exec) {
    if (!exec) return { condition: "unknown" };

    const score = exec.score || 0;

    if (score >= 0.75) return { condition: "good" };
    if (score >= 0.5) return { condition: "warning" };
    return { condition: "poor" };
  }

  /* ================= AUTO REFRESH ================= */

  useEffect(() => {
    loadAI();

    const interval = setInterval(loadAI, 3000);
    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     ADMIN / FINANCE (FULL SYSTEM)
  ========================================================= */

  if (role === "Admin" || role === "Finance") {
    return (
      <div style={styles.wrapper}>
        <h2 style={styles.title}>🧠 Command Center</h2>

        <DashboardGrid>

          {/* LEFT SIDE */}
          <div style={styles.column}>
            <AiPanel data={ai} />

            <div style={styles.card}>
              <h3>📈 Performance</h3>

              <p>Trades: {performance?.totalTrades ?? "-"}</p>

              <p>
                Win Rate:{" "}
                {performance?.winRate != null
                  ? (performance.winRate * 100).toFixed(2) + "%"
                  : "-"}
              </p>

              <p>
                Net PnL: $
                {performance?.netPnL != null
                  ? performance.netPnL.toFixed(2)
                  : "-"}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div style={styles.column}>
            <BrainPanel data={brain} />
            <ExecutionPanel data={execution} />
          </div>

        </DashboardGrid>

        {/* ================= SECURITY ================= */}
        <SecurityOverview />
        <RiskMonitor />
        <SessionMonitor />
        <DeviceIntegrityPanel />
        <AuditStream />
      </div>
    );
  }

  /* =========================================================
     MANAGER
  ========================================================= */

  if (role === "Manager") {
    return (
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Manager Dashboard</h2>

        <DashboardGrid>
          <div style={styles.column}>
            <AiPanel data={ai} />
          </div>

          <div style={styles.column}>
            <BrainPanel data={brain} />
          </div>
        </DashboardGrid>

        <SecurityOverview />
        <RiskMonitor />
        <DeviceIntegrityPanel />
      </div>
    );
  }

  /* =========================================================
     COMPANY
  ========================================================= */

  if (role === "Company" || role === "Small_Company") {
    return (
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Company Dashboard</h2>

        <DashboardGrid>
          <div style={styles.column}>
            <AiPanel data={ai} />
          </div>

          <div style={styles.column}>
            <div style={styles.card}>
              <h3>Performance</h3>
              <p>Trades: {performance?.totalTrades ?? "-"}</p>
              <p>
                Win Rate:{" "}
                {performance?.winRate != null
                  ? (performance.winRate * 100).toFixed(2) + "%"
                  : "-"}
              </p>
            </div>
          </div>
        </DashboardGrid>

        <SecurityOverview />
        <RiskMonitor />
      </div>
    );
  }

  /* =========================================================
     FALLBACK
  ========================================================= */

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Platform Dashboard</h2>

      <div style={styles.fallbackCard}>
        <p>Dashboard is operational.</p>
        <p style={{ fontSize: 13, opacity: 0.6 }}>
          Limited access.
        </p>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  wrapper: {
    padding: 28,
    background: "#0f172a",
    minHeight: "100vh",
    color: "#f1f5f9",
  },

  title: {
    marginBottom: 24,
  },

  column: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  card: {
    background: "#111",
    padding: 16,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.05)",
  },

  fallbackCard: {
    padding: 20,
    borderRadius: 12,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
  },
};

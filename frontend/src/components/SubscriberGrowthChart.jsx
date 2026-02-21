// frontend/src/components/SubscriberGrowthChart.jsx
// SubscriberGrowthChart — Executive Subscriber Intelligence (v2)
// + Predictive Churn Panel (risk index • distribution • high-risk list • pressure signals)

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../lib/api";

/**
 * EXPECTED BACKEND (preferred):
 *   GET /api/admin/predictive-churn
 *
 * Fallbacks supported automatically if your backend returns older shapes:
 *   - /api/admin/churn-risk
 *   - response keys: predictiveChurn | churnRisk | churnRiskUsers
 */

export default function SubscriberGrowthChart() {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const totalSeriesRef = useRef(null);
  const activeSeriesRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [growthMeta, setGrowthMeta] = useState(null);
  const [churn, setChurn] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [growthRes, churnRes] = await Promise.all([
          api.adminSubscriberGrowth?.(),
          fetchPredictiveChurnSafe(),
        ]);

        if (!alive) return;

        const growth = growthRes?.growth || [];

        const formattedTotal = growth.map((g) => ({
          time: g.date,
          value: Number(g.totalUsers || 0),
        }));

        const formattedActive = growth.map((g) => ({
          time: g.date,
          value: Number(g.activeSubscribers || 0),
        }));

        setGrowthMeta({
          lastDate: growth?.[growth.length - 1]?.date || null,
          totalUsers: growth?.[growth.length - 1]?.totalUsers ?? null,
          activeSubscribers: growth?.[growth.length - 1]?.activeSubscribers ?? null,
        });

        initChart(formattedTotal, formattedActive);

        const normalized = normalizeChurnPayload(churnRes);
        setChurn(normalized);
      } catch (e) {
        console.error("SubscriberGrowthChart load error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
      if (chartRef.current) chartRef.current.remove();
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPredictiveChurnSafe() {
    // Preferred: api.adminPredictiveChurn()
    if (typeof api.adminPredictiveChurn === "function") {
      return api.adminPredictiveChurn();
    }

    // If you named it differently later, this still won’t crash
    if (typeof api.adminChurnRisk === "function") {
      return api.adminChurnRisk();
    }

    // No method yet — return null, UI will show "Not configured"
    return null;
  }

  function initChart(totalData, activeData) {
    if (!containerRef.current) return;

    // Clean up if re-init (hot reload safety)
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    chartRef.current = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#D9D9D9",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.05)" },
        horzLines: { color: "rgba(255,255,255,.05)" },
      },
      width: containerRef.current.clientWidth,
      height: 280,
      rightPriceScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
    });

    totalSeriesRef.current = chartRef.current.addLineSeries({
      color: "#5EC6FF",
      lineWidth: 2,
    });

    activeSeriesRef.current = chartRef.current.addLineSeries({
      color: "#2bd576",
      lineWidth: 2,
    });

    totalSeriesRef.current.setData(totalData);
    activeSeriesRef.current.setData(activeData);

    window.addEventListener("resize", handleResize);
  }

  function handleResize() {
    if (!chartRef.current || !containerRef.current) return;
    chartRef.current.applyOptions({
      width: containerRef.current.clientWidth,
    });
  }

  if (loading) {
    return (
      <div className="postureCard">
        <b>Subscriber Growth</b>
        <div style={{ marginTop: 16 }}>Loading subscriber analytics…</div>
      </div>
    );
  }

  const risk = churn?.riskIndex ?? null;
  const distribution = churn?.distribution || null;
  const highRiskUsers = churn?.highRiskUsers || [];
  const highRiskCount =
    typeof churn?.highRiskCount === "number"
      ? churn.highRiskCount
      : Array.isArray(highRiskUsers)
      ? highRiskUsers.length
      : 0;

  const lockedRatio =
    typeof churn?.lockedRatio === "number" ? churn.lockedRatio : null;

  const refundPressure =
    typeof churn?.refundPressure === "number" ? churn.refundPressure : null;

  const riskTone =
    risk == null
      ? "muted"
      : risk >= 70
      ? "metric-negative"
      : risk >= 40
      ? "metric-warning"
      : "metric-positive";

  return (
    <div className="postureCard">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <b>Subscriber Growth</b>
          <div style={{ marginTop: 4 }}>
            <small className="muted">Total Users vs Active Subscribers</small>
          </div>
        </div>

        {growthMeta?.lastDate ? (
          <small className="muted" style={{ textAlign: "right" }}>
            Latest: {growthMeta.lastDate}
            <br />
            Total: <b>{safeNum(growthMeta.totalUsers)}</b> • Active:{" "}
            <b>{safeNum(growthMeta.activeSubscribers)}</b>
          </small>
        ) : (
          <small className="muted" style={{ textAlign: "right" }}>
            Latest snapshot unavailable
          </small>
        )}
      </div>

      <div style={{ height: 16 }} />

      {/* ================= PREDICTIVE CHURN PANEL ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <div className="kpiCard">
          <small>Churn Risk Index</small>
          <b className={riskTone}>{risk == null ? "Not configured" : risk}</b>
        </div>

        <div className="kpiCard">
          <small>High-Risk Users</small>
          <b>{highRiskCount}</b>
        </div>

        <div className="kpiCard">
          <small>Locked Ratio</small>
          <b>
            {lockedRatio == null ? "—" : `${Math.round(lockedRatio * 100)}%`}
          </b>
        </div>

        <div className="kpiCard">
          <small>Refund Pressure</small>
          <b>{refundPressure == null ? "—" : formatPct(refundPressure)}</b>
        </div>
      </div>

      {distribution ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <span className="badge ok">LOW: {safeNum(distribution.LOW)}</span>
          <span className="badge warn">MEDIUM: {safeNum(distribution.MEDIUM)}</span>
          <span className="badge" style={{ borderColor: "rgba(255,90,95,.4)" }}>
            HIGH: {safeNum(distribution.HIGH)}
          </span>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <small className="muted">
            Predictive churn distribution will appear once the backend route is enabled.
          </small>
        </div>
      )}

      <div ref={containerRef} style={{ width: "100%" }} />

      {/* Optional: show top high-risk users (masked / minimal) */}
      {Array.isArray(highRiskUsers) && highRiskUsers.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <small className="muted" style={{ display: "block", marginBottom: 8 }}>
            High-Risk Watchlist (top {Math.min(highRiskUsers.length, 5)})
          </small>

          <div style={{ display: "grid", gap: 8 }}>
            {highRiskUsers.slice(0, 5).map((u) => (
              <div
                key={u.userId || u.id || `${u.email}-${u.riskScore}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.10)",
                  background: "rgba(0,0,0,.25)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.email || u.userId || u.id || "User"}
                  </b>
                  <small className="muted">
                    Level: {u.level || "HIGH"} • Score: {safeNum(u.riskScore)}
                  </small>
                </div>

                <span
                  className={
                    (u.level || "").toUpperCase() === "HIGH"
                      ? "badge warn"
                      : "badge"
                  }
                >
                  {(u.level || "HIGH").toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= HELPERS ================= */

function normalizeChurnPayload(res) {
  // Supports multiple shapes gracefully.
  // Preferred: { ok:true, predictiveChurn:{...} }
  // Older:     { ok:true, churnRisk:{...} }
  // Oldest:    { ok:true, churnRisk:[...] }
  if (!res) return null;

  const root =
    res.predictiveChurn ||
    res.churnRisk ||
    res.churn ||
    res.data ||
    null;

  // If root is an array of users (oldest), compute minimal summary
  if (Array.isArray(root)) {
    const highRiskUsers = root.filter((r) => String(r.level).toUpperCase() === "HIGH");
    const distribution = {
      LOW: root.filter((r) => String(r.level).toUpperCase() === "LOW").length,
      MEDIUM: root.filter((r) => String(r.level).toUpperCase() === "MEDIUM").length,
      HIGH: highRiskUsers.length,
    };

    const riskIndex =
      root.length > 0
        ? Math.round(root.reduce((s, r) => s + Number(r.riskScore || 0), 0) / root.length)
        : 0;

    return {
      riskIndex,
      distribution,
      highRiskUsers,
      highRiskCount: highRiskUsers.length,
      lockedRatio: null,
      refundPressure: null,
    };
  }

  // If root is an object summary (most likely)
  const riskIndex =
    typeof root?.riskIndex === "number"
      ? root.riskIndex
      : typeof root?.riskScore === "number"
      ? root.riskScore
      : null;

  const distribution = root?.distribution || null;

  const highRiskUsers =
    root?.highRiskUsers ||
    root?.highRisk ||
    root?.usersHighRisk ||
    [];

  return {
    riskIndex: riskIndex == null ? null : Number(riskIndex),
    distribution,
    highRiskUsers: Array.isArray(highRiskUsers) ? highRiskUsers : [],
    highRiskCount:
      typeof root?.highRiskCount === "number" ? root.highRiskCount : undefined,
    lockedRatio:
      typeof root?.lockedRatio === "number" ? root.lockedRatio : null,
    refundPressure:
      typeof root?.refundPressure === "number" ? root.refundPressure : null,
  };
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  // if you pass 0.18 -> 18%, if you pass 18 -> 18%
  const pct = n <= 1 ? n * 100 : n;
  return `${Math.round(pct)}%`;
}

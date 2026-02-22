// frontend/src/components/SubscriberGrowthChart.jsx
// SubscriberGrowthChart — Executive Subscriber Intelligence (Aligned to Phase 32+ Backend)

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../lib/api";

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
          api.adminSubscriberGrowth(),
          api.adminPredictiveChurn(),
        ]);

        if (!alive) return;

        /* ================= GROWTH ================= */

        const growth = Array.isArray(growthRes?.growth)
          ? growthRes.growth
          : [];

        const formattedTotal = growth.map((g) => ({
          time: g.date,
          value: Number(g.totalUsers || 0),
        }));

        const formattedActive = growth.map((g) => ({
          time: g.date,
          value: Number(g.activeSubscribers || 0),
        }));

        setGrowthMeta({
          lastDate: growth.at(-1)?.date || null,
          totalUsers: growth.at(-1)?.totalUsers ?? null,
          activeSubscribers: growth.at(-1)?.activeSubscribers ?? null,
        });

        initChart(formattedTotal, formattedActive);

        /* ================= PREDICTIVE CHURN ================= */

        const root = churnRes?.predictiveChurn || null;

        if (root) {
          setChurn({
            riskIndex: Number(root.score ?? 0),
            lockedRatio: root?.drivers?.users?.lockedRatio ?? null,
            refundPressure:
              root?.drivers?.refunds?.perActive ?? null,
            distribution: null, // not provided in Phase 32+
            highRiskUsers: [],  // not provided in Phase 32+
          });
        } else {
          setChurn(null);
        }
      } catch (e) {
        console.error("SubscriberGrowthChart error:", e);
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
  }, []);

  function initChart(totalData, activeData) {
    if (!containerRef.current) return;

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
        borderColor: "rgba(255,255,255,.1)" },
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

    chartRef.current.timeScale().fitContent();

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
        <div style={{ marginTop: 16 }}>
          Loading subscriber analytics…
        </div>
      </div>
    );
  }

  const risk = churn?.riskIndex ?? null;
  const lockedRatio = churn?.lockedRatio ?? null;
  const refundPressure = churn?.refundPressure ?? null;

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
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <b>Subscriber Growth</b>
          <div style={{ marginTop: 4 }}>
            <small className="muted">
              Total Users vs Active Subscribers
            </small>
          </div>
        </div>

        {growthMeta?.lastDate && (
          <small className="muted" style={{ textAlign: "right" }}>
            Latest: {growthMeta.lastDate}
            <br />
            Total: <b>{growthMeta.totalUsers}</b> • Active:{" "}
            <b>{growthMeta.activeSubscribers}</b>
          </small>
        )}
      </div>

      {/* ================= CHURN PANEL ================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          margin: "18px 0",
        }}
      >
        <div className="kpiCard">
          <small>Churn Risk Index</small>
          <b className={riskTone}>
            {risk == null ? "Not configured" : risk}
          </b>
        </div>

        <div className="kpiCard">
          <small>Locked Ratio</small>
          <b>
            {lockedRatio == null
              ? "—"
              : `${Math.round(lockedRatio * 100)}%`}
          </b>
        </div>

        <div className="kpiCard">
          <small>Refund Pressure</small>
          <b>
            {refundPressure == null
              ? "—"
              : formatPct(refundPressure)}
          </b>
        </div>
      </div>

      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
}

/* ================= HELPERS ================= */

function formatPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  const pct = n <= 1 ? n * 100 : n;
  return `${Math.round(pct)}%`;
}

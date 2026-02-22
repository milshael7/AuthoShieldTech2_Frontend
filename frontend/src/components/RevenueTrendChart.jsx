// frontend/src/components/RevenueTrendChart.jsx
// Executive Revenue Intelligence Layer
// Revenue + Refund + Dispute Overlay (Daily)

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../lib/api";

export default function RevenueTrendChart({ days = 90 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  const revenueSeriesRef = useRef(null);
  const refundSeriesRef = useRef(null);
  const disputeSeriesRef = useRef(null);

  const tooltipRef = useRef(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await api.adminRevenueRefundOverlay(days);
        const series = Array.isArray(res?.series) ? res.series : [];

        const revenueData = [];
        const refundData = [];
        const disputeData = [];

        for (const d of series) {
          const date = d.date;

          revenueData.push({
            time: date,
            value: Number(d.revenue || 0),
          });

          refundData.push({
            time: date,
            value: Number(d.refunds || 0),
          });

          disputeData.push({
            time: date,
            value: Number(d.disputes || 0),
          });
        }

        if (!alive) return;
        initChart(revenueData, refundData, disputeData);
      } catch (e) {
        console.error("RevenueTrendChart error:", e);
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
  }, [days]);

  function initChart(revenueData, refundData, disputeData) {
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
      height: 300,
      rightPriceScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,.2)" },
        horzLine: { color: "rgba(255,255,255,.15)" },
      },
    });

    revenueSeriesRef.current = chartRef.current.addLineSeries({
      color: "#5EC6FF",
      lineWidth: 2,
    });

    refundSeriesRef.current = chartRef.current.addLineSeries({
      color: "#ff5a5f",
      lineWidth: 2,
    });

    disputeSeriesRef.current = chartRef.current.addLineSeries({
      color: "#ffd166",
      lineWidth: 2,
    });

    revenueSeriesRef.current.setData(revenueData);
    refundSeriesRef.current.setData(refundData);
    disputeSeriesRef.current.setData(disputeData);

    chartRef.current.timeScale().fitContent();

    setupTooltip();

    window.addEventListener("resize", handleResize);
  }

  function setupTooltip() {
    if (!containerRef.current || !chartRef.current) return;

    const tooltip = document.createElement("div");
    tooltip.style.position = "absolute";
    tooltip.style.display = "none";
    tooltip.style.padding = "10px 14px";
    tooltip.style.background = "rgba(0,0,0,.85)";
    tooltip.style.border = "1px solid rgba(255,255,255,.1)";
    tooltip.style.borderRadius = "12px";
    tooltip.style.fontSize = "13px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.zIndex = "1000";

    containerRef.current.appendChild(tooltip);
    tooltipRef.current = tooltip;

    chartRef.current.subscribeCrosshairMove((param) => {
      if (!param?.time || !param.seriesPrices) {
        tooltip.style.display = "none";
        return;
      }

      const revenue = param.seriesPrices.get(revenueSeriesRef.current);
      const refunds = param.seriesPrices.get(refundSeriesRef.current);
      const disputes = param.seriesPrices.get(disputeSeriesRef.current);

      tooltip.innerHTML = `
        <b>${param.time}</b><br/>
        Revenue: $${Number(revenue || 0).toFixed(2)}<br/>
        Refunds: $${Number(refunds || 0).toFixed(2)}<br/>
        Disputes: $${Number(disputes || 0).toFixed(2)}
      `;

      const { x, y } = param.point || { x: 0, y: 0 };

      tooltip.style.left = x + 20 + "px";
      tooltip.style.top = y + 20 + "px";
      tooltip.style.display = "block";
    });
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
        <b>Revenue Intelligence</b>
        <div style={{ marginTop: 16 }}>
          Loading executive financial analytics…
        </div>
      </div>
    );
  }

  return (
    <div className="postureCard">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b>Revenue Intelligence</b>
        <small className="muted">
          Revenue vs Refund vs Dispute (last {Number(days) || 90} days)
        </small>
      </div>

      <div style={{ height: 18 }} />
      <div
        ref={containerRef}
        style={{ width: "100%", position: "relative" }}
      />
    </div>
  );
}

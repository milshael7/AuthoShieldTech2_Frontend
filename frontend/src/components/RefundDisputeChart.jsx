import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../lib/api";

/**
 * RefundDisputeChart
 * Executive Financial Risk Timeline
 * Cumulative Refunds vs Disputes
 */

export default function RefundDisputeChart() {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const refundSeriesRef = useRef(null);
  const disputeSeriesRef = useRef(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.adminRefundDisputeTimeline();
        const timeline = res?.timeline || [];

        const refundData = timeline.map((d) => ({
          time: d.date,
          value: Number(d.cumulativeRefund || 0),
        }));

        const disputeData = timeline.map((d) => ({
          time: d.date,
          value: Number(d.cumulativeDispute || 0),
        }));

        initChart(refundData, disputeData);
      } catch (e) {
        console.error("RefundDisputeChart error:", e);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function initChart(refundData, disputeData) {
    if (!containerRef.current) return;

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

    refundSeriesRef.current = chartRef.current.addLineSeries({
      color: "#ff5a5f",
      lineWidth: 2,
    });

    disputeSeriesRef.current = chartRef.current.addLineSeries({
      color: "#ffd166",
      lineWidth: 2,
    });

    refundSeriesRef.current.setData(refundData);
    disputeSeriesRef.current.setData(disputeData);

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
        <b>Refund & Dispute Timeline</b>
        <div style={{ marginTop: 16 }}>
          Loading financial risk analytics…
        </div>
      </div>
    );
  }

  return (
    <div className="postureCard">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b>Refund & Dispute Timeline</b>
        <small className="muted">
          Cumulative Financial Risk Exposure
        </small>
      </div>

      <div style={{ height: 18 }} />

      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
}

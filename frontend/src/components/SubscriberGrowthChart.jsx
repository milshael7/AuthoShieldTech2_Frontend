import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../lib/api";

/**
 * SubscriberGrowthChart
 * Executive Subscriber Intelligence
 */

export default function SubscriberGrowthChart() {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const totalSeriesRef = useRef(null);
  const activeSeriesRef = useRef(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.adminSubscriberGrowth();
        const growth = res?.growth || [];

        const formattedTotal = growth.map(g => ({
          time: g.date,
          value: g.totalUsers
        }));

        const formattedActive = growth.map(g => ({
          time: g.date,
          value: g.activeSubscribers
        }));

        initChart(formattedTotal, formattedActive);
      } catch (e) {
        console.error(e);
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

  function initChart(totalData, activeData) {
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

  return (
    <div className="postureCard">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b>Subscriber Growth</b>
        <small className="muted">
          Total Users vs Active Subscribers
        </small>
      </div>

      <div style={{ height: 18 }} />

      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
}

// frontend/src/components/TerminalChart.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { createChart } from "lightweight-charts";

/**
 * TerminalChart
 * - Exchange-style chart using lightweight-charts
 * - Receives candles [{ time, open, high, low, close }]
 * - Keeps your current flow: Trading.jsx still owns websocket/ticks
 */
export default function TerminalChart({
  candles = [],
  height = 520,
  accent = "rgba(122,167,255,0.85)",
}) {
  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const data = useMemo(() => {
    // lightweight-charts expects time in seconds
    // Your Trading.jsx already uses seconds in `time`
    return (candles || [])
      .filter(Boolean)
      .map((c) => ({
        time: Number(c.time), // seconds
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }))
      .filter((c) => Number.isFinite(c.time));
  }, [candles]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // If we already created one (hot reload), clean it first
    try {
      if (chartRef.current) chartRef.current.remove();
    } catch {}

    const chart = createChart(el, {
      height,
      layout: {
        background: { color: "rgba(0,0,0,0.18)" },
        textColor: "rgba(255,255,255,0.78)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.10)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.10)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.10)" },
        horzLine: { color: "rgba(255,255,255,0.10)" },
      },
      handleScale: true,
      handleScroll: true,
    });

    const series = chart.addCandlestickSeries({
      upColor: "rgba(43,213,118,0.85)",
      downColor: "rgba(255,90,95,0.85)",
      borderUpColor: "rgba(43,213,118,0.85)",
      borderDownColor: "rgba(255,90,95,0.85)",
      wickUpColor: "rgba(255,255,255,0.55)",
      wickDownColor: "rgba(255,255,255,0.55)",
    });

    // Optional price line vibe
    series.applyOptions({
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineColor: accent,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // initial data
    if (data.length) {
      series.setData(data);
      chart.timeScale().fitContent();
    }

    // Resize observer so it looks correct on phone/laptop
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      chart.applyOptions({ width: Math.floor(rect.width), height });
    });
    ro.observe(el);

    return () => {
      try {
        ro.disconnect();
      } catch {}
      try {
        chart.remove();
      } catch {}
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]); // only recreate chart if height changes

  // Update series when candles update (no flicker)
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;

    if (data.length) {
      series.setData(data);
    }
  }, [data]);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        height,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        overflow: "hidden",
        background: "rgba(0,0,0,0.18)",
      }}
    />
  );
}

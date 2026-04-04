// ==========================================================
// 🔒 PROTECTED CORE FILE — v12 (ENGINE-SYNCED & VISUAL-STABLE)
// FILE: TerminalChart.jsx
// ==========================================================

import React, { useEffect, useMemo, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

/* ================= HELPERS ================= */
const normalizeTime = (t) => {
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
};

const normalizeSide = (side) => String(side || "").toUpperCase();

export default function TerminalChart({
  candles = [],
  trades = [],
  position = null,
  height = 520,
}) {
  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  
  // Price Line Refs for clean cleanup
  const entryLineRef = useRef(null);
  const tpLineRef = useRef(null);
  const slLineRef = useRef(null);

  /* ================= 📊 DATA MAPPING ================= */
  const candleData = useMemo(() => {
    const seen = new Set();
    const result = [];
    
    // Sort and remove duplicates to prevent Lightweight-Charts CRASH
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    
    for (const c of sorted) {
      const time = normalizeTime(c?.time);
      if (time === null || seen.has(time)) continue;
      seen.add(time);
      result.push({
        time,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close)
      });
    }
    return result;
  }, [candles]);

  /* ================= 🛠️ INITIALIZATION ================= */
  useEffect(() => {
    if (!wrapRef.current) return;

    const chart = createChart(wrapRef.current, {
      height,
      layout: {
        background: { color: "#0b1220" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(42, 46, 57, 0.5)" },
        horzLines: { color: "rgba(42, 46, 57, 0.5)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candleSeriesRef.current = series;
    chartRef.current = chart;

    // Handle Window Resize
    const handleResize = () => {
      chart.applyOptions({ width: wrapRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [height]);

  /* ================= 📈 UPDATES ================= */
  useEffect(() => {
    if (candleSeriesRef.current && candleData.length > 0) {
      candleSeriesRef.current.setData(candleData);
    }
  }, [candleData]);

  // Update Markers (Buy/Sell Arrows)
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    const markers = trades.map(t => {
      const side = normalizeSide(t.side);
      const isBuy = side === "BUY" || side === "LONG";
      return {
        time: normalizeTime(t.time),
        position: isBuy ? "belowBar" : "aboveBar",
        color: isBuy ? "#22c55e" : "#ef4444",
        shape: isBuy ? "arrowUp" : "arrowDown",
        text: side
      };
    }).filter(m => m.time !== null);
    
    candleSeriesRef.current.setMarkers(markers);
  }, [trades]);

  // Update Price Lines (Entry/TP/SL)
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    // 1. Cleanup old lines
    [entryLineRef, tpLineRef, slLineRef].forEach(ref => {
      if (ref.current) {
        series.removePriceLine(ref.current);
        ref.current = null;
      }
    });

    // 2. If no position, exit
    if (!position) return;

    // 3. Draw Entry (Yellow)
    entryLineRef.current = series.createPriceLine({
      price: Number(position.entry),
      color: "#eab308",
      lineWidth: 2,
      lineStyle: 0,
      axisLabelVisible: true,
      title: "ENTRY",
    });

    // 4. Draw Take Profit (Green)
    if (position.takeProfit) {
      tpLineRef.current = series.createPriceLine({
        price: Number(position.takeProfit),
        color: "#22c55e",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: "TP",
      });
    }

    // 5. Draw Stop Loss (Red)
    if (position.stopLoss) {
      slLineRef.current = series.createPriceLine({
        price: Number(position.stopLoss),
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: "SL",
      });
    }
  }, [position]);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(148,163,184,.15)",
        background: "#0b1220",
      }}
    />
  );
}


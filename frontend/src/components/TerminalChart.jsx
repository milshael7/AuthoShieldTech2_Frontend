// ==========================================================
// 🔒 PROTECTED CORE FILE — v12.2 (UNISON HARDENED)
// FILE: TerminalChart.jsx — INDUSTRIAL TRADING SURFACE
// ==========================================================

import React, { useEffect, useMemo, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

/* ================= HELPERS ================= */
const normalizeTime = (t) => {
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  // Lightweight charts REQUIRES seconds (Unix timestamp)
  return n > 1e11 ? Math.floor(n / 1000) : Math.floor(n);
};

export default function TerminalChart({
  candles = [],
  trades = [],
  position = null,
  height = 520,
}) {
  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  
  const entryLineRef = useRef(null);
  const tpLineRef = useRef(null);
  const slLineRef = useRef(null);

  /* ================= 📊 DATA MAPPING ================= */
  const candleData = useMemo(() => {
    const seen = new Set();
    const result = [];
    
    // Sort and filter to prevent charting engine exceptions
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
        background: { color: "#0b101a" }, // Matched to Industrial Navy
        textColor: "#64748b",
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: { 
        mode: CrosshairMode.Normal,
        vertLine: { labelBackgroundColor: "#1e293b" },
        horzLine: { labelBackgroundColor: "#1e293b" },
      },
      timeScale: { 
        timeVisible: true, 
        secondsVisible: false,
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      }
    });

    const series = chart.addCandlestickSeries({
      upColor: "#2bd576",   // --p-ok
      downColor: "#ff5a5f", // --p-bad
      borderVisible: false,
      wickUpColor: "#2bd576",
      wickDownColor: "#ff5a5f",
    });

    candleSeriesRef.current = series;
    chartRef.current = chart;

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
      
      // Auto-fit content on initial load so the user sees candles immediately
      if (candleData.length < 50) {
        chartRef.current?.timeScale().fitContent();
      }
    }
  }, [candleData]);

  // Update Buy/Sell Arrows
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    const markers = trades.map(t => {
      const side = String(t.side || "").toUpperCase();
      const isBuy = side === "BUY" || side === "LONG";
      return {
        time: normalizeTime(t.time || t.timestamp),
        position: isBuy ? "belowBar" : "aboveBar",
        color: isBuy ? "#2bd576" : "#ff5a5f",
        shape: isBuy ? "arrowUp" : "arrowDown",
        text: isBuy ? "B" : "S", // Minimalist text for institutional look
      };
    }).filter(m => m.time !== null);
    
    candleSeriesRef.current.setMarkers(markers);
  }, [trades]);

  // Update Entry/TP/SL Lines
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    [entryLineRef, tpLineRef, slLineRef].forEach(ref => {
      if (ref.current) { series.removePriceLine(ref.current); ref.current = null; }
    });

    if (!position) return;

    entryLineRef.current = series.createPriceLine({
      price: Number(position.entry),
      color: "#5ec6ff", // --p-accent
      lineWidth: 2,
      lineStyle: 0,
      axisLabelVisible: true,
      title: "ENTRY",
    });

    if (position.takeProfit) {
      tpLineRef.current = series.createPriceLine({
        price: Number(position.takeProfit),
        color: "#2bd576",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "TP",
      });
    }

    if (position.stopLoss) {
      slLineRef.current = series.createPriceLine({
        price: Number(position.stopLoss),
        color: "#ff5a5f",
        lineWidth: 1,
        lineStyle: 2,
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
        height: "100%",
        position: "relative",
        background: "#0b101a",
      }}
    />
  );
}

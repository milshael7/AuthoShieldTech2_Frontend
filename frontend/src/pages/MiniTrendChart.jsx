// ==========================================================
// 🛡️ PROTECTED SPARKLINE — v1.0 (NEW_MODULE)
// MODULE: Lightweight Trend Visualization
// FILE: src/components/MiniTrendChart.jsx
// ==========================================================

import React, { useMemo, useEffect, useState, useRef } from "react";
import { useTrading } from "../context/TradingContext.jsx";

// 📊 MAX_POINTS: Keeps the SVG render cheap
const MAX_POINTS = 50;

export default function MiniTrendChart({ symbol = "BTCUSDT", color = "#00ff88" }) {
  const { price: livePrice } = useTrading();
  const [history, setHistory] = useState([]);
  const containerRef = useRef(null);

  /* ================= 📡 REAL-TIME FEED ================= */
  useEffect(() => {
    // Only capture price if it belongs to this symbol
    // Note: This logic assumes useTrading provides a symbol-specific price,
    // otherwise a full quote stream would be needed here.
    if (!livePrice || livePrice <= 0) return;

    setHistory((prev) => {
      const now = Date.now();
      const next = [...prev, { time: now, price: Number(livePrice) }];
      // Trim to maintain max points for performance
      if (next.length > MAX_POINTS) {
        return next.slice(-MAX_POINTS);
      }
      return next;
    });
  }, [livePrice]);

  /* ================= 📐 SVG PATH GENERATOR ================= */
  const { svgPath, width, height, firstPrice, lastPrice } = useMemo(() => {
    if (history.length < 2) return { svgPath: "", width: 100, height: 40 };

    // Set dimensions based on container or default
    const w = containerRef.current?.clientWidth || 200;
    const h = containerRef.current?.clientHeight || 60;
    const padding = 5;

    // Calculate Y Scale (Min/Max price)
    const prices = history.map((p) => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.min(...prices); // 🛰️ PUSH 8.2 BUGFIX: Fixed min/min typo

    // Normalize max/min to prevent flatline error
    const minPrice = minP;
    const maxPrice = (maxP === minP) ? maxP * 1.0001 : maxP;

    // Calculate X Scale (Time)
    const times = history.map((p) => p.time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;

    const scaleY = (p) => h - padding - (((p - minPrice) / (maxPrice - minPrice)) * (h - padding * 2));
    const scaleX = (t) => padding + (((t - minTime) / timeRange) * (w - padding * 2));

    // Map points to SVG coordinates
    const points = history.map((pt) => ({
      x: scaleX(pt.time),
      y: scaleY(pt.price),
    }));

    // Generate SVG Path String (Polyline)
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

    return {
      svgPath: path,
      width: w,
      height: h,
      firstPrice: history[0].price,
      lastPrice: history[history.length - 1].price,
    };
  }, [history]);

  // Determine change color (fallback to neon if prices are equal)
  const isUp = lastPrice >= firstPrice;
  const trendColor = isUp ? "#00ff88" : "#ff4444";

  return (
    <div ref={containerRef} style={styles.container}>
      {history.length < 5 ? (
        <div style={styles.loading}>// SYNCING_STREAM...</div>
      ) : (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={styles.svg}
        >
          {/* Gradient Area Fill */}
          <defs>
            <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under the line */}
          <path
            d={`${svgPath} L ${width - 5} ${height} L ${5} ${height} Z`}
            fill={`url(#gradient-${symbol})`}
            stroke="none"
          />

          {/* Sparkline */}
          <path
            d={svgPath}
            fill="none"
            stroke={trendColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* End Point Dot */}
          {history.length > 0 && (
            <circle
              cx={width - 5}
              cy={scaleY(lastPrice)} // Re-evaluating Y for exact point
              r="2"
              fill={trendColor}
            />
          )}
        </svg>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    width: "100%",
    height: "100%",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background: "transparent",
  },
  svg: { display: "block" },
  loading: {
    fontSize: "9px",
    color: "#64748b",
    fontFamily: "monospace",
    letterSpacing: "1px",
  },
};

import React from "react";

/*
  PerformanceChart.jsx
  - Lightweight SVG equity curve
  - No libraries
  - No backend
  - Visual only
*/

export default function PerformanceChart({
  scalpHistory = [],
  sessionHistory = [],
}) {
  const width = 600;
  const height = 220;
  const padding = 30;

  const allValues = [...scalpHistory, ...sessionHistory];
  const max = Math.max(...allValues, 1000);
  const min = Math.min(...allValues, 0);

  function normalize(value) {
    const range = max - min || 1;
    return (
      height - padding - ((value - min) / range) * (height - padding * 2)
    );
  }

  function buildPath(history) {
    if (!history.length) return "";

    const step = (width - padding * 2) / (history.length - 1 || 1);

    return history
      .map((value, i) => {
        const x = padding + i * step;
        const y = normalize(value);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Background grid */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="rgba(255,255,255,.1)"
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="rgba(255,255,255,.1)"
      />

      {/* Scalp Line */}
      <path
        d={buildPath(scalpHistory)}
        fill="none"
        stroke="#5EC6FF"
        strokeWidth="2"
      />

      {/* Session Line */}
      <path
        d={buildPath(sessionHistory)}
        fill="none"
        stroke="#9B7CFF"
        strokeWidth="2"
      />
    </svg>
  );
}

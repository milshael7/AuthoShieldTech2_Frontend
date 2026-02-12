import React from "react";

export default function EquityCurve({ equityHistory = [] }) {
  if (!equityHistory.length) return null;

  const max = Math.max(...equityHistory);
  const min = Math.min(...equityHistory);
  const range = max - min || 1;

  return (
    <div
      style={{
        height: 160,
        background: "rgba(255,255,255,0.04)",
        borderRadius: 12,
        padding: 10,
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
      }}
    >
      {equityHistory.map((value, i) => {
        const height = ((value - min) / range) * 100;

        return (
          <div
            key={i}
            style={{
              width: "4px",
              height: `${height}%`,
              background:
                value >= equityHistory[0]
                  ? "#5EC6FF"
                  : "#ff5a5f",
              transition: "height .3s ease",
            }}
          />
        );
      })}
    </div>
  );
}

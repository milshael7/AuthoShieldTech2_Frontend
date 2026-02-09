// frontend/src/components/CoverageRadar.jsx
// SOC Coverage Radar — FINAL BASELINE
// Visual blueprint match for "Coverage & Issues by Security Control"
//
// SAFE:
// - UI only
// - No API calls
// - No business logic
// - Consumes normalized coverage data
// - Uses Recharts (enterprise-safe)

import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

/**
 * Expected data format:
 * [
 *   { name: "Endpoint Security", coverage: 92 },
 *   { name: "Identity & Access", coverage: 85 },
 *   ...
 * ]
 */

export default function CoverageRadar({ data = [] }) {
  if (!data.length) {
    return (
      <div
        style={{
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--p-muted)",
          fontSize: 13,
        }}
      >
        Coverage data unavailable
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 340 }}>
      <ResponsiveContainer>
        <RadarChart
          data={data}
          cx="50%"
          cy="50%"
          outerRadius="72%"
        >
          <PolarGrid stroke="rgba(255,255,255,.12)" />

          <PolarAngleAxis
            dataKey="name"
            tick={{
              fill: "rgba(255,255,255,.75)",
              fontSize: 12,
            }}
          />

          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />

          <Radar
            name="Coverage"
            dataKey="coverage"
            stroke="rgba(122,167,255,.95)"
            fill="rgba(122,167,255,.35)"
            fillOpacity={0.55}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

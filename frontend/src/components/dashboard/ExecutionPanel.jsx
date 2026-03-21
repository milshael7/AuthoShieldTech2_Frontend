import React from "react";

export default function ExecutionPanel({ data }) {
  if (!data) return <div>Loading execution...</div>;

  const condition = data.condition?.condition || "unknown";

  return (
    <div style={{ padding: 16 }}>
      <h3>⚡ Execution</h3>

      <p><strong>Quality:</strong> {(data.score * 100).toFixed(1)}%</p>
      <p><strong>Latency:</strong> {data.avgLatency.toFixed(0)} ms</p>
      <p><strong>Slippage:</strong> {(data.avgSlippage * 100).toFixed(3)}%</p>

      <p>
        <strong>Status:</strong>{" "}
        <span style={{ color: condition === "poor" ? "red" : "lime" }}>
          {condition}
        </span>
      </p>
    </div>
  );
}

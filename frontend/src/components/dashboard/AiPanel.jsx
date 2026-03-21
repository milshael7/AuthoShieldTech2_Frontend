import React from "react";

export default function AiPanel({ data }) {
  if (!data) return <div>Loading AI...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h3>🧠 AI Decision</h3>

      <p><strong>Action:</strong> {data.action}</p>
      <p><strong>Confidence:</strong> {(data.confidence * 100).toFixed(1)}%</p>
      <p><strong>Edge:</strong> {data.edge.toFixed(4)}</p>
      <p><strong>Regime:</strong> {data.regime}</p>

      <p style={{ color: "#aaa", fontSize: 12 }}>
        {data.reason}
      </p>
    </div>
  );
}

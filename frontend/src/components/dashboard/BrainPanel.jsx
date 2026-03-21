import React from "react";

export default function BrainPanel({ data }) {
  if (!data) return <div>Loading brain...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h3>📊 AI Brain</h3>

      <p><strong>Trades:</strong> {data.totalTrades}</p>
      <p><strong>Win Rate:</strong> {(data.winRate * 100).toFixed(1)}%</p>
      <p><strong>Net PnL:</strong> ${data.netPnL.toFixed(2)}</p>
      <p><strong>Memory:</strong> {data.memoryDepth}</p>
    </div>
  );
}

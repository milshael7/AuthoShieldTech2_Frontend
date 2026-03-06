// frontend/src/components/AIBehaviorPanel.jsx
// ============================================================
// AI BEHAVIOR PANEL — AI PERFORMANCE INTELLIGENCE
// ============================================================

import React, { useMemo } from "react";

export default function AIBehaviorPanel({ trades = [], decisions = [] }) {

  /* ================= DECISION DISTRIBUTION ================= */

  const decisionStats = useMemo(() => {

    let buy = 0;
    let sell = 0;
    let hold = 0;

    decisions.forEach(d => {

      if (d.action === "BUY") buy++;
      else if (d.action === "SELL") sell++;
      else hold++;

    });

    return { buy, sell, hold };

  }, [decisions]);

  /* ================= CONFIDENCE VS WIN RATE ================= */

  const confidenceAccuracy = useMemo(() => {

    if (!trades.length) return 0;

    const wins =
      trades.filter(t => t.profit > 0).length;

    return (wins / trades.length) * 100;

  }, [trades]);

  /* ================= AI CONFIDENCE ================= */

  const avgConfidence = useMemo(() => {

    if (!decisions.length) return 0;

    const total =
      decisions.reduce(
        (sum, d) => sum + (d.confidence || 0),
        0
      );

    return (total / decisions.length) * 100;

  }, [decisions]);

  return (

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.08)"
    }}>

      <h3 style={{marginBottom:15}}>
        AI Behavior Intelligence
      </h3>

      {/* CONFIDENCE */}

      <div style={{marginBottom:12}}>
        <strong>Average AI Confidence:</strong>{" "}
        {avgConfidence.toFixed(1)}%
      </div>

      {/* ACCURACY */}

      <div style={{marginBottom:12}}>
        <strong>AI Accuracy:</strong>{" "}
        {confidenceAccuracy.toFixed(1)}%
      </div>

      {/* DECISION DISTRIBUTION */}

      <div style={{marginTop:15}}>

        <strong>Decision Distribution</strong>

        <div style={{
          display:"flex",
          gap:20,
          marginTop:8
        }}>

          <span style={{color:"#22c55e"}}>
            BUY: {decisionStats.buy}
          </span>

          <span style={{color:"#ef4444"}}>
            SELL: {decisionStats.sell}
          </span>

          <span style={{color:"#f59e0b"}}>
            HOLD: {decisionStats.hold}
          </span>

        </div>

      </div>

    </div>

  );

}

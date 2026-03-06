// frontend/src/components/PortfolioAllocation.jsx
// ============================================================
// PORTFOLIO ALLOCATION DASHBOARD
// ============================================================

import React, { useMemo } from "react";

export default function PortfolioAllocation({ trades = [] }) {

  /* ================= BUILD EXPOSURE ================= */

  const allocation = useMemo(() => {

    const map = {};
    let total = 0;

    trades.forEach(t => {

      const value =
        Math.abs((t.qty || 0) * (t.price || 0));

      if(!value) return;

      map[t.symbol] =
        (map[t.symbol] || 0) + value;

      total += value;

    });

    const result = Object.entries(map).map(
      ([symbol,val]) => ({
        symbol,
        pct: total ? (val / total) * 100 : 0
      })
    );

    return result;

  }, [trades]);

  /* ================= UI ================= */

  return (

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.08)"
    }}>

      <h3 style={{marginBottom:14}}>
        Portfolio Allocation
      </h3>

      {allocation.length === 0 && (
        <div style={{opacity:.6}}>
          No portfolio exposure yet
        </div>
      )}

      {allocation.map((a,i)=>(

        <div
          key={i}
          style={{marginBottom:12}}
        >

          <div style={{
            display:"flex",
            justifyContent:"space-between",
            marginBottom:4
          }}>
            <span>{a.symbol}</span>
            <span>{a.pct.toFixed(1)}%</span>
          </div>

          <div style={{
            height:8,
            background:"#1f2937",
            borderRadius:6,
            overflow:"hidden"
          }}>

            <div style={{
              width:`${a.pct}%`,
              height:"100%",
              background:"#3b82f6"
            }}/>

          </div>

        </div>

      ))}

    </div>

  );

}

import React, { useEffect, useState, useMemo } from "react";

const API_BASE = "/api";

function money(v) {
  if (v == null) return "—";
  return `$${Number(v).toFixed(2)}`;
}

function pct(v) {
  if (v == null) return "—";
  return `${(Number(v) * 100).toFixed(2)}%`;
}

export default function TradingRoom() {
  const [paper, setPaper] = useState(null);
  const [live, setLive] = useState(null);
  const [risk, setRisk] = useState(null);
  const [prices, setPrices] = useState({});
  const [wsStatus, setWsStatus] = useState("disconnected");

  /* ================= SNAPSHOTS ================= */

  async function loadSnapshots() {
    try {
      const [paperRes, liveRes, riskRes] = await Promise.all([
        fetch(`${API_BASE}/trading/paper/snapshot`).then(r => r.json()),
        fetch(`${API_BASE}/trading/live/snapshot`).then(r => r.json()),
        fetch(`${API_BASE}/trading/risk/snapshot`).then(r => r.json()),
      ]);

      if (paperRes.ok) setPaper(paperRes.snapshot);
      if (liveRes.ok) setLive(liveRes.snapshot);
      if (riskRes.ok) setRisk(riskRes.risk);
    } catch (e) {
      console.error("Trading load failed", e);
    }
  }

  useEffect(() => {
    loadSnapshots();
    const interval = setInterval(loadSnapshots, 4000);
    return () => clearInterval(interval);
  }, []);

  /* ================= WEBSOCKET ================= */

  useEffect(() => {
    const protocol =
      window.location.protocol === "https:" ? "wss:" : "ws:";

    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/market`
    );

    ws.onopen = () => setWsStatus("connected");
    ws.onclose = () => setWsStatus("disconnected");
    ws.onerror = () => setWsStatus("error");

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "tick") {
          setPrices(prev => ({
            ...prev,
            [data.symbol]: data.price,
          }));
        }
      } catch {}
    };

    return () => ws.close();
  }, []);

  /* ================= DERIVED ================= */

  const position = paper?.position;

  /* ================= UI ================= */

  return (
    <div
      style={{
        padding: 30,
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* =======================================================
         HEADER
      ======================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          paddingBottom: 14,
        }}
      >
        <h2 style={{ margin: 0 }}>Trading Command Center</h2>

        <div
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 999,
            background:
              wsStatus === "connected"
                ? "rgba(94,198,255,.15)"
                : wsStatus === "error"
                ? "rgba(255,77,77,.18)"
                : "rgba(255,255,255,.08)",
          }}
        >
          Feed: {wsStatus.toUpperCase()}
        </div>
      </div>

      {/* =======================================================
         GRID
      ======================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
        }}
      >
        {/* ================= LEFT SIDE ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* MARKET STREAM */}
          <div className="card">
            <h3>Live Market</h3>

            {Object.keys(prices).length === 0 ? (
              <div style={{ opacity: 0.6 }}>
                Waiting for ticks...
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(140px,1fr))",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                {Object.entries(prices).map(([symbol, price]) => (
                  <div
                    key={symbol}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.08)",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <strong>{symbol}</strong>
                    <span>{price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* POSITION PANEL */}
          <div className="card">
            <h3>Active Position</h3>

            {position ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,1fr)",
                  gap: 14,
                  marginTop: 12,
                }}
              >
                <div>
                  <small>Quantity</small>
                  <div>{position.qty}</div>
                </div>

                <div>
                  <small>Entry</small>
                  <div>{money(position.entry)}</div>
                </div>

                <div>
                  <small>Current Equity</small>
                  <div>{money(paper?.equity)}</div>
                </div>

                <div>
                  <small>Trades</small>
                  <div>{paper?.trades?.length || 0}</div>
                </div>
              </div>
            ) : (
              <div style={{ opacity: 0.6 }}>
                No open positions
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* LIVE ENGINE */}
          <div className="card">
            <h3>Live Engine</h3>

            {live ? (
              <>
                <div>Mode: {live.mode}</div>
                <div>Equity: {money(live.equity)}</div>
                <div>Margin Used: {money(live.marginUsed)}</div>
                <div>
                  Liquidation:{" "}
                  {live.liquidation ? (
                    <span style={{ color: "#ff4d4d" }}>
                      YES ⚠
                    </span>
                  ) : (
                    "No"
                  )}
                </div>
              </>
            ) : (
              "Unavailable"
            )}
          </div>

          {/* RISK PANEL */}
          <div className="card">
            <h3>Risk Status</h3>

            {risk ? (
              <>
                <div>
                  Halted:{" "}
                  {risk.halted ? (
                    <span style={{ color: "#ff4d4d" }}>
                      YES
                    </span>
                  ) : (
                    "No"
                  )}
                </div>
                <div>Reason: {risk.haltReason || "—"}</div>
                <div>
                  Multiplier: {risk.riskMultiplier?.toFixed(2)}
                </div>
                <div>
                  Drawdown: {pct(risk.drawdown)}
                </div>
              </>
            ) : (
              "Unavailable"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

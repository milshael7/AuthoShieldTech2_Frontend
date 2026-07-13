// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/pages/TradingDashboard.jsx
// VERSION: v2.1 (ENHANCED FOR PERFORMANCE AND ERROR HANDLING)
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getToken, getSavedUser } from "../lib/api.js";

/* =========================================================
CONFIG
========================================================= */

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
const STATUS_POLL_MS = 5000;
const HISTORY_POLL_MS = 15000;
const MAX_DECISIONS = 200;
const MAX_TRADES = 500;

/* =========================================================
UTIL
========================================================= */

function safeNum(v, fallback = 0) {
 const n = Number(v);
 return Number.isFinite(n) ? n : fallback;
}

function fmtMoney(v) {
 return safeNum(v).toFixed(2);
}

function fmtPct(v) {
 return `${(safeNum(v) * 100).toFixed(2)}%`;
}

function getCompanyId() {
 const user = getSavedUser?.();
 return user?.companyId ? String(user.companyId) : null;
}

function buildAuthHeaders() {
 const token = getToken?.();
 const companyId = getCompanyId();

 const headers = { "Content-Type": "application/json" };
 if (token) headers.Authorization = `Bearer ${token}`;
 if (companyId) headers["x-company-id"] = companyId;

 return headers;
}

function buildWsUrl() {
 const token = getToken?.();
 if (!token || !API_BASE) return null;

 const url = new URL(API_BASE);
 const protocol = url.protocol === "https:" ? "wss:" : "ws:";

 return `${protocol}//${url.host}/ws?channel=paper&token=${token}`;
}

/* =========================================================
COMPONENT
========================================================= */

export default function TradingDashboard() {
 const wsRef = useRef(null);
 const aliveRef = useRef(true);

 const [engine, setEngine] = useState("CHECKING");
 const [confidence, setConfidence] = useState(0);
 const [snapshot, setSnapshot] = useState({});
 const [trades, setTrades] = useState([]);
 const [decisions, setDecisions] = useState([]);
 const [history, setHistory] = useState({ totalTrades: 0, wins: 0, losses: 0, pnl: 0 });
 const [error, setError] = useState(null); // Added for error handling

 /* =========================================================
STATUS LOAD (REAL ENGINE)
========================================================= */

 async function loadStatus() {
 try {
 const res = await fetch(`${API_BASE}/api/paper/status`, {
 headers: buildAuthHeaders(),
 });

 const data = await res.json();

 if (!data?.ok) throw new Error('Failed to fetch');

 setEngine(data.engine || "IDLE");
 setConfidence(safeNum(data?.brainState?.smoothedConfidence ?? data?.ai?.confidence ?? 0));
 setSnapshot(data.snapshot || {});
 setTrades(Array.isArray(data.snapshot.trades) ? data.snapshot.trades.slice(-MAX_TRADES) : []);
 setDecisions(Array.isArray(data.snapshot.decisions) ? data.snapshot.decisions.slice(-MAX_DECISIONS) : []);
 } catch (error) {
   setError(error.message); // Catch error message
 }
 }

 /* =========================================================
ANALYTICS LOAD (REAL MEMORY)
========================================================= */

 async function loadAnalytics() {
 try {
 const res = await fetch(`${API_BASE}/api/analytics/trading`, {
 headers: buildAuthHeaders(),
 });

 const data = await res.json();

 if (!data?.ok) throw new Error('Failed to fetch');

 setHistory({
 totalTrades: safeNum(data.summary.totalTrades),
 wins: safeNum(data.summary.wins),
 losses: safeNum(data.summary.losses),
 pnl: safeNum(data.summary.realizedPnl),
 });
 setTrades(Array.isArray(data.tradeArchive) ? data.tradeArchive.slice(-MAX_TRADES) : []);
 setDecisions(Array.isArray(data.decisionArchive) ? data.decisionArchive.slice(-MAX_DECISIONS) : []);
 } catch (error) {
   setError(error.message); // Catch error message
 }
 }

 /* =========================================================
WEBSOCKET (LIVE STREAM)
========================================================= */

 function connectWs() {
 const url = buildWsUrl();
 if (!url) return;

 const ws = new WebSocket(url);
 wsRef.current = ws;

 ws.onmessage = (e) => {
 try {
 const msg = JSON.parse(e.data);
 if (msg.channel !== "paper") return;

 if (msg.snapshot) {
 setSnapshot(msg.snapshot);
 setTrades(msg.snapshot.trades ? msg.snapshot.trades.slice(-MAX_TRADES) : []);
 setDecisions(msg.snapshot.decisions ? msg.snapshot.decisions.slice(-MAX_DECISIONS) : []);
 }
 } catch (error) {
   setError('Failed to parse WebSocket message'); // Catch error in socket messages
 }
 };
 }

 /* =========================================================
INIT
========================================================= */

 useEffect(() => {
 loadStatus();
 loadAnalytics();
 connectWs();

 const s = setInterval(loadStatus, STATUS_POLL_MS);
 const h = setInterval(loadAnalytics, HISTORY_POLL_MS);

 return () => {
 aliveRef.current = false;
 clearInterval(s);
 clearInterval(h);
 wsRef.current?.close();
 };
 }, []);

 /* =========================================================
DERIVED
========================================================= */

 const lastTrade = useMemo(() => trades[trades.length - 1], [trades]); // Use useMemo for derived value

 /* =========================================================
UI
========================================================= */

 return (
 <div style={styles.wrapper}>
 {error && <div style={{ color: 'red' }}>{error}</div>} {/* Show error message */}
 <h1>📊 Trading Analytics</h1>
 <div style={styles.grid}>
 <div style={styles.card}>
 <h3>Engine</h3>
 <p>Status: {engine}</p>
 <p>Confidence: {fmtPct(confidence)}</p>
 </div>
 <div style={styles.card}>
 <h3>Performance</h3>
 <p>Trades: {history.totalTrades}</p>
 <p>Wins: {history.wins}</p>
 <p>Losses: {history.losses}</p>
 <p>PnL: ${fmtMoney(history.pnl)}</p>
 </div>
 <div style={styles.card}>
 <h3>Last Trade</h3>
 <p>Side: {lastTrade?.side || "-"}</p>
 <p>Price: {lastTrade?.price || "-"}</p>
 <p>PnL: {lastTrade?.pnl || "-"}</p>
 </div>
 </div>

 <div style={styles.card}>
 <h3>Recent Decisions</h3>
 {decisions.slice(-10).map((d, i) => (
 <div key={i}>{d.action} | {fmtPct(d.confidence)}</div>
 ))}
 </div>

 <div style={styles.card}>
 <h3>Recent Trades</h3>
 {trades.slice(-10).map((t, i) => (
 <div key={i}>{t.side} @ {t.price} → ${fmtMoney(t.pnl)}</div>
 ))}
 </div>
 </div>
 );
}

/* =========================================================
STYLES
========================================================= */

const styles = {
 wrapper: {
 padding: 24,
 background: "#0a0f1c",
 color: "#fff",
 minHeight: "100vh",
 },
 grid: {
 display: "grid",
 gridTemplateColumns: "repeat(3, 1fr)",
 gap: 16,
 },
 card: {
 background: "#111",
 padding: 16,
 borderRadius: 10,
 marginBottom: 16,
 },
};

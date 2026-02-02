// frontend/src/pages/Trading.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import VoiceAI from "../components/VoiceAI";
import TVChart from "../components/TVChart";

/* =========================================================
   Helpers
   ========================================================= */

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const apiBase = () =>
  (import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BACKEND_URL ||
    "").trim();

const fmtMoney = (n, d = 2) =>
  Number.isFinite(+n) ? "$" + (+n).toLocaleString(undefined, { maximumFractionDigits: d }) : "—";

const fmtCompact = (n, d = 2) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  if (a >= 1e9) return (x / 1e9).toFixed(d) + "b";
  if (a >= 1e6) return (x / 1e6).toFixed(d) + "m";
  if (a >= 1e3) return (x / 1e3).toFixed(d) + "k";
  return x.toFixed(d);
};

const pct = (n, d = 0) =>
  Number.isFinite(+n) ? (+n * 100).toFixed(d) + "%" : "—";

/* =========================================================
   Mobile detection (real iPhone behavior)
   ========================================================= */

function useIsMobile(breakpoint = 980) {
  const [w, setW] = useState(window.innerWidth);

  useEffect(() => {
    const r = () => setW(window.innerWidth);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const ua = navigator.userAgent;
  const uaMobile = /iPhone|iPad|Android|Mobile|CriOS/i.test(ua);
  return uaMobile || w <= breakpoint;
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function Trading() {
  const isMobile = useIsMobile();

  /* ✅ DEFAULT TAB = CHART MARKET */
  const [tab, setTab] = useState("chart"); // chart | room | reports

  const [symbol, setSymbol] = useState("BTCUSD");
  const [last, setLast] = useState(65300);
  const [feedStatus, setFeedStatus] = useState("Connecting…");

  const [candles, setCandles] = useState(() => {
    const out = [];
    let p = 65300;
    let t = Math.floor(Date.now() / 1000);
    for (let i = 80; i > 0; i--) {
      const time = t - i * 5;
      const o = p;
      const c = o + (Math.random() - 0.5) * 60;
      out.push({
        time,
        open: o,
        high: Math.max(o, c) + Math.random() * 20,
        low: Math.min(o, c) - Math.random() * 20,
        close: c,
      });
      p = c;
    }
    return out;
  });

  /* =========================================================
     Fake feed (safe fallback)
     ========================================================= */

  useEffect(() => {
    let price = last;
    setFeedStatus("Connected (demo)");
    const t = setInterval(() => {
      price += (Math.random() - 0.5) * 40;
      setLast(+price.toFixed(2));

      setCandles((prev) => {
        const next = [...prev];
        const now = Math.floor(Date.now() / 1000);
        const lastC = next[next.length - 1];
        if (!lastC || now - lastC.time >= 5) {
          next.push({
            time: now,
            open: lastC ? lastC.close : price,
            high: price,
            low: price,
            close: price,
          });
          while (next.length > 160) next.shift();
        } else {
          lastC.high = Math.max(lastC.high, price);
          lastC.low = Math.min(lastC.low, price);
          lastC.close = price;
        }
        return next;
      });
    }, 900);

    return () => clearInterval(t);
  }, []);

  /* =========================================================
     Layout
     ========================================================= */

  const chartHeight = isMobile ? 520 : 640;

  return (
    <div style={{ padding: 14, maxWidth: 1200, margin: "0 auto" }}>
      {/* ================== TOP NAV (FILE CABINET) ================== */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button className={tab === "chart" ? "active" : ""} onClick={() => setTab("chart")}>
          Market (Chart)
        </button>
        <button className={tab === "room" ? "active" : ""} onClick={() => setTab("room")}>
          Trading Room
        </button>
        <button className={tab === "reports" ? "active" : ""} onClick={() => setTab("reports")}>
          Reports
        </button>
      </div>

      {/* ================== HEADER ================== */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Trading</h2>
            <small>Clean layout • No smushing • Mobile + Desktop aligned</small>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="badge">Feed: <b>{feedStatus}</b></span>
            <span className="badge">Last: <b>{fmtMoney(last)}</b></span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              <option>BTCUSD</option>
              <option>ETHUSD</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================== PAGES ================== */}
      {tab === "chart" && (
        <div className="card">
          <TVChart
            candles={candles}
            height={chartHeight}
            symbol={symbol}
            last={last}
          />
        </div>
      )}

      {tab === "room" && (
        <div className="card">
          <h3>Trading Room</h3>
          <p style={{ opacity: 0.75 }}>
            This page holds controls, AI, logs, and positions — separated from the chart so nothing breaks.
          </p>
          <VoiceAI title="AutoProtect Voice" endpoint="/api/ai/chat" />
        </div>
      )}

      {tab === "reports" && (
        <div className="card">
          <h3>Reports</h3>
          <ul style={{ opacity: 0.8 }}>
            <li>Win / Loss</li>
            <li>Daily P&amp;L</li>
            <li>Fees & slippage</li>
            <li>Exports later</li>
          </ul>
        </div>
      )}
    </div>
  );
}

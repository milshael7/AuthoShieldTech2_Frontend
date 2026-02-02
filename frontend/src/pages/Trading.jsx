// frontend/src/pages/Trading.jsx
import React, { useEffect, useMemo, useState } from "react";
import VoiceAI from "../components/VoiceAI";
import TVChart from "../components/TVChart";

/* =========================================================
   Helpers
   ========================================================= */

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const fmtMoney = (n, d = 2) =>
  Number.isFinite(+n)
    ? "$" + (+n).toLocaleString(undefined, { maximumFractionDigits: d })
    : "—";

const fmtCompact = (n, d = 2) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  if (a >= 1e12) return (x / 1e12).toFixed(d) + "t";
  if (a >= 1e9) return (x / 1e9).toFixed(d) + "b";
  if (a >= 1e6) return (x / 1e6).toFixed(d) + "m";
  if (a >= 1e3) return (x / 1e3).toFixed(d) + "k";
  return x.toFixed(d);
};

const pct = (n, d = 2) =>
  Number.isFinite(+n) ? (+n * 100).toFixed(d) + "%" : "—";

/* =========================================================
   Mobile detection (real iPhone behavior)
   ========================================================= */

function useIsMobile(breakpoint = 980) {
  const [w, setW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const r = () => setW(window.innerWidth || 1200);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const ua =
    typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const uaMobile = /iPhone|iPad|Android|Mobile|CriOS|FxiOS/i.test(ua);
  return uaMobile || w <= breakpoint;
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function Trading() {
  const isMobile = useIsMobile();

  // ✅ DEFAULT TAB = CHART MARKET
  const [tab, setTab] = useState("chart"); // chart | room | reports

  const [symbol, setSymbol] = useState("BTCUSD");
  const [last, setLast] = useState(65300);
  const [feedStatus, setFeedStatus] = useState("Connecting…");

  // simple “demo” stats (UI only)
  const [dayChange, setDayChange] = useState(0.0123); // 1.23%
  const [volume, setVolume] = useState(1284300000); // demo

  const [candles, setCandles] = useState(() => {
    const out = [];
    let p = 65300;
    const t = Math.floor(Date.now() / 1000);
    for (let i = 140; i > 0; i--) {
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

  // watchlist (UI symbols)
  const watchlist = useMemo(
    () => [
      { ui: "BTCUSD", name: "Bitcoin" },
      { ui: "ETHUSD", name: "Ethereum" },
    ],
    []
  );

  /* =========================================================
     Fake feed (safe fallback)
     ========================================================= */

  useEffect(() => {
    let price = last;
    setFeedStatus("Connected (demo)");

    const t = setInterval(() => {
      const delta = (Math.random() - 0.5) * (symbol === "ETHUSD" ? 6 : 40);
      price = Math.max(1, price + delta);

      setLast(+price.toFixed(2));

      // tiny “day change” drift
      setDayChange((p) => clamp(p + (Math.random() - 0.5) * 0.0004, -0.12, 0.12));
      setVolume((v) => Math.max(0, v + (Math.random() - 0.5) * 5000000));

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
          while (next.length > 220) next.shift();
        } else {
          lastC.high = Math.max(lastC.high, price);
          lastC.low = Math.min(lastC.low, price);
          lastC.close = price;
        }
        return next;
      });
    }, 900);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  /* =========================================================
     Layout
     ========================================================= */

  const chartHeight = isMobile ? 520 : 640;

  const pageWrapStyle = {
    padding: isMobile ? 12 : 14,
    maxWidth: 1280,
    margin: "0 auto",
    width: "100%",
  };

  const topTabsStyle = {
    display: "flex",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap",
  };

  const headerRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  };

  // terminal grid: left | center | right
  const terminalGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "260px minmax(0, 1fr) 340px",
    gap: 12,
    alignItems: "start",
  };

  const panelTitleRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  };

  const mini = { opacity: 0.75, fontSize: 12, lineHeight: 1.4 };

  const activeSymbol = watchlist.find((w) => w.ui === symbol) || watchlist[0];

  return (
    <div style={pageWrapStyle}>
      {/* ================== TOP NAV (FILE CABINET) ================== */}
      <div style={topTabsStyle}>
        <button
          className={tab === "chart" ? "active" : ""}
          onClick={() => setTab("chart")}
          type="button"
        >
          Market (Chart)
        </button>
        <button
          className={tab === "room" ? "active" : ""}
          onClick={() => setTab("room")}
          type="button"
        >
          Trading Room
        </button>
        <button
          className={tab === "reports" ? "active" : ""}
          onClick={() => setTab("reports")}
          type="button"
        >
          Reports
        </button>
      </div>

      {/* ================== HEADER ================== */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={headerRow}>
          <div style={{ minWidth: 220 }}>
            <h2 style={{ margin: 0, letterSpacing: 0.2 }}>
              Trading Terminal
            </h2>
            <div style={mini}>
              Exchange-style layout • clean spacing • mobile + desktop aligned
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span className="badge">
              Feed: <b style={{ marginLeft: 6 }}>{feedStatus}</b>
            </span>
            <span className="badge">
              Last: <b style={{ marginLeft: 6 }}>{fmtMoney(last)}</b>
            </span>

            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              <option value="BTCUSD">BTCUSD</option>
              <option value="ETHUSD">ETHUSD</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================== PAGES ================== */}
      {tab === "chart" && (
        <div style={terminalGrid}>
          {/* LEFT: Watchlist */}
          <div className="card" style={{ minWidth: 0 }}>
            <div style={panelTitleRow}>
              <b style={{ fontSize: 13 }}>Watchlist</b>
              <span className="badge" title="demo">
                {watchlist.length} assets
              </span>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {watchlist.map((w) => {
                const isActive = w.ui === symbol;
                return (
                  <button
                    key={w.ui}
                    type="button"
                    onClick={() => setSymbol(w.ui)}
                    className={isActive ? "active" : ""}
                    style={{
                      textAlign: "left",
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,.10)",
                      background: isActive
                        ? "rgba(122,167,255,0.15)"
                        : "rgba(0,0,0,0.20)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>{w.ui}</div>
                        <div style={{ opacity: 0.75, fontSize: 12 }}>{w.name}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 900 }}>{fmtMoney(last, w.ui === "ETHUSD" ? 2 : 2)}</div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                          24h:{" "}
                          <span
                            style={{
                              fontWeight: 900,
                              color:
                                dayChange >= 0
                                  ? "rgba(43,213,118,0.95)"
                                  : "rgba(255,90,95,0.95)",
                            }}
                          >
                            {pct(dayChange, 2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 12, ...mini }}>
              Tip: click an asset to load it into the chart.
            </div>
          </div>

          {/* CENTER: Chart */}
          <div className="card" style={{ minWidth: 0 }}>
            {/* Chart toolbar row */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                <b style={{ fontSize: 14 }}>{activeSymbol.ui}</b>
                <span className="badge">
                  Price: <b style={{ marginLeft: 6 }}>{fmtMoney(last)}</b>
                </span>
                <span className="badge">
                  24h:{" "}
                  <b
                    style={{
                      marginLeft: 6,
                      color:
                        dayChange >= 0
                          ? "rgba(43,213,118,0.95)"
                          : "rgba(255,90,95,0.95)",
                    }}
                  >
                    {pct(dayChange, 2)}
                  </b>
                </span>
                <span className="badge">
                  Vol: <b style={{ marginLeft: 6 }}>{fmtCompact(volume, 2)}</b>
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="badge" title="demo interval">
                  TF: <b style={{ marginLeft: 6 }}>5s</b>
                </span>
                <span className="badge" title="demo market">
                  Type: <b style={{ marginLeft: 6 }}>Spot</b>
                </span>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <TVChart candles={candles} height={chartHeight} symbol={symbol} last={last} />
            </div>

            <div style={{ marginTop: 10, ...mini }}>
              Chart tools are on the left rail: crosshair, pan, trendline, horizontal line, zoom, reset.
            </div>
          </div>

          {/* RIGHT: Market details / Order panel (clean placeholders) */}
          <div className="card" style={{ minWidth: 0 }}>
            <div style={panelTitleRow}>
              <b style={{ fontSize: 13 }}>Trade Panel</b>
              <span className="badge" title="demo">
                Paper
              </span>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {/* order type */}
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                  Order Type
                </div>
                <select defaultValue="market">
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                  <option value="stop">Stop</option>
                </select>
              </div>

              {/* buy / sell */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  style={{
                    background: "rgba(43,213,118,0.14)",
                    border: "1px solid rgba(43,213,118,0.30)",
                    fontWeight: 900,
                  }}
                >
                  Buy
                </button>
                <button
                  type="button"
                  style={{
                    background: "rgba(255,90,95,0.12)",
                    border: "1px solid rgba(255,90,95,0.28)",
                    fontWeight: 900,
                  }}
                >
                  Sell
                </button>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                  Size (USD)
                </div>
                <input type="number" placeholder="100" />
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Est. price: <b>{fmtMoney(last)}</b>
                </div>
              </div>

              <button type="button" style={{ fontWeight: 900 }}>
                Place Order (demo)
              </button>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 12 }}>
                <b style={{ fontSize: 13 }}>Market Info</b>
                <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 12, opacity: 0.9 }}>
                  <div>
                    Symbol: <b>{symbol}</b>
                  </div>
                  <div>
                    Last: <b>{fmtMoney(last)}</b>
                  </div>
                  <div>
                    24h Change:{" "}
                    <b
                      style={{
                        color:
                          dayChange >= 0
                            ? "rgba(43,213,118,0.95)"
                            : "rgba(255,90,95,0.95)",
                      }}
                    >
                      {pct(dayChange, 2)}
                    </b>
                  </div>
                  <div>
                    Volume: <b>{fmtCompact(volume, 2)}</b>
                  </div>
                </div>
              </div>

              <div style={{ ...mini }}>
                This panel is intentionally clean. Next step is to wire it to your paper trader backend (so it’s real, not fake).
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "room" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ marginTop: 0 }}>Trading Room</h3>
              <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.6 }}>
                This space is for <b>AI</b>, <b>logs</b>, <b>controls</b>, and <b>positions</b> — separate from the chart
                so the Market page stays clean like Kraken.
              </div>
            </div>
            <span className="badge">Mode: <b style={{ marginLeft: 6 }}>Paper</b></span>
          </div>

          <div style={{ marginTop: 14 }}>
            <VoiceAI title="AutoProtect Voice" endpoint="/api/ai/chat" />
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Reports</h3>
          <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.6 }}>
            This is the clean reporting area (no chart smushing):
          </div>
          <ul style={{ opacity: 0.85, marginTop: 10, lineHeight: 1.8 }}>
            <li>Win / Loss breakdown</li>
            <li>Daily P&amp;L summary</li>
            <li>Fees, spread, slippage totals</li>
            <li>Export later (CSV)</li>
          </ul>
        </div>
      )}
    </div>
  );
}

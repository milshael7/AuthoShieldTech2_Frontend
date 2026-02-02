// frontend/src/pages/Trading.jsx
import React, { useMemo, useState } from "react";
import TVChart from "../components/TVChart";
import VoiceAI from "../components/VoiceAI"; // keep if you have it; otherwise comment this line out

const fmt = (n, d = 5) =>
  Number.isFinite(+n)
    ? (+n).toLocaleString(undefined, { maximumFractionDigits: d })
    : "—";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function Trading() {
  // ===== pair selector =====
  const [symbol, setSymbol] = useState("EURUSD");

  // ===== ticket state =====
  const [side, setSide] = useState("BUY"); // BUY | SELL
  const [orderType, setOrderType] = useState("LIMIT"); // MARKET | LIMIT | STOP
  const [price, setPrice] = useState(1.11088);
  const [qty, setQty] = useState(1000);

  // “AI percent size” (your ask: AI uses % to go in/out)
  const [aiRiskPct, setAiRiskPct] = useState(2); // % of equity
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slEnabled, setSlEnabled] = useState(false);
  const [tp, setTp] = useState(1.11837);
  const [sl, setSl] = useState(1.10837);

  // ===== UI tabs =====
  const [mainTab, setMainTab] = useState("terminal"); // terminal | ai | explain
  const [dockTab, setDockTab] = useState("positions"); // positions | orders | history

  // ===== Set Orders list =====
  const [setOrders, setSetOrders] = useState(() => []);

  // ===== demo candles (swap to real feed later) =====
  const candles = useMemo(() => {
    const out = [];
    let p = 1.1108;
    let t = Math.floor(Date.now() / 1000) - 5 * 240;
    for (let i = 0; i < 240; i++) {
      const o = p;
      const c = o + (Math.random() - 0.5) * 0.003;
      const hi = Math.max(o, c) + Math.random() * 0.0015;
      const lo = Math.min(o, c) - Math.random() * 0.0015;
      out.push({ time: t, open: o, high: hi, low: lo, close: c });
      p = c;
      t += 5;
    }
    return out;
  }, [symbol]);

  const last = candles?.length ? candles[candles.length - 1].close : 1.11082;
  const bid = last - 0.00006;
  const ask = last + 0.00006;

  // ===== “SET ORDER” action =====
  const setOrder = async () => {
    // Create a rule the AI can use later
    const newOrder = {
      id: uid(),
      createdAt: new Date().toISOString(),
      symbol,
      side,
      orderType,
      qty,
      level: orderType === "MARKET" ? null : Number(price),
      tp: tpEnabled ? Number(tp) : null,
      sl: slEnabled ? Number(sl) : null,
      aiRiskPct: Number(aiRiskPct),
      status: "ARMED", // ARMED | TRIGGERED | DONE | CANCELED
    };

    setSetOrders((prev) => [newOrder, ...prev]);

    // Optional: send to backend so AI can actually act on it
    // If your backend route exists later, it can consume this config.
    try {
      const base =
        (import.meta.env.VITE_API_BASE ||
          import.meta.env.VITE_BACKEND_URL ||
          "").trim();
      if (base) {
        await fetch(`${base}/api/ai/set-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(newOrder),
        }).catch(() => {});
      }
    } catch {}

    alert(
      `SET ORDER saved ✅\n\n${side} ${symbol}\nType: ${orderType}\nLevel: ${
        orderType === "MARKET" ? "(market)" : fmt(price, 5)
      }\nQty: ${qty}\nAI Risk: ${aiRiskPct}%\nTP: ${
        tpEnabled ? fmt(tp, 5) : "off"
      }\nSL: ${slEnabled ? fmt(sl, 5) : "off"}`
    );
  };

  const cancelSetOrder = (id) => {
    setSetOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "CANCELED" } : o))
    );
  };

  return (
    <div className="termShell">
      {/* ===== TOP NAV (like your “file cabinet”) ===== */}
      <div className="termTopNav">
        <button
          className={mainTab === "terminal" ? "active" : ""}
          onClick={() => setMainTab("terminal")}
          type="button"
        >
          Terminal
        </button>
        <button
          className={mainTab === "ai" ? "active" : ""}
          onClick={() => setMainTab("ai")}
          type="button"
        >
          AI
        </button>
        <button
          className={mainTab === "explain" ? "active" : ""}
          onClick={() => setMainTab("explain")}
          type="button"
        >
          Market Explain
        </button>
      </div>

      {/* ===== TOP BAR ===== */}
      <div className="termTopBar">
        <div className="termTopLeft">
          <div className="termTitle">
            <b>AutoShield Terminal</b>
            <span>Paper Trading</span>
          </div>

          <div className="termPair">
            <span className="chipLite">OANDA:</span>
            <select
              className="termSelect"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              <option value="EURUSD">EURUSD</option>
              <option value="BTCUSD">BTCUSD</option>
              <option value="ETHUSD">ETHUSD</option>
            </select>
          </div>

          <div className="termStats">
            <span className="badgeLite">
              Bid <b>{fmt(bid, 5)}</b>
            </span>
            <span className="badgeLite">
              Ask <b>{fmt(ask, 5)}</b>
            </span>
            <span className="badgeLite">
              Last <b>{fmt(last, 5)}</b>
            </span>
          </div>
        </div>

        <div className="termTopRight">
          <button className="btnLite" type="button">
            Publish
          </button>
          <button className="btnLite" type="button">
            ▶
          </button>
        </div>
      </div>

      {/* ================== TAB: TERMINAL ================== */}
      {mainTab === "terminal" && (
        <>
          <div className="termMainGrid">
            {/* CHART */}
            <div className="termChartWrap">
              <TVChart candles={candles} symbol={symbol} last={last} height={540} />
            </div>

            {/* ORDER TICKET */}
            <div className="ticket">
              <div className="ticketHead">
                <div className="ticketPair">
                  <b>OANDA:{symbol}</b>
                  <span className="mutedSmall">PAPER TRADING</span>
                </div>
                <div className="ticketBtns">
                  <button
                    className={side === "SELL" ? "ticketSide activeSell" : "ticketSide"}
                    onClick={() => setSide("SELL")}
                    type="button"
                  >
                    SELL
                  </button>
                  <button
                    className={side === "BUY" ? "ticketSide activeBuy" : "ticketSide"}
                    onClick={() => setSide("BUY")}
                    type="button"
                  >
                    BUY
                  </button>
                </div>
              </div>

              <div className="ticketPriceRow">
                <div className="ticketPriceBox">
                  <span className="mutedSmall">SELL</span>
                  <b>{fmt(bid, 5)}</b>
                </div>
                <div className="ticketMid">1.1</div>
                <div className="ticketPriceBox">
                  <span className="mutedSmall">BUY</span>
                  <b>{fmt(ask, 5)}</b>
                </div>
              </div>

              <div className="ticketTabs">
                <button
                  className={orderType === "MARKET" ? "active" : ""}
                  onClick={() => setOrderType("MARKET")}
                  type="button"
                >
                  MARKET
                </button>
                <button
                  className={orderType === "LIMIT" ? "active" : ""}
                  onClick={() => setOrderType("LIMIT")}
                  type="button"
                >
                  LIMIT
                </button>
                <button
                  className={orderType === "STOP" ? "active" : ""}
                  onClick={() => setOrderType("STOP")}
                  type="button"
                >
                  STOP
                </button>
              </div>

              <div className="ticketBody">
                <div className="field">
                  <label>Order Price</label>
                  <div className="fieldRow">
                    <input
                      type="number"
                      step="0.00001"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      disabled={orderType === "MARKET"}
                    />
                    <select value="Ask" onChange={() => {}} disabled>
                      <option>Ask</option>
                    </select>
                  </div>
                  <div className="mutedSmall" style={{ marginTop: 6 }}>
                    Absolute <span style={{ opacity: 0.55 }}>•</span> Ticks
                  </div>
                </div>

                <div className="field">
                  <label>Quantity</label>
                  <div className="fieldRow">
                    <input
                      type="number"
                      step="1"
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                    />
                    <div className="ticketUnits">Units</div>
                  </div>
                </div>

                <div className="field">
                  <label>AI Trade Size (%)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={aiRiskPct}
                    onChange={(e) => setAiRiskPct(Number(e.target.value))}
                  />
                  <div className="mutedSmall" style={{ marginTop: 6 }}>
                    This is the % the AI can use for position sizing when it triggers.
                  </div>
                </div>

                <div className="ticketSplit">
                  <div className="field">
                    <div className="fieldHead">
                      <label>Take Profit</label>
                      <input
                        type="checkbox"
                        checked={tpEnabled}
                        onChange={(e) => setTpEnabled(e.target.checked)}
                      />
                    </div>
                    <input
                      type="number"
                      step="0.00001"
                      value={tp}
                      onChange={(e) => setTp(Number(e.target.value))}
                      disabled={!tpEnabled}
                    />
                  </div>

                  <div className="field">
                    <div className="fieldHead">
                      <label>Stop Loss</label>
                      <input
                        type="checkbox"
                        checked={slEnabled}
                        onChange={(e) => setSlEnabled(e.target.checked)}
                      />
                    </div>
                    <input
                      type="number"
                      step="0.00001"
                      value={sl}
                      onChange={(e) => setSl(Number(e.target.value))}
                      disabled={!slEnabled}
                    />
                  </div>
                </div>

                {/* ✅ YOUR WORDING */}
                <button
                  className={side === "BUY" ? "ticketCTA buy" : "ticketCTA sell"}
                  onClick={setOrder}
                  type="button"
                >
                  SET ORDER ({orderType}) • {side} {symbol}
                </button>

                <div className="orderInfo">
                  <b>ORDER INFO</b>
                  <div className="orderInfoRow">
                    <span className="mutedSmall">Pip Value</span>
                    <span>$ 0.1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== BOTTOM DOCK ===== */}
          <div className="dock">
            <div className="dockTabs">
              <button
                className={dockTab === "positions" ? "active" : ""}
                onClick={() => setDockTab("positions")}
                type="button"
              >
                Positions <span className="tabCount">0</span>
              </button>
              <button
                className={dockTab === "orders" ? "active" : ""}
                onClick={() => setDockTab("orders")}
                type="button"
              >
                Set Orders <span className="tabCount">{setOrders.length}</span>
              </button>
              <button
                className={dockTab === "history" ? "active" : ""}
                onClick={() => setDockTab("history")}
                type="button"
              >
                History
              </button>
            </div>

            <div className="dockTableWrap">
              {dockTab === "orders" ? (
                <table className="dockTable">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Symbol</th>
                      <th>Side</th>
                      <th>Type</th>
                      <th>Level</th>
                      <th>Qty</th>
                      <th>AI %</th>
                      <th>TP</th>
                      <th>SL</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {setOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: 12, opacity: 0.75 }}>
                          No set orders yet.
                        </td>
                      </tr>
                    ) : (
                      setOrders.map((o) => (
                        <tr key={o.id}>
                          <td>{o.status}</td>
                          <td>{o.symbol}</td>
                          <td>{o.side}</td>
                          <td>{o.orderType}</td>
                          <td>{o.level == null ? "(market)" : fmt(o.level, 5)}</td>
                          <td>{o.qty.toLocaleString()}</td>
                          <td>{o.aiRiskPct}%</td>
                          <td>{o.tp == null ? "—" : fmt(o.tp, 5)}</td>
                          <td>{o.sl == null ? "—" : fmt(o.sl, 5)}</td>
                          <td>
                            <button
                              className="miniBtn"
                              type="button"
                              disabled={o.status !== "ARMED"}
                              onClick={() => cancelSetOrder(o.id)}
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: 12, opacity: 0.75 }}>
                  {dockTab === "positions"
                    ? "Positions panel ready (hook to paper/live positions later)."
                    : "History panel ready (hook to trade history later)."}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================== TAB: AI ================== */}
      {mainTab === "ai" && (
        <div className="cardLike">
          <h3 style={{ marginTop: 0 }}>AI Control + Voice</h3>
          <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
            This is where the AI talks + where it reads your Set Orders and executes them.
            We keep it separate so the terminal layout never gets smushed.
          </p>

          {/* If you have VoiceAI working, keep it. If not, remove this block. */}
          <div style={{ marginTop: 14 }}>
            <VoiceAI title="AutoProtect Voice" endpoint="/api/ai/chat" />
          </div>
        </div>
      )}

      {/* ================== TAB: MARKET EXPLAIN ================== */}
      {mainTab === "explain" && (
        <div className="cardLike">
          <h3 style={{ marginTop: 0 }}>Market Explain</h3>
          <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
            This panel is dedicated to explaining what the market is doing (trend, volatility, key levels, AI reasoning).
            If it gets too big, it lives here—separate from the terminal so nothing gets squeezed.
          </p>

          <div className="explainBox">
            <b>{symbol}</b>
            <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.6 }}>
              • Current price: <b>{fmt(last, 5)}</b>
              <br />• Bid/Ask spread: <b>{fmt(ask - bid, 5)}</b>
              <br />• Next step: connect AI reasoning + real market feed to replace demo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

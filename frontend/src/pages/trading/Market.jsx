import React, { useMemo, useState, useRef } from "react";
import "../../styles/terminal.css";

/* =========================================================
   CONFIG
========================================================= */
const DEFAULT_SYMBOL = "BINANCE:BTCUSDT";
const SYMBOLS = [
  "BINANCE:BTCUSDT",
  "BINANCE:ETHUSDT",
  "OANDA:EURUSD",
  "OANDA:GBPUSD",
];

/* =========================================================
   MAIN
========================================================= */
export default function Market() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [tf, setTf] = useState("15");

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelFloating, setPanelFloating] = useState(false);

  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("MARKET");

  const [qty, setQty] = useState("0.01");
  const [price, setPrice] = useState("");

  const [manualMode, setManualMode] = useState(true);

  const panelRef = useRef(null);
  const drag = useRef({ x: 0, y: 0 });

  /* =========================================================
     TRADINGVIEW
  ========================================================= */
  const tvSrc = useMemo(() => {
    const params = new URLSearchParams({
      symbol,
      interval: tf,
      theme: "dark",
      timezone: "Etc/UTC",
      withdateranges: "1",
      hide_side_toolbar: "0",
      allow_symbol_change: "0",
      details: "1",
      studies: "1",
      saveimage: "1",
      locale: "en",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, tf]);

  /* =========================================================
     PANEL DRAG
  ========================================================= */
  function startDrag(e) {
    if (!panelFloating) return;
    drag.current = {
      x: e.clientX - panelRef.current.offsetLeft,
      y: e.clientY - panelRef.current.offsetTop,
    };
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  }

  function onDrag(e) {
    panelRef.current.style.left = `${e.clientX - drag.current.x}px`;
    panelRef.current.style.top = `${e.clientY - drag.current.y}px`;
  }

  function stopDrag() {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
  }

  /* =========================================================
     ACTIONS
  ========================================================= */
  function togglePanel() {
    if (panelOpen) {
      setPanelOpen(false);
      setPanelFloating(false);
    } else {
      setPanelOpen(true);
    }
  }

  function toggleFloating() {
    if (!panelOpen) return;
    setPanelFloating((v) => !v);
  }

  function placeOrder() {
    alert(
      `${manualMode ? "MANUAL" : "AI"} ${side} ${qty} ${symbol} (${orderType})`
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="tvShell">
      {/* ================= TOP BAR ================= */}
      <header className="tvTopBar">
        <div className="tvBrand">
          <div className="tvBrandLogo" />
          <div className="tvBrandTxt">
            <b>AutoShield</b>
            <span>TRADING TERMINAL</span>
          </div>
        </div>

        <div className="tvControls">
          <select
            className="tvSelect"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {SYMBOLS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          {["1", "5", "15", "60", "D"].map((x) => (
            <button
              key={x}
              className={tf === x ? "tvPill active" : "tvPill"}
              onClick={() => setTf(x)}
            >
              {x}
            </button>
          ))}
        </div>

        <div className="tvActions">
          <button className="tvPrimary" onClick={togglePanel}>
            {side} / SELL
          </button>

          <button className="tvIconBtn" onClick={toggleFloating} title="Open Screen">
            ⤢
          </button>
        </div>
      </header>

      {/* ================= CHART ================= */}
      <main className="tvChartArea">
        <iframe
          title="TradingView"
          className="tvIframe"
          src={tvSrc}
          frameBorder="0"
          allow="fullscreen"
        />
      </main>

      {/* ================= BUY / SELL PANEL ================= */}
      {panelOpen && (
        <aside
          ref={panelRef}
          className={`tradePanel ${panelFloating ? "floating" : "docked"}`}
          onMouseDown={startDrag}
        >
          <header className="tradePanelHeader">
            <b>Order Panel</b>
            <span>{panelFloating ? "Floating" : "Docked"}</span>
          </header>

          <div className="tradePanelBody">
            <div className="row">
              <button
                className={side === "BUY" ? "active" : ""}
                onClick={() => setSide("BUY")}
              >
                BUY
              </button>
              <button
                className={side === "SELL" ? "active" : ""}
                onClick={() => setSide("SELL")}
              >
                SELL
              </button>
            </div>

            <div className="row">
              {["MARKET", "LIMIT", "STOP"].map((t) => (
                <button
                  key={t}
                  className={orderType === t ? "active" : ""}
                  onClick={() => setOrderType(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <label>
              Quantity
              <input value={qty} onChange={(e) => setQty(e.target.value)} />
            </label>

            {orderType !== "MARKET" && (
              <label>
                Price
                <input value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
            )}

            <label className="toggle">
              <input
                type="checkbox"
                checked={manualMode}
                onChange={() => setManualMode((v) => !v)}
              />
              Manual Trading
            </label>

            <button className="tvPrimary" onClick={placeOrder}>
              PLACE ORDER
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

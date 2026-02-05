// frontend/src/pages/trading/Market.jsx
import React, { useMemo, useState } from "react";
import "../../styles/terminal.css";

const DEFAULT_SYMBOL = "OANDA:EURUSD";
const SYMBOLS = [
  "OANDA:EURUSD",
  "OANDA:GBPUSD",
  "BITSTAMP:BTCUSD",
  "BINANCE:BTCUSDT",
  "BINANCE:ETHUSDT",
];

export default function Market() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [tf, setTf] = useState("D");

  const [rightTab, setRightTab] = useState("LIMIT");
  const [side, setSide] = useState("BUY");

  const [bid, setBid] = useState("1.11077");
  const [ask, setAsk] = useState("1.11088");

  const [orderPrice, setOrderPrice] = useState("1.11088");
  const [qty, setQty] = useState("1000");

  const [takeProfit, setTakeProfit] = useState(false);
  const [stopLoss, setStopLoss] = useState(false);

  const [bottomTab, setBottomTab] = useState("Positions");
  const [full, setFull] = useState(false);

  // 🔵 AutoproTech logo toggle
  const [showBrand, setShowBrand] = useState(false);

  const tvSrc = useMemo(() => {
    const interval =
      tf === "D" ? "D" : tf === "W" ? "W" : tf === "M" ? "M" : tf;
    const params = new URLSearchParams({
      symbol,
      interval,
      theme: "light",
      timezone: "Etc/UTC",
      details: "1",
      studies: "1",
      locale: "en",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, tf]);

  const shellCls = full ? "tvShell isFull" : "tvShell";

  return (
    <div className={shellCls}>
      {/* LEFT TOOLBAR */}
      <aside className="tvLeftBar">
        {["☰", "↖", "／", "⟂", "⌁", "T", "＋", "⌖"].map((t, i) => (
          <button key={i} className="tvToolBtn" type="button">
            {t}
          </button>
        ))}
      </aside>

      {/* TOP BAR */}
      <header className="tvTopBar">
        <div className="tvTopLeft">
          <div className="tvBrand">
            <div className="tvBrandLogo" />
            <div className="tvBrandTxt">
              <b>AutoShield</b>
              <span>TRADING TERMINAL</span>
            </div>
          </div>

          <div className="tvSymRow">
            <select
              className="tvSelect"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {SYMBOLS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <div className="tvTfRow">
              {["1", "5", "15", "60", "D", "W", "M"].map((x) => (
                <button
                  key={x}
                  className={tf === x ? "tvPill active" : "tvPill"}
                  onClick={() => setTf(x)}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="tvTopRight">
          <button className="tvIconBtn" onClick={() => setFull((v) => !v)}>
            {full ? "🗗" : "🗖"}
          </button>
        </div>
      </header>

      {/* CHART */}
      <main className="tvChartArea">
        <iframe
          title="TradingView"
          className="tvIframe"
          src={tvSrc}
          frameBorder="0"
          allow="fullscreen"
        />

        {/* BOTTOM PANEL */}
        <section className="tvBottom">
          <div className="tvBottomTabs">
            {["Positions", "Orders", "History"].map((t) => (
              <button
                key={t}
                className={bottomTab === t ? "tvTab active" : "tvTab"}
                onClick={() => setBottomTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="tvBottomBody">
            <div className="tvEmpty">
              {bottomTab} panel ready (backend hook later)
            </div>
          </div>
        </section>
      </main>

      {/* RIGHT ORDER PANEL */}
      <aside className="tvRight">
        <button className="tvPrimary">
          {side} {qty} {symbol}
        </button>
      </aside>

      {/* 🔵 AUTOPROTECH BRAND (REPLACES T7) */}
      <div
        className="autoproTechBrand"
        onClick={() => setShowBrand((v) => !v)}
      >
        <div className="brandCircle">⚙️</div>
        {showBrand && <span className="brandText">AutoproTech</span>}
      </div>
    </div>
  );
}

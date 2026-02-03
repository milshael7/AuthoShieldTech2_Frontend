// frontend/src/pages/trading/Market.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/trading.css";

const DEFAULT_SYMBOL = "OANDA:EURUSD"; // matches your reference screenshot

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
  const [rightTab, setRightTab] = useState("LIMIT"); // MARKET | LIMIT | STOP
  const [side, setSide] = useState("BUY"); // BUY | SELL
  const [orderPrice, setOrderPrice] = useState("1.11088");
  const [qty, setQty] = useState("1000");
  const [takeProfit, setTakeProfit] = useState(false);
  const [stopLoss, setStopLoss] = useState(false);
  const [tp, setTp] = useState({ pips: "75", price: "1.11837", usd: "7.50", pct: "0.01" });
  const [sl, setSl] = useState({ pips: "25", price: "1.10837", usd: "2.50", pct: "0.00" });

  const [bottomTab, setBottomTab] = useState("Positions"); // Positions | Orders | History | Account Summary | Trading Journal
  const [full, setFull] = useState(false);

  // --- “real chart tools” approach:
  // Use TradingView embed so the chart toolbar/draw tools actually work (no fake buttons).
  const tvSrc = useMemo(() => {
    const interval =
      tf === "D" ? "D" : tf === "W" ? "W" : tf === "M" ? "M" : tf; // 1,5,15,60 etc.
    const params = new URLSearchParams({
      symbol,
      interval,
      theme: "light",
      style: "1",
      timezone: "Etc/UTC",
      withdateranges: "1",
      hide_side_toolbar: "0",
      allow_symbol_change: "0",
      saveimage: "1",
      details: "1",
      studies: "1",
      calendar: "0",
      hotlist: "0",
      locale: "en",
      toolbarbg: "#f3f4f6",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, tf]);

  // keep iframe height in sync with layout
  const shellCls = full ? "tvShell isFull" : "tvShell";

  const placeOrder = () => {
    // For now this is “paper UI” — backend hook comes later.
    alert(
      `${side} ${qty} ${symbol} @ ${orderPrice} (${rightTab})\nTP: ${
        takeProfit ? `${tp.price}` : "OFF"
      }\nSL: ${stopLoss ? `${sl.price}` : "OFF"}`
    );
  };

  return (
    <div className={shellCls}>
      {/* LEFT TOOLBAR (like screenshot) */}
      <aside className="tvLeftBar" aria-label="tools">
        {[
          "☰",
          "↖",
          "／",
          "⟂",
          "⌁",
          "T",
          "⟐",
          "＋",
          "⌖",
          "⤢",
          "⌫",
          "👁",
        ].map((t, i) => (
          <button key={i} className="tvToolBtn" type="button" title="Tool">
            {t}
          </button>
        ))}
      </aside>

      {/* TOP TOOLBAR */}
      <header className="tvTopBar">
        <div className="tvTopLeft">
          <div className="tvSymRow">
            <select
              className="tvSelect"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="tvTfRow">
              {["1", "5", "15", "60", "D", "W", "M"].map((x) => (
                <button
                  key={x}
                  type="button"
                  className={tf === x ? "tvPill active" : "tvPill"}
                  onClick={() => setTf(x)}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          <div className="tvMiniTools">
            {["＋", "↶", "↷", "⤓", "⚙"].map((t, i) => (
              <button key={i} className="tvIconBtn" type="button" title="Action">
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="tvTopRight">
          <button className="tvPrimary" type="button">
            Publish
          </button>
          <button
            className="tvIconBtn"
            type="button"
            title="Fullscreen"
            onClick={() => setFull((v) => !v)}
          >
            {full ? "🗗" : "🗖"}
          </button>
        </div>
      </header>

      {/* MAIN CENTER CHART */}
      <main className="tvChartArea">
        <div className="tvChartFrame">
          <iframe
            title="TradingView Chart"
            className="tvIframe"
            src={tvSrc}
            frameBorder="0"
            allow="clipboard-write; fullscreen"
          />
        </div>

        {/* BOTTOM PANEL (tabs like screenshot) */}
        <section className="tvBottom">
          <div className="tvBottomTabs">
            {["Positions", "Orders", "History", "Account Summary", "Trading Journal"].map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  className={bottomTab === t ? "tvTab active" : "tvTab"}
                  onClick={() => setBottomTab(t)}
                >
                  {t}
                </button>
              )
            )}
          </div>

          <div className="tvBottomBody">
            {bottomTab === "Positions" && (
              <table className="tvTable">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Qty</th>
                    <th>Avg Fill</th>
                    <th>Take Profit</th>
                    <th>Stop Loss</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>BITSTAMP:BTCUSD</td>
                    <td className="buy">Buy</td>
                    <td>1</td>
                    <td>8,174.85</td>
                    <td>—</td>
                    <td>—</td>
                    <td className="neg">-283.57</td>
                  </tr>
                </tbody>
              </table>
            )}

            {bottomTab !== "Positions" && (
              <div className="tvEmpty">
                {bottomTab} will be wired to backend later.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* RIGHT ORDER PANEL */}
      <aside className="tvRight">
        <div className="tvRightHead">
          <div>
            <div className="tvRightTitle">{symbol}</div>
            <div className="tvRightSub">PAPER TRADING</div>
          </div>
          <div className="tvRightButtons">
            <button
              type="button"
              className={side === "SELL" ? "tvSide sell active" : "tvSide sell"}
              onClick={() => setSide("SELL")}
            >
              SELL
            </button>
            <button
              type="button"
              className={side === "BUY" ? "tvSide buy active" : "tvSide buy"}
              onClick={() => setSide("BUY")}
            >
              BUY
            </button>
          </div>
        </div>

        <div className="tvOrderTabs">
          {["MARKET", "LIMIT", "STOP"].map((t) => (
            <button
              key={t}
              type="button"
              className={rightTab === t ? "tvTab2 active" : "tvTab2"}
              onClick={() => setRightTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="tvForm">
          <div className="tvField">
            <label>Order Price</label>
            <div className="tvRow2">
              <input
                value={orderPrice}
                onChange={(e) => setOrderPrice(e.target.value)}
                inputMode="decimal"
              />
              <select className="tvSelectSmall">
                <option>Ask</option>
                <option>Bid</option>
              </select>
            </div>
            <div className="tvHint">Absolute / Ticks</div>
          </div>

          <div className="tvField">
            <label>Quantity</label>
            <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" />
            <div className="tvHint">Units</div>
          </div>

          <div className="tvSplit">
            <div className="tvBox">
              <label className="tvCheck">
                <input
                  type="checkbox"
                  checked={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.checked)}
                />
                Take Profit
              </label>

              <div className={takeProfit ? "tvGrid2" : "tvGrid2 disabled"}>
                <div>
                  <span>Pips</span>
                  <input value={tp.pips} onChange={(e) => setTp((p) => ({ ...p, pips: e.target.value }))} />
                </div>
                <div>
                  <span>Price</span>
                  <input value={tp.price} onChange={(e) => setTp((p) => ({ ...p, price: e.target.value }))} />
                </div>
                <div>
                  <span>$</span>
                  <input value={tp.usd} onChange={(e) => setTp((p) => ({ ...p, usd: e.target.value }))} />
                </div>
                <div>
                  <span>%</span>
                  <input value={tp.pct} onChange={(e) => setTp((p) => ({ ...p, pct: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="tvBox">
              <label className="tvCheck">
                <input
                  type="checkbox"
                  checked={stopLoss}
                  onChange={(e) => setStopLoss(e.target.checked)}
                />
                Stop Loss
              </label>

              <div className={stopLoss ? "tvGrid2" : "tvGrid2 disabled"}>
                <div>
                  <span>Pips</span>
                  <input value={sl.pips} onChange={(e) => setSl((p) => ({ ...p, pips: e.target.value }))} />
                </div>
                <div>
                  <span>Price</span>
                  <input value={sl.price} onChange={(e) => setSl((p) => ({ ...p, price: e.target.value }))} />
                </div>
                <div>
                  <span>$</span>
                  <input value={sl.usd} onChange={(e) => setSl((p) => ({ ...p, usd: e.target.value }))} />
                </div>
                <div>
                  <span>%</span>
                  <input value={sl.pct} onChange={(e) => setSl((p) => ({ ...p, pct: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          <button className="tvBuyBar" type="button" onClick={placeOrder}>
            {side} {qty} {symbol} @ {orderPrice} ({rightTab})
          </button>

          <div className="tvOrderInfo">
            <b>ORDER INFO</b>
            <div className="tvInfoRow">
              <span>Pip Value</span>
              <span>$ 0.1</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

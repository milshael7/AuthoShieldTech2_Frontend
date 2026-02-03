// frontend/src/pages/trading/Market.jsx
import React, { useMemo, useState } from "react";
import "../../styles/terminal.css";

const DEFAULT_SYMBOL = "OANDA:EURUSD";
const SYMBOLS = ["OANDA:EURUSD","OANDA:GBPUSD","BITSTAMP:BTCUSD","BINANCE:BTCUSDT","BINANCE:ETHUSDT"];

export default function Market() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [tf, setTf] = useState("D");

  const [rightTab, setRightTab] = useState("LIMIT");
  const [side, setSide] = useState("BUY");

  // mock prices
  const [bid, setBid] = useState("1.11077");
  const [ask, setAsk] = useState("1.11088");

  const [orderPrice, setOrderPrice] = useState("1.11088");
  const [qty, setQty] = useState("1000");

  const [takeProfit, setTakeProfit] = useState(false);
  const [stopLoss, setStopLoss] = useState(false);
  const [tp, setTp] = useState({ pips: "75", price: "1.11837", usd: "7.50", pct: "0.01" });
  const [sl, setSl] = useState({ pips: "25", price: "1.10837", usd: "2.50", pct: "0.00" });

  const [bottomTab, setBottomTab] = useState("Positions");
  const [full, setFull] = useState(false);

  const tvSrc = useMemo(() => {
    const interval = tf === "D" ? "D" : tf === "W" ? "W" : tf === "M" ? "M" : tf;
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

  const shellCls = full ? "tvShell isFull" : "tvShell";

  const syncOrderPrice = (s) => {
    if (s === "BUY") setOrderPrice(ask);
    else setOrderPrice(bid);
  };

  const tick = () => {
    const a = (parseFloat(ask) + (Math.random() - 0.5) * 0.0002).toFixed(5);
    const b = (parseFloat(bid) + (Math.random() - 0.5) * 0.0002).toFixed(5);
    setAsk(a);
    setBid(b);
    setOrderPrice(side === "BUY" ? a : b);
  };

  const placeOrder = () => {
    alert(
      `${side} ${qty} ${symbol} @ ${orderPrice} (${rightTab})\nBid: ${bid}  Ask: ${ask}\nTP: ${
        takeProfit ? tp.price : "OFF"
      }\nSL: ${stopLoss ? sl.price : "OFF"}`
    );
  };

  return (
    <div className={shellCls}>
      {/* LEFT TOOLBAR */}
      <aside className="tvLeftBar" aria-label="tools">
        {["☰", "↖", "／", "⟂", "⌁", "T", "⟐", "＋", "⌖", "⤢", "⌫", "👁"].map((t, i) => (
          <button key={i} className="tvToolBtn" type="button" title="Tool">
            {t}
          </button>
        ))}
      </aside>

      {/* TOP BAR */}
      <header className="tvTopBar">
        <div className="tvTopLeft">
          <div className="tvBrand">
            <div className="tvBrandLogo" aria-label="AutoShield Logo" />
            <div className="tvBrandTxt">
              <b>AutoShield</b>
              <span>TRADING TERMINAL</span>
            </div>
          </div>

          <div className="tvSymRow">
            <select className="tvSelect" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
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
        </div>

        <div className="tvTopRight">
          <button className="tvPrimary" type="button">Publish</button>
          <button className="tvIconBtn" type="button" onClick={tick} title="Mock Tick">▶</button>
          <button className="tvIconBtn" type="button" title="Fullscreen" onClick={() => setFull((v) => !v)}>
            {full ? "🗗" : "🗖"}
          </button>
        </div>
      </header>

      {/* CENTER */}
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

        {/* BOTTOM PANEL */}
        <section className="tvBottom">
          <div className="tvBottomTabs">
            {["Positions", "Orders", "History", "Account Summary", "Trading Journal"].map((t) => (
              <button
                key={t}
                type="button"
                className={bottomTab === t ? "tvTab active" : "tvTab"}
                onClick={() => setBottomTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="tvBottomBody">
            {bottomTab === "Positions" ? (
              <table className="tvTable">
                <thead>
                  <tr>
                    <th>Symbol</th><th>Side</th><th>Qty</th><th>Avg Fill</th><th>Take Profit</th><th>Stop Loss</th><th>Profit</th>
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
            ) : (
              <div className="tvEmpty">{bottomTab} will be wired to backend later.</div>
            )}
          </div>
        </section>
      </main>

      {/* RIGHT DOCKED PANEL */}
      <aside className="tvRight">
        {renderOrderPanel({
          symbol, rightTab, setRightTab,
          side, setSide, bid, ask,
          orderPrice, setOrderPrice,
          qty, setQty,
          takeProfit, setTakeProfit,
          stopLoss, setStopLoss,
          tp, setTp, sl, setSl,
          placeOrder, syncOrderPrice
        })}
      </aside>
    </div>
  );
}

function renderOrderPanel(props) {
  const {
    symbol, rightTab, setRightTab,
    side, setSide, bid, ask,
    orderPrice, setOrderPrice,
    qty, setQty,
    takeProfit, setTakeProfit,
    stopLoss, setStopLoss,
    tp, setTp, sl, setSl,
    placeOrder, syncOrderPrice
  } = props;

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 900 }}>{symbol}</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>PAPER TRADING</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <button type="button" className={side === "SELL" ? "tvPill active" : "tvPill"} onClick={() => { setSide("SELL"); syncOrderPrice("SELL"); }}>
          SELL {bid}
        </button>
        <button type="button" className={side === "BUY" ? "tvPill active" : "tvPill"} onClick={() => { setSide("BUY"); syncOrderPrice("BUY"); }}>
          BUY {ask}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 10, flexWrap: "wrap" }}>
        {["MARKET", "LIMIT", "STOP"].map((t) => (
          <button key={t} type="button" className={rightTab === t ? "tvTab active" : "tvTab"} onClick={() => setRightTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Order Price</div>
          <input value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} inputMode="decimal" />
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Quantity</div>
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: 10 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={takeProfit} onChange={(e) => setTakeProfit(e.target.checked)} />
              <span>Take Profit</span>
            </label>
            <div style={{ opacity: takeProfit ? 1 : 0.45, pointerEvents: takeProfit ? "auto" : "none", marginTop: 8 }}>
              <input value={tp.price} onChange={(e) => setTp((p) => ({ ...p, price: e.target.value }))} />
            </div>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: 10 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={stopLoss} onChange={(e) => setStopLoss(e.target.checked)} />
              <span>Stop Loss</span>
            </label>
            <div style={{ opacity: stopLoss ? 1 : 0.45, pointerEvents: stopLoss ? "auto" : "none", marginTop: 8 }}>
              <input value={sl.price} onChange={(e) => setSl((p) => ({ ...p, price: e.target.value }))} />
            </div>
          </div>
        </div>

        <button className="tvPrimary" type="button" onClick={placeOrder}>
          {side} {qty} {symbol} @ {orderPrice} ({rightTab})
        </button>
      </div>
    </>
  );
}

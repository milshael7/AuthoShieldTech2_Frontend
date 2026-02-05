// frontend/src/pages/trading/Market.jsx
import React, { useMemo, useRef, useState } from "react";
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
  // ---------------- CORE STATE ----------------
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [tf, setTf] = useState("D");
  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("LIMIT");

  // ---------------- PANEL STATE ----------------
  // closed | docked | floating
  const [panelState, setPanelState] = useState("closed");

  // ---------------- FLOATING POSITION ----------------
  const panelRef = useRef(null);
  const dragRef = useRef({ x: 0, y: 0, dragging: false });
  const [pos, setPos] = useState({ x: 120, y: 120 });

  // ---------------- PRICE MOCK ----------------
  const [bid, setBid] = useState("1.11077");
  const [ask, setAsk] = useState("1.11088");
  const [orderPrice, setOrderPrice] = useState("1.11088");
  const [qty, setQty] = useState("1000");

  // ---------------- TP / SL ----------------
  const [takeProfit, setTakeProfit] = useState(false);
  const [stopLoss, setStopLoss] = useState(false);
  const [tp, setTp] = useState("1.11837");
  const [sl, setSl] = useState("1.10837");

  // ---------------- BOTTOM PANEL ----------------
  const [bottomTab, setBottomTab] = useState("Positions");

  // ---------------- TRADINGVIEW ----------------
  const tvSrc = useMemo(() => {
    const params = new URLSearchParams({
      symbol,
      interval: tf,
      theme: "light",
      style: "1",
      timezone: "Etc/UTC",
      details: "1",
      studies: "1",
      locale: "en",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, tf]);

  // ---------------- HELPERS ----------------
  function syncPrice(s) {
    setOrderPrice(s === "BUY" ? ask : bid);
  }

  function mockTick() {
    const a = (parseFloat(ask) + (Math.random() - 0.5) * 0.0002).toFixed(5);
    const b = (parseFloat(bid) + (Math.random() - 0.5) * 0.0002).toFixed(5);
    setAsk(a);
    setBid(b);
    setOrderPrice(side === "BUY" ? a : b);
  }

  function toggleDock() {
    setPanelState((p) => (p === "closed" ? "docked" : "closed"));
  }

  function floatPanel() {
    setPanelState("floating");
  }

  function placeOrder() {
    alert(
      `${side} ${qty} ${symbol}\n` +
      `Type: ${orderType}\n` +
      `Price: ${orderPrice}\n` +
      `TP: ${takeProfit ? tp : "OFF"} | SL: ${stopLoss ? sl : "OFF"}`
    );
  }

  // ---------------- DRAG HANDLERS ----------------
  function onDragStart(e) {
    dragRef.current = {
      dragging: true,
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
  }

  function onDragMove(e) {
    if (!dragRef.current.dragging) return;
    setPos({
      x: e.clientX - dragRef.current.x,
      y: e.clientY - dragRef.current.y,
    });
  }

  function onDragEnd() {
    dragRef.current.dragging = false;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
  }

  // ---------------- RENDER ----------------
  return (
    <div className="terminalRoot">
      <div className="tvShell">
        {/* LEFT TOOLBAR */}
        <aside className="tvLeftBar">
          {["☰","↖","／","⟂","⌁","T","⟐","＋","⌖","⤢","⌫","👁"].map((t,i)=>(
            <button key={i} className="tvToolBtn">{t}</button>
          ))}
        </aside>

        {/* TOP BAR */}
        <header className="tvTopBar">
          <div className="tvTopLeft">
            <div className="tvBrand">
              <div className="tvBrandLogo" />
              <div className="tvBrandTxt">
                <b>AutoShield Tech</b>
                <span>TRADING TERMINAL</span>
              </div>
            </div>

            <select className="tvSelect" value={symbol} onChange={e=>setSymbol(e.target.value)}>
              {SYMBOLS.map(s=>(
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div className="tvTfRow">
              {["1","5","15","60","D","W","M"].map(x=>(
                <button
                  key={x}
                  className={tf===x?"tvPill active":"tvPill"}
                  onClick={()=>setTf(x)}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          <div className="tvTopRight">
            <button className="tvPrimary" onClick={toggleDock}>
              {panelState === "closed" ? "Trade" : "Close"}
            </button>
            <button className="tvIconBtn" onClick={mockTick}>▶</button>
            {panelState !== "closed" && (
              <button className="tvIconBtn" onClick={floatPanel}>⤢</button>
            )}
          </div>
        </header>

        {/* CHART */}
        <main className="tvChartArea">
          <iframe
            className="tvIframe"
            title="chart"
            src={tvSrc}
            frameBorder="0"
            allow="fullscreen"
          />

          {/* BOTTOM PANEL */}
          <section className="tvBottom">
            <div className="tvBottomTabs">
              {["Positions","Orders","History","Account Summary","Trading Journal"].map(t=>(
                <button
                  key={t}
                  className={bottomTab===t?"tvTab active":"tvTab"}
                  onClick={()=>setBottomTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="tvBottomBody">
              {bottomTab} panel (wired later)
            </div>
          </section>
        </main>

        {/* ORDER PANEL */}
        {panelState !== "closed" && (
          <aside
            ref={panelRef}
            className={`tvRight ${panelState==="floating"?"floating":""}`}
            style={panelState==="floating"?{left:pos.x, top:pos.y, position:"absolute"}:{}}
          >
            {panelState === "floating" && (
              <div className="panelDragHandle" onMouseDown={onDragStart}>
                Drag
              </div>
            )}

            <h3>{symbol}</h3>

            <div className="orderSide">
              <button onClick={()=>{setSide("SELL");syncPrice("SELL");}}>
                SELL {bid}
              </button>
              <button onClick={()=>{setSide("BUY");syncPrice("BUY");}}>
                BUY {ask}
              </button>
            </div>

            <div className="orderTypes">
              {["MARKET","LIMIT","STOP"].map(t=>(
                <button key={t} onClick={()=>setOrderType(t)}>
                  {t}
                </button>
              ))}
            </div>

            <input value={orderPrice} onChange={e=>setOrderPrice(e.target.value)} />
            <input value={qty} onChange={e=>setQty(e.target.value)} />

            <label>
              <input type="checkbox" checked={takeProfit} onChange={e=>setTakeProfit(e.target.checked)} />
              Take Profit
            </label>
            {takeProfit && <input value={tp} onChange={e=>setTp(e.target.value)} />}

            <label>
              <input type="checkbox" checked={stopLoss} onChange={e=>setStopLoss(e.target.checked)} />
              Stop Loss
            </label>
            {stopLoss && <input value={sl} onChange={e=>setSl(e.target.value)} />}

            <button className="tvPrimary" onClick={placeOrder}>
              {side} {qty}
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}

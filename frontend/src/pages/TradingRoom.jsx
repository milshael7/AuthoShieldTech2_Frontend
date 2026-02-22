// frontend/src/pages/TradingRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";

const API_BASE = "/api/trading";

export default function TradingRoom() {

  /* ================= STATE ================= */

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const candleSeries = useRef(null);

  const [snapshot, setSnapshot] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelDocked, setPanelDocked] = useState(true);
  const [panelWidth, setPanelWidth] = useState(380);
  const [side, setSide] = useState("BUY");

  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 200, y: 100 });

  /* ================= SNAPSHOT LOAD ================= */

  async function loadSnapshot() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/snapshot`);
      const data = await res.json();
      if (data.ok) setSnapshot(data);
    } catch (e) {
      console.error("Trading snapshot error", e);
    }
  }

  useEffect(() => {
    loadSnapshot();
    const i = setInterval(loadSnapshot, 4000);
    return () => clearInterval(i);
  }, []);

  /* ================= CHART INIT ================= */

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = createChart(chartRef.current, {
      layout: {
        background: { color: "#111827" },
        textColor: "#eaf1ff",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      width: chartRef.current.clientWidth,
      height: chartRef.current.clientHeight,
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)" },
    });

    candleSeries.current = chartInstance.current.addCandlestickSeries();

    window.addEventListener("resize", () => {
      chartInstance.current.applyOptions({
        width: chartRef.current.clientWidth,
        height: chartRef.current.clientHeight,
      });
    });

  }, []);

  /* ================= PANEL TOGGLE ================= */

  function togglePanel(type) {
    setSide(type);
    if (!panelOpen) {
      setPanelOpen(true);
      setPanelDocked(true);
    } else {
      if (panelDocked) {
        setPanelOpen(false);
      } else {
        setPanelDocked(true);
      }
    }
  }

  /* ================= DRAG ================= */

  function onDragStart(e) {
    setDragging(true);
  }

  function onDrag(e) {
    if (!dragging) return;
    setPosition({
      x: e.clientX - 150,
      y: e.clientY - 20,
    });
  }

  function onDragEnd() {
    setDragging(false);
    setPanelDocked(false);
  }

  useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", onDragEnd);
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", onDragEnd);
    };
  }, [dragging]);

  /* ================= RENDER ================= */

  return (
    <div className="trading-root">

      {/* ================= TOP BAR ================= */}

      <div className="trading-topbar">
        <div className="symbol">BTCUSDT</div>

        <div className="controls">
          <button className="buyBtn" onClick={() => togglePanel("BUY")}>BUY</button>
          <button className="sellBtn" onClick={() => togglePanel("SELL")}>SELL</button>
        </div>
      </div>

      {/* ================= MAIN ================= */}

      <div className="trading-body">

        <div className="left-rail">
          <div className="rail-item">✏</div>
          <div className="rail-item">📐</div>
          <div className="rail-item">📊</div>
        </div>

        <div
          className={`chart-area ${panelOpen && panelDocked ? "withPanel" : ""}`}
          style={{
            marginRight:
              panelOpen && panelDocked ? panelWidth : 0,
          }}
        >
          <div ref={chartRef} className="chart-surface" />
        </div>

        {/* ================= PANEL ================= */}

        {panelOpen && panelDocked && (
          <div
            className="trade-panel docked"
            style={{ width: panelWidth }}
          >
            <PanelContent
              side={side}
              snapshot={snapshot}
              onDragStart={onDragStart}
              resizable
              setWidth={setPanelWidth}
            />
          </div>
        )}

        {panelOpen && !panelDocked && (
          <div
            className="trade-panel floating"
            style={{
              left: position.x,
              top: position.y,
              width: panelWidth,
            }}
          >
            <PanelContent
              side={side}
              snapshot={snapshot}
              onDragStart={onDragStart}
              resizable
              setWidth={setPanelWidth}
            />
          </div>
        )}

      </div>
    </div>
  );
}

/* ================= PANEL CONTENT ================= */

function PanelContent({ side, snapshot, onDragStart, resizable, setWidth }) {

  return (
    <>
      <div className="panel-header" onMouseDown={onDragStart}>
        {side} ORDER
      </div>

      <div className="panel-body">

        <div className="input-group">
          <label>Quantity</label>
          <input type="number" placeholder="0.01" />
        </div>

        <div className="input-group">
          <label>Order Type</label>
          <select>
            <option>Market</option>
            <option>Limit</option>
          </select>
        </div>

        <div className="ai-block">
          <div>AI Confidence: {snapshot?.ai?.stats?.winRate?.toFixed?.(2) || "—"}</div>
          <div>Risk Multiplier: {snapshot?.risk?.riskMultiplier?.toFixed?.(2) || "—"}</div>
        </div>

        <button className={`confirmBtn ${side === "BUY" ? "buy" : "sell"}`}>
          Confirm {side}
        </button>
      </div>

      {resizable && (
        <div
          className="resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = parseInt(
              document.querySelector(".trade-panel").offsetWidth,
              10
            );

            function onMove(ev) {
              const newWidth = startWidth - (ev.clientX - startX);
              setWidth(Math.max(320, Math.min(newWidth, 600)));
            }

            function onUp() {
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            }

            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        />
      )}
    </>
  );
}

// frontend/src/components/TVChart.jsx
import React, { useEffect, useMemo, useRef } from "react";

/**
 * TVChart.jsx (DROP-IN)
 * Goals:
 * - Always show left tool rail (desktop + mobile)
 * - Never get clipped/hidden behind panels
 * - Keep chart responsive & stable
 *
 * Note:
 * This is a UI shell + canvas chart placeholder if your real chart lib is different.
 * If you already use a chart library inside TVChart, KEEP your library logic,
 * but KEEP the wrapper + tool rail styles exactly as-is.
 */

export default function TVChart({ candles = [], height = 520, symbol = "BTCUSD", last = 0 }) {
  const canvasRef = useRef(null);

  const safeHeight = Math.max(260, Number(height) || 520);

  const lastPrice = useMemo(() => {
    const x = Number(last);
    return Number.isFinite(x) ? x : 0;
  }, [last]);

  useEffect(() => {
    // Simple placeholder draw so you always SEE something while wiring up real TV chart logic.
    // If you already render a real chart, you can delete this draw section.
    const c = canvasRef.current;
    if (!c) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = c.parentElement?.clientWidth || 800;
    const h = safeHeight;

    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = "100%";
    c.style.height = `${h}px`;

    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, w, h);

    // grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = (h / 8) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const x = (w / 12) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // small “price line”
    const yLine = h * 0.62;
    ctx.strokeStyle = "rgba(122,167,255,0.55)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, yLine);
    ctx.lineTo(w, yLine);
    ctx.stroke();
    ctx.setLineDash([]);

    // label box
    const label = `${symbol}  ${lastPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(w - 210, yLine - 16, 200, 28);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.strokeRect(w - 210, yLine - 16, 200, 28);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(label, w - 200, yLine + 3);
  }, [candles, safeHeight, symbol, lastPrice]);

  return (
    <div style={wrap}>
      {/* TOOL RAIL (always visible) */}
      <div style={toolsRail} aria-hidden="true">
        <ToolBtn label="□" title="Select" />
        <ToolBtn label="+" title="Zoom in" />
        <ToolBtn label="↔" title="Pan" />
        <ToolBtn label="⟲" title="Undo" />
        <ToolBtn label="L" title="Lock" />
      </div>

      {/* CHART AREA */}
      <div style={chartArea}>
        <canvas ref={canvasRef} />
        <div style={tvWatermark}>TV</div>
      </div>
    </div>
  );
}

function ToolBtn({ label, title }) {
  return (
    <div style={toolBtn} title={title}>
      {label}
    </div>
  );
}

/* ---------- styles ---------- */

const wrap = {
  position: "relative",
  width: "100%",
  minWidth: 0,

  // IMPORTANT: do NOT clip the tool rail
  overflow: "visible",

  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.22)",
  boxShadow: "0 10px 22px rgba(0,0,0,.28)",
};

const chartArea = {
  position: "relative",
  borderRadius: 16,
  overflow: "hidden", // clip ONLY the canvas, NOT the tool rail (rail sits outside)
};

const toolsRail = {
  position: "absolute",
  left: 14,
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 50,

  display: "flex",
  flexDirection: "column",
  gap: 10,

  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.20)",
  backdropFilter: "blur(8px)",

  // ensures it stays clickable above canvas
  pointerEvents: "auto",
};

const toolBtn = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
  fontWeight: 900,
  userSelect: "none",
};

const tvWatermark = {
  position: "absolute",
  left: 12,
  bottom: 10,
  zIndex: 10,
  fontWeight: 900,
  fontSize: 18,
  opacity: 0.7,
  padding: "6px 10px",
  borderRadius: 12,
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.10)",
};

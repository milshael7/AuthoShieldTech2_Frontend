// ==========================================================
// 🔒 AUTOSHIELD VISION — v5.0 (TOUCH-HARDENED)
// FILE: TVChart.jsx - SYNCED WITH BACKEND v32.5
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function fmtPrice(n, digits = 2) {
  const x = Number(n);
  return Number.isFinite(x) ? x.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits }) : "—";
}

export default function TVChart({ candles = [], height = 400, symbol = "BTCUSDT", last = 0 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 400 });
  
  // View State
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [cross, setCross] = useState(null);
  const [tool, setTool] = useState("crosshair");

  // 1. DATA SLICING (Optimized for 7-year-old Phone Memory)
  const view = useMemo(() => {
    const arr = Array.isArray(candles) ? candles : [];
    const maxVisible = Math.floor(150 / zoom); 
    return arr.slice(-maxVisible);
  }, [candles, zoom]);

  // 2. ADAPTIVE RESIZE
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: height });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  // 3. TOUCH & MOUSE LOGIC (HARDENED)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    let isDown = false;
    let startX = 0;
    let startPan = 0;

    const getPos = (e) => {
      const rect = c.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top, rawX: clientX };
    };

    const onStart = (e) => {
      const pos = getPos(e);
      if (tool === "pan" || e.touches) {
        isDown = true;
        startX = pos.rawX;
        startPan = panX;
      }
    };

    const onMove = (e) => {
      const pos = getPos(e);
      setCross({ x: pos.x, y: pos.y });
      if (!isDown) return;
      setPanX(startPan + (pos.rawX - startX));
    };

    const onEnd = () => { isDown = false; };

    c.addEventListener("mousedown", onStart);
    c.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);

    return () => {
      c.removeEventListener("mousedown", onStart);
      c.removeEventListener("touchstart", onStart);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchend", onEnd);
    };
  }, [tool, panX]);

  // 4. THE RENDER ENGINE
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    ctx.scale(dpr, dpr);

    // Layout constants
    const rightPad = 70;
    const bottomPad = 30;
    const plotW = size.w - rightPad;
    const plotH = size.h - bottomPad;

    // Calc Bounds
    let min = Infinity, max = -Infinity;
    view.forEach(k => {
      max = Math.max(max, k.high);
      min = Math.min(min, k.low);
    });
    if (last > 0) { max = Math.max(max, last); min = Math.min(min, last); }
    
    const range = (max - min) || 1;
    const buffer = range * 0.15;
    const top = max + buffer;
    const bot = min - buffer;

    const getY = (p) => ((top - p) / (top - bot)) * plotH;

    // Draw BG
    ctx.fillStyle = "#0a0e14";
    ctx.fillRect(0, 0, size.w, size.h);

    // Draw Grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for(let i=1; i<5; i++) {
        const y = (plotH / 5) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plotW, y); ctx.stroke();
    }

    // Draw Candles
    const candleW = Math.max(2, (plotW / view.length) * 0.8);
    const spacing = plotW / view.length;

    view.forEach((k, i) => {
      const x = (i * spacing) + panX;
      if (x < -20 || x > plotW + 20) return; // Culling for performance

      const isUp = k.close >= k.open;
      ctx.strokeStyle = isUp ? "#22c55e" : "#ef4444";
      ctx.fillStyle = isUp ? "#22c55e" : "#ef4444";

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, getY(k.high));
      ctx.lineTo(x, getY(k.low));
      ctx.stroke();

      // Body
      const yOpen = getY(k.open);
      const yClose = getY(k.close);
      ctx.fillRect(x - candleW/2, Math.min(yOpen, yClose), candleW, Math.max(1, Math.abs(yOpen - yClose)));
    });

    // Last Price Line
    if (last > 0) {
      const ly = getY(last);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(plotW, ly); ctx.stroke();
      ctx.setLineDash([]);
      
      // Price Label
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(plotW, ly - 10, rightPad, 20);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.fillText(last.toFixed(2), plotW + 5, ly + 4);
    }

    // Crosshair
    if (cross && cross.x < plotW) {
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath(); ctx.moveTo(cross.x, 0); ctx.lineTo(cross.x, plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cross.y); ctx.lineTo(plotW, cross.y); ctx.stroke();
    }

  }, [size, view, last, panX, cross]);

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", background: "#0a0e14", borderRadius: "12px", overflow: "hidden", border: "1px solid #1e293b" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, display: "flex", gap: "5px" }}>
         <button onClick={() => setTool(tool === "pan" ? "crosshair" : "pan")} style={btnStyle(tool === "pan")}>
            {tool === "pan" ? "🖐️" : "⌖"}
         </button>
         <button onClick={() => setZoom(z => clamp(z + 0.2, 0.5, 3))} style={btnStyle()}>In</button>
         <button onClick={() => setZoom(z => clamp(z - 0.2, 0.5, 3))} style={btnStyle()}>Out</button>
      </div>
      <canvas ref={canvasRef} style={{ display: "block", cursor: tool === "pan" ? "grabbing" : "crosshair" }} />
    </div>
  );
}

const btnStyle = (active) => ({
  background: active ? "#3b82f6" : "rgba(30,41,59,0.8)",
  border: "1px solid #334155",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px"
});

// frontend/src/components/TVChart.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function fmtPrice(n, digits = 5) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtTime(tsSec) {
  const d = new Date(tsSec * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TVChart({ candles = [], height = 540, symbol = "EURUSD", last = 0 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  const [size, setSize] = useState({ w: 900, h: 540 });

  // tools
  const [tool, setTool] = useState("crosshair"); // crosshair | pan
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [cross, setCross] = useState(null);

  const safeH = Math.max(360, Number(height) || 540);

  const view = useMemo(() => {
    const arr = Array.isArray(candles) ? candles : [];
    const maxBars = 260;
    return arr.length > maxBars ? arr.slice(arr.length - maxBars) : arr;
  }, [candles]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const w = Math.max(320, el.clientWidth || 900);
      setSize({ w, h: safeH });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);

    window.addEventListener("resize", update);
    return () => {
      try { ro.disconnect(); } catch {}
      window.removeEventListener("resize", update);
    };
  }, [safeH]);

  // pan drag + crosshair move
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    let dragging = false;
    let startX = 0;
    let startPanX = 0;

    const down = (e) => {
      if (tool !== "pan") return;
      dragging = true;
      startX = e.clientX;
      startPanX = panX;
    };

    const up = () => { dragging = false; };

    const move = (e) => {
      const rect = c.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCross({ x, y });

      if (!dragging) return;
      const dx = e.clientX - startX;
      setPanX(startPanX + dx);
    };

    c.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move);

    return () => {
      c.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", move);
    };
  }, [tool, panX]);

  // wheel zoom
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const onWheel = (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      setZoom((z) => clamp(z + dir * 0.15, 1, 4));
    };

    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const W = Math.floor(size.w);
    const H = Math.floor(size.h);

    c.width = Math.floor(W * dpr);
    c.height = Math.floor(H * dpr);
    c.style.width = "100%";
    c.style.height = `${H}px`;

    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // layout regions
    const railW = 56;
    const rightScaleW = 80;
    const bottomScaleH = 34;
    const pad = 10;

    const plotX0 = railW + pad;
    const plotY0 = pad;
    const plotW = Math.max(10, W - plotX0 - rightScaleW - pad);
    const plotH = Math.max(10, H - plotY0 - bottomScaleH - pad);

    // bg
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(10,14,20,0.95)";
    ctx.fillRect(0, 0, W, H);

    // plot border
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.strokeRect(plotX0, plotY0, plotW, plotH);

    // bounds
    const arr = view;
    let minP = Infinity, maxP = -Infinity;

    for (const k of arr) {
      const hi = Number(k?.high);
      const lo = Number(k?.low);
      if (Number.isFinite(hi)) maxP = Math.max(maxP, hi);
      if (Number.isFinite(lo)) minP = Math.min(minP, lo);
    }

    const lastNum = Number(last);
    if (Number.isFinite(lastNum)) {
      minP = Math.min(minP, lastNum);
      maxP = Math.max(maxP, lastNum);
    }
    if (!Number.isFinite(minP) || !Number.isFinite(maxP) || minP === maxP) {
      minP = 1;
      maxP = 2;
    }

    const span = (maxP - minP) || 1;
    const extra = span * (0.12 / zoom);
    const top = maxP + extra;
    const bot = minP - extra;

    const py = (p) => plotY0 + ((top - p) / (top - bot)) * plotH;

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let i = 1; i < 8; i++) {
      const y = plotY0 + (plotH * i) / 8;
      ctx.beginPath();
      ctx.moveTo(plotX0, y);
      ctx.lineTo(plotX0 + plotW, y);
      ctx.stroke();
    }
    for (let i = 1; i < 10; i++) {
      const x = plotX0 + (plotW * i) / 10;
      ctx.beginPath();
      ctx.moveTo(x, plotY0);
      ctx.lineTo(x, plotY0 + plotH);
      ctx.stroke();
    }

    // candles
    const n = arr.length || 1;
    const gap = 2;
    const baseCw = Math.max(3, Math.floor((plotW / n) * zoom) - gap);
    const usable = baseCw + gap;

    const totalW = usable * n;
    const centerX = plotX0 + (plotW - Math.min(plotW, totalW)) / 2;
    let x0 = centerX + panX;

    ctx.save();
    ctx.beginPath();
    ctx.rect(plotX0, plotY0, plotW, plotH);
    ctx.clip();

    for (let i = 0; i < n; i++) {
      const k = arr[i];
      const o = Number(k?.open);
      const h = Number(k?.high);
      const l = Number(k?.low);
      const cl = Number(k?.close);
      if (![o, h, l, cl].every(Number.isFinite)) {
        x0 += usable;
        continue;
      }

      const up = cl >= o;
      const openY = py(o);
      const closeY = py(cl);
      const highY = py(h);
      const lowY = py(l);

      // wick
      ctx.strokeStyle = "rgba(255,255,255,0.40)";
      ctx.beginPath();
      ctx.moveTo(x0 + baseCw / 2, highY);
      ctx.lineTo(x0 + baseCw / 2, lowY);
      ctx.stroke();

      // body
      ctx.fillStyle = up ? "rgba(43,213,118,0.85)" : "rgba(255,90,95,0.85)";
      const by = Math.min(openY, closeY);
      const bh = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x0, by, baseCw, bh);

      x0 += usable;
    }

    // last line
    if (Number.isFinite(lastNum)) {
      const y = py(lastNum);
      ctx.strokeStyle = "rgba(122,167,255,0.65)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(plotX0, y);
      ctx.lineTo(plotX0 + plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // crosshair
    if (cross && cross.x >= plotX0 && cross.x <= plotX0 + plotW && cross.y >= plotY0 && cross.y <= plotY0 + plotH) {
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(plotX0, cross.y);
      ctx.lineTo(plotX0 + plotW, cross.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cross.x, plotY0);
      ctx.lineTo(cross.x, plotY0 + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    // right scale
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "middle";

    const tickCount = 7;
    for (let i = 0; i <= tickCount; i++) {
      const y = plotY0 + (plotH * i) / tickCount;
      const val = top - ((top - bot) * i) / tickCount;

      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(plotX0 + plotW, y);
      ctx.lineTo(plotX0 + plotW + 6, y);
      ctx.stroke();

      ctx.fillText(fmtPrice(val, 5), plotX0 + plotW + 10, y);
    }

    // bottom time scale
    const axisY = plotY0 + plotH + 10;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.moveTo(plotX0, axisY);
    ctx.lineTo(plotX0 + plotW, axisY);
    ctx.stroke();

    if (arr.length) {
      const labels = Math.max(4, Math.min(8, Math.floor(plotW / 140)));
      const step = Math.max(1, Math.floor(arr.length / labels));

      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.textBaseline = "top";

      for (let i = 0; i < arr.length; i += step) {
        const x = plotX0 + (plotW * i) / (arr.length - 1 || 1);

        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.beginPath();
        ctx.moveTo(x, plotY0 + plotH);
        ctx.lineTo(x, plotY0 + plotH + 6);
        ctx.stroke();

        const lbl = fmtTime(arr[i].time);
        const tw = ctx.measureText(lbl).width;
        ctx.fillText(lbl, clamp(x - tw / 2, plotX0, plotX0 + plotW - tw), plotY0 + plotH + 10);
      }
    }

    // chart header
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(symbol, plotX0 + 10, plotY0 + 18);

    // subtle watermark (yours)
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.font = "700 20px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("AutoShield", plotX0 + 12, plotY0 + plotH - 14);
  }, [size.w, size.h, view, symbol, last, zoom, panX, cross]);

  return (
    <div ref={wrapRef} style={wrap}>
      {/* TOOL RAIL */}
      <div style={rail}>
        <ToolBtn active={tool === "crosshair"} label="⌖" title="Crosshair" onClick={() => setTool("crosshair")} />
        <ToolBtn active={tool === "pan"} label="⇄" title="Pan (drag)" onClick={() => setTool("pan")} />
        <ToolBtn label="＋" title="Zoom in" onClick={() => setZoom((z) => clamp(z + 0.2, 1, 4))} />
        <ToolBtn label="－" title="Zoom out" onClick={() => setZoom((z) => clamp(z - 0.2, 1, 4))} />
        <ToolBtn label="⟲" title="Reset view" onClick={() => { setZoom(1); setPanX(0); }} />
      </div>

      <div style={chartArea}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

function ToolBtn({ label, title, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        ...toolBtn,
        borderColor: active ? "rgba(122,167,255,0.55)" : "rgba(255,255,255,0.10)",
        background: active ? "rgba(122,167,255,0.12)" : "rgba(0,0,0,0.18)",
      }}
    >
      {label}
    </button>
  );
}

const wrap = {
  position: "relative",
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.22)",
  overflow: "hidden",
};

const chartArea = {
  position: "relative",
};

const rail = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: 56,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: 10,
  borderRight: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.22)",
  zIndex: 5,
};

const toolBtn = {
  height: 38,
  width: 38,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.10)",
  cursor: "pointer",
  fontWeight: 900,
  color: "rgba(255,255,255,0.88)",
};

// frontend/src/components/TVChart.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function fmt(n, d = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: d });
}

export default function TVChart({ candles = [], height = 520, symbol = "BTCUSD", last }) {
  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volRef = useRef(null);

  // UI tools
  const [tool, setTool] = useState("cursor"); // cursor | crosshair | measure
  const [showLeftScale, setShowLeftScale] = useState(true);

  // Measure state
  const measureRef = useRef({
    active: false,
    a: null,
    b: null,
    label: "",
  });

  const candleData = useMemo(() => {
    // expects: { time, open, high, low, close }
    return Array.isArray(candles) ? candles : [];
  }, [candles]);

  // Build chart once
  useEffect(() => {
    if (!wrapRef.current) return;

    const el = wrapRef.current;

    // Chart
    const chart = createChart(el, {
      height: Number(height) || 520,
      layout: {
        background: { color: "rgba(0,0,0,0)" },
        textColor: "rgba(255,255,255,0.82)",
        fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Arial",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.18 },
      },
      leftPriceScale: {
        visible: true,
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.18 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(122,167,255,0.45)", width: 1, style: 2 },
        horzLine: { color: "rgba(122,167,255,0.35)", width: 1, style: 2 },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "rgba(43,213,118,0.95)",
      downColor: "rgba(255,90,95,0.95)",
      borderUpColor: "rgba(43,213,118,0.95)",
      borderDownColor: "rgba(255,90,95,0.95)",
      wickUpColor: "rgba(43,213,118,0.75)",
      wickDownColor: "rgba(255,90,95,0.75)",
      priceScaleId: "right",
    });

    const volSeries = chart.addHistogramSeries({
      priceScaleId: "",
      priceFormat: { type: "volume" },
      scaleMargins: { top: 0.82, bottom: 0.0 },
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;
    volRef.current = volSeries;

    // ResizeObserver (fix “desktop shows different than phone” + prevents weird scaling)
    const ro = new ResizeObserver(() => {
      try {
        const w = el.clientWidth || 0;
        chart.applyOptions({ width: w, height: Number(height) || 520 });
        chart.timeScale().fitContent();
      } catch {}
    });
    ro.observe(el);

    // Crosshair + measure hook
    const onClick = (param) => {
      if (!param?.time) return;
      if (tool !== "measure") return;

      const price = param?.seriesPrices?.get(candleSeries)?.close;
      if (!Number.isFinite(Number(price))) return;

      const m = measureRef.current;
      if (!m.a) {
        m.a = { time: param.time, price: Number(price) };
        m.b = null;
        m.label = "Tap another point…";
      } else {
        m.b = { time: param.time, price: Number(price) };
        const diff = m.b.price - m.a.price;
        const pct = m.a.price ? (diff / m.a.price) * 100 : 0;
        m.label = `${diff >= 0 ? "+" : ""}${fmt(diff, 2)}  (${diff >= 0 ? "+" : ""}${fmt(pct, 2)}%)`;
      }
      drawMeasure();
      setTick((x) => x + 1);
    };

    chart.subscribeClick(onClick);

    // Cleanup
    return () => {
      try {
        chart.unsubscribeClick(onClick);
      } catch {}
      try {
        ro.disconnect();
      } catch {}
      try {
        chart.remove();
      } catch {}
      chartRef.current = null;
      seriesRef.current = null;
      volRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep chart height updated
  useEffect(() => {
    const c = chartRef.current;
    const el = wrapRef.current;
    if (!c || !el) return;
    try {
      c.applyOptions({ height: Number(height) || 520, width: el.clientWidth || 0 });
    } catch {}
  }, [height]);

  // Update data
  useEffect(() => {
    const s = seriesRef.current;
    const v = volRef.current;
    const c = chartRef.current;
    if (!s || !v || !c) return;

    try {
      s.setData(candleData);

      // volume fake from candle size if you don’t have real volume
      const vols = candleData.map((x) => {
        const body = Math.abs((x.close ?? 0) - (x.open ?? 0));
        const vol = clamp(body * 40, 50, 5000);
        const up = (x.close ?? 0) >= (x.open ?? 0);
        return {
          time: x.time,
          value: vol,
          color: up ? "rgba(43,213,118,0.35)" : "rgba(255,90,95,0.35)",
        };
      });
      v.setData(vols);

      c.timeScale().fitContent();
      drawMeasure();
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candleData, symbol]);

  // Tools / scales options
  useEffect(() => {
    const c = chartRef.current;
    if (!c) return;

    try {
      c.applyOptions({
        crosshair: {
          mode: tool === "crosshair" || tool === "measure" ? CrosshairMode.Normal : CrosshairMode.Hidden,
        },
        leftPriceScale: { visible: !!showLeftScale },
      });
    } catch {}

    // if switching away from measure, clear measure overlay
    if (tool !== "measure") {
      const m = measureRef.current;
      m.a = null;
      m.b = null;
      m.label = "";
      drawMeasure(true);
      setTick((x) => x + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, showLeftScale]);

  // Simple overlay canvas for measure line/label
  const overlayRef = useRef(null);
  const [tick, setTick] = useState(0); // just to refresh label UI

  const drawMeasure = (clear = false) => {
    const canvas = overlayRef.current;
    const el = wrapRef.current;
    const chart = chartRef.current;
    const s = seriesRef.current;

    if (!canvas || !el || !chart || !s) return;

    const ctx = canvas.getContext("2d");
    const w = el.clientWidth || 0;
    const h = Number(height) || 520;

    canvas.width = Math.floor(w * devicePixelRatio);
    canvas.height = Math.floor(h * devicePixelRatio);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (clear) return;

    const m = measureRef.current;
    if (!m?.a) return;

    // Map time/price to coordinate
    const timeScale = chart.timeScale();
    const priceScale = s.priceScale();

    const ax = timeScale.timeToCoordinate(m.a.time);
    const ay = priceScale.priceToCoordinate(m.a.price);

    if (!Number.isFinite(ax) || !Number.isFinite(ay)) return;

    // Draw point A
    ctx.fillStyle = "rgba(122,167,255,0.95)";
    ctx.beginPath();
    ctx.arc(ax, ay, 4, 0, Math.PI * 2);
    ctx.fill();

    if (!m.b) {
      // label
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "12px system-ui,-apple-system,Segoe UI,Roboto,Arial";
      ctx.fillText(m.label || "Tap another point…", ax + 10, ay - 10);
      return;
    }

    const bx = timeScale.timeToCoordinate(m.b.time);
    const by = priceScale.priceToCoordinate(m.b.price);

    if (!Number.isFinite(bx) || !Number.isFinite(by)) return;

    // Draw line
    ctx.strokeStyle = "rgba(0,255,170,0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // Draw point B
    ctx.fillStyle = "rgba(0,255,170,0.95)";
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label box near B
    const label = m.label || "";
    ctx.font = "12px system-ui,-apple-system,Segoe UI,Roboto,Arial";
    const pad = 8;
    const tw = ctx.measureText(label).width;
    const boxW = tw + pad * 2;
    const boxH = 24;

    const x = bx + 10;
    const y = by - 34;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;

    roundRect(ctx, x, y, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillText(label, x + pad, y + 16);
  };

  const resetView = () => {
    const c = chartRef.current;
    if (!c) return;
    try {
      c.timeScale().fitContent();
    } catch {}
  };

  return (
    <div style={wrapStyle}>
      {/* left tool rail */}
      <div style={toolRail}>
        <button style={toolBtn(tool === "cursor")} onClick={() => setTool("cursor")} type="button" title="Cursor">
          ▢
        </button>
        <button style={toolBtn(tool === "crosshair")} onClick={() => setTool("crosshair")} type="button" title="Crosshair">
          +
        </button>
        <button style={toolBtn(tool === "measure")} onClick={() => setTool("measure")} type="button" title="Ruler / Measure">
          ↔
        </button>

        <div style={{ height: 10 }} />

        <button style={toolBtn(false)} onClick={resetView} type="button" title="Reset view">
          ⟲
        </button>

        <button
          style={toolBtn(showLeftScale)}
          onClick={() => setShowLeftScale((v) => !v)}
          type="button"
          title="Toggle left scale"
        >
          L
        </button>
      </div>

      {/* chart container */}
      <div ref={wrapRef} style={{ width: "100%", height: Number(height) || 520, position: "relative" }}>
        {/* overlay for measure */}
        <canvas
          ref={overlayRef}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      </div>

      {/* subtle bottom status (optional) */}
      <div style={statusBar}>
        <span style={{ opacity: 0.8 }}>
          {symbol} {Number.isFinite(Number(last)) ? `• Last ${fmt(last, 2)}` : ""}
        </span>
        {tool === "measure" && (
          <span style={{ opacity: 0.8 }}>
            Ruler: {measureRef.current?.label || "tap start point"}
          </span>
        )}
      </div>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const wrapStyle = {
  position: "relative",
  width: "100%",
  borderRadius: 14,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.18)",
};

const toolRail = {
  position: "absolute",
  left: 10,
  top: 10,
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: 8,
  borderRadius: 14,
  background: "rgba(0,0,0,0.50)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(8px)",
};

const toolBtn = (active) => ({
  width: 36,
  height: 36,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: active ? "rgba(122,167,255,0.22)" : "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
  cursor: "pointer",
  fontWeight: 900,
  display: "grid",
  placeItems: "center",
  userSelect: "none",
});

const statusBar = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  padding: "8px 10px",
  fontSize: 12,
  borderTop: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.22)",
};

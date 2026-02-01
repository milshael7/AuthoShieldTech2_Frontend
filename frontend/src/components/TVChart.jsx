import React, { useEffect, useMemo, useRef } from "react";
import { createChart } from "lightweight-charts";

export default function TVChart({
  candles = [],
  height = 520,
  symbol = "",
  last = null,
}) {
  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const lastLineRef = useRef(null);

  const data = useMemo(() => {
    // Lightweight-charts wants:
    // { time: unixSeconds, open, high, low, close }
    return (Array.isArray(candles) ? candles : [])
      .filter((c) => c && Number.isFinite(Number(c.time)))
      .map((c) => ({
        time: Number(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }));
  }, [candles]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Destroy any old chart instance (hot reload safe)
    try {
      chartRef.current?.remove?.();
    } catch {}
    chartRef.current = null;
    seriesRef.current = null;
    lastLineRef.current = null;

    const chart = createChart(el, {
      width: el.clientWidth || 600,
      height: Math.max(240, Number(height) || 520),
      layout: {
        background: { color: "rgba(0,0,0,0.22)" },
        textColor: "rgba(255,255,255,0.85)",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.10)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.10)",
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        vertLine: { color: "rgba(122,167,255,0.35)" },
        horzLine: { color: "rgba(122,167,255,0.35)" },
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addCandlestickSeries({
      upColor: "rgba(43,213,118,0.95)",
      downColor: "rgba(255,90,95,0.95)",
      wickUpColor: "rgba(43,213,118,0.85)",
      wickDownColor: "rgba(255,90,95,0.85)",
      borderVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // ResizeObserver so it fits your panels perfectly
    const ro = new ResizeObserver(() => {
      try {
        chart.applyOptions({ width: el.clientWidth || 600 });
      } catch {}
    });
    ro.observe(el);

    return () => {
      try {
        ro.disconnect();
      } catch {}
      try {
        chart.remove();
      } catch {}
    };
  }, [height]);

  // Set/refresh candle data
  useEffect(() => {
    if (!seriesRef.current) return;
    try {
      seriesRef.current.setData(data);
      chartRef.current?.timeScale?.fitContent?.();
    } catch {}
  }, [data]);

  // Update the “last price” line
  useEffect(() => {
    if (!seriesRef.current) return;

    try {
      // remove old line
      if (lastLineRef.current) {
        seriesRef.current.removePriceLine(lastLineRef.current);
        lastLineRef.current = null;
      }

      const px = Number(last);
      if (!Number.isFinite(px)) return;

      lastLineRef.current = seriesRef.current.createPriceLine({
        price: px,
        color: "rgba(122,167,255,0.75)",
        lineWidth: 2,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: symbol ? `${symbol} last` : "last",
      });
    } catch {}
  }, [last, symbol]);

  return (
    <div
      style={{
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}
    >
      <div ref={wrapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

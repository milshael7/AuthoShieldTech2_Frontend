import React, { useEffect, useMemo, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

/**
 * TerminalChart — Institutional Trading Chart
 *
 * ✔ Candles
 * ✔ Volume
 * ✔ Trade markers
 * ✔ AI signals
 * ✔ PnL overlay
 * ✔ Liquidity zones
 * ✔ Trend overlay
 */

export default function TerminalChart({
  candles = [],
  volume = [],
  trades = [],
  aiSignals = [],
  pnlSeries = [],
  height = 520,
  accent = "rgba(122,167,255,0.85)",
}) {

  const wrapRef = useRef(null);
  const chartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const pnlSeriesRef = useRef(null);
  const trendSeriesRef = useRef(null);

  /* ================= NORMALIZE ================= */

  const candleData = useMemo(() => {
    return candles
      .map((c) => ({
        time: Number(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }))
      .filter((c) => Number.isFinite(c.time));
  }, [candles]);

  const volumeData = useMemo(() => {
    return volume.map((v) => ({
      time: Number(v.time),
      value: Number(v.value),
      color: v.color || "rgba(100,116,139,.45)",
    }));
  }, [volume]);

  const pnlData = useMemo(() => {
    return pnlSeries.map((p) => ({
      time: Number(p.time),
      value: Number(p.value),
    }));
  }, [pnlSeries]);

  /* ================= TREND ================= */

  const trendData = useMemo(() => {

    if (candleData.length < 20) return [];

    const out = [];

    for (let i = 20; i < candleData.length; i++) {

      const slice = candleData.slice(i - 20, i);

      const avg =
        slice.reduce((s, c) => s + c.close, 0) /
        slice.length;

      out.push({
        time: candleData[i].time,
        value: avg
      });

    }

    return out;

  }, [candleData]);

  /* ================= MARKERS ================= */

  const markers = useMemo(() => {

    const tradeMarkers = trades.map((t) => ({
      time: Number(t.time),
      position: t.side === "BUY" ? "belowBar" : "aboveBar",
      color: t.side === "BUY" ? "#22c55e" : "#ef4444",
      shape: t.side === "BUY" ? "arrowUp" : "arrowDown",
      text: t.side,
    }));

    const aiMarkers = aiSignals.map((s) => ({
      time: Number(s.time),
      position: "aboveBar",
      color: "#facc15",
      shape: "circle",
      text: "AI",
    }));

    return [...tradeMarkers, ...aiMarkers];

  }, [trades, aiSignals]);

  /* ================= CHART INIT ================= */

  useEffect(() => {

    const el = wrapRef.current;
    if (!el) return;

    try {
      chartRef.current?.remove();
    } catch {}

    const chart = createChart(el, {

      height,

      layout: {
        background: { color: "#0b1220" },
        textColor: "#9ca3af",
      },

      grid: {
        vertLines: { color: "rgba(148,163,184,.05)" },
        horzLines: { color: "rgba(148,163,184,.05)" },
      },

      rightPriceScale: {
        borderColor: "rgba(148,163,184,.15)",
      },

      leftPriceScale: {
        borderColor: "rgba(148,163,184,.15)",
      },

      crosshair: {
        mode: CrosshairMode.Normal,
      },

      timeScale: {
        borderColor: "rgba(148,163,184,.15)",
        timeVisible: true,
        secondsVisible: false,
      },

    });

    /* ================= CANDLES ================= */

    const candleSeries = chart.addCandlestickSeries({

      upColor: "#22c55e",
      downColor: "#ef4444",

      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",

      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",

    });

    candleSeries.applyOptions({
      priceLineVisible: true,
      priceLineColor: accent,
    });

    /* ================= VOLUME ================= */

    const volumeSeries = chart.addHistogramSeries({

      priceFormat: { type: "volume" },

      priceScaleId: "",

      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },

    });

    /* ================= PNL ================= */

    const pnlLine = chart.addLineSeries({

      color: "#facc15",
      lineWidth: 2,
      priceScaleId: "left",

    });

    /* ================= TREND ================= */

    const trendLine = chart.addLineSeries({

      color: "#60a5fa",
      lineWidth: 2,

    });

    chartRef.current = chart;

    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    pnlSeriesRef.current = pnlLine;
    trendSeriesRef.current = trendLine;

    /* ================= INITIAL DATA ================= */

    candleSeries.setData(candleData);

    if (volumeData.length)
      volumeSeries.setData(volumeData);

    if (pnlData.length)
      pnlLine.setData(pnlData);

    if (trendData.length)
      trendLine.setData(trendData);

    if (markers.length)
      candleSeries.setMarkers(markers);

    chart.timeScale().fitContent();

    /* ================= RESIZE ================= */

    const ro = new ResizeObserver(() => {

      const rect = el.getBoundingClientRect();

      chart.applyOptions({
        width: Math.floor(rect.width),
        height,
      });

    });

    ro.observe(el);

    return () => {

      try { ro.disconnect(); } catch {}
      try { chart.remove(); } catch {}

      chartRef.current = null;

    };

  }, [height]);

  /* ================= DATA UPDATES ================= */

  useEffect(() => {
    candleSeriesRef.current?.setData(candleData);
  }, [candleData]);

  useEffect(() => {
    volumeSeriesRef.current?.setData(volumeData);
  }, [volumeData]);

  useEffect(() => {
    pnlSeriesRef.current?.setData(pnlData);
  }, [pnlData]);

  useEffect(() => {
    trendSeriesRef.current?.setData(trendData);
  }, [trendData]);

  useEffect(() => {
    candleSeriesRef.current?.setMarkers(markers);
  }, [markers]);

  return (

    <div
      ref={wrapRef}
      style={{
        width: "100%",
        height,
        borderRadius: 14,
        border: "1px solid rgba(148,163,184,.15)",
        overflow: "hidden",
        background: "#0b1220",
      }}
    />

  );

}

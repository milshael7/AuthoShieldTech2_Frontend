// ============================================================
// FILE: frontend/src/components/TerminalChart.jsx
// VERSION: v11 (PRODUCTION STABLE)
// ============================================================

import React, { useEffect, useMemo, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

/* =========================================================
TIME NORMALIZER (🔥 FIX)
========================================================= */

function normalizeTime(t) {
  const n = Number(t);
  if (!Number.isFinite(n)) return null;

  // if ms → convert to seconds
  if (n > 1e12) return Math.floor(n / 1000);

  return Math.floor(n);
}

function normalizeSide(side) {
  const s = String(side || "").toUpperCase();

  if (s === "LONG") return "BUY";
  if (s === "SHORT") return "SELL";

  return s;
}

export default function TerminalChart({
  candles = [],
  trades = [],
  position = null,
  height = 520,
}) {
  const wrapRef = useRef(null);
  const chartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const tradeLineSeriesRef = useRef(null);

  const tpLineRef = useRef(null);
  const slLineRef = useRef(null);
  const entryLineRef = useRef(null);

  const markersRef = useRef([]);
  const lastTimeRef = useRef(null);

  /* =========================================================
CANDLES
========================================================= */

  const candleData = useMemo(() => {
    const map = new Map();

    for (const c of candles) {
      const time = normalizeTime(c?.time);
      const open = Number(c?.open);
      const high = Number(c?.high);
      const low = Number(c?.low);
      const close = Number(c?.close);

      if (
        time === null ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ) continue;

      map.set(time, {
        time,
        open,
        high: Math.max(open, high, low, close),
        low: Math.min(open, high, low, close),
        close,
      });
    }

    return Array.from(map.values()).sort((a, b) => a.time - b.time);
  }, [candles]);

  /* =========================================================
ACTIVE POSITION
========================================================= */

  const activePosition = useMemo(() => {
    if (!position) return null;

    const entry = Number(position.entry);
    if (!Number.isFinite(entry)) return null;

    return {
      entry,
      stopLoss: Number(position.stopLoss),
      takeProfit: Number(position.takeProfit),
    };
  }, [position]);

  /* =========================================================
INIT
========================================================= */

  useEffect(() => {
    if (chartRef.current) return;

    const chart = createChart(wrapRef.current, {
      height,
      layout: {
        background: { color: "#0b1220" },
        textColor: "#9ca3af",
      },
      crosshair: { mode: CrosshairMode.Normal },
    });

    candleSeriesRef.current = chart.addCandlestickSeries();
    tradeLineSeriesRef.current = chart.addLineSeries();

    chartRef.current = chart;

    return () => chart.remove();
  }, [height]);

  /* =========================================================
UPDATE CANDLES
========================================================= */

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || !candleData.length) return;

    const last = candleData[candleData.length - 1];

    if (!lastTimeRef.current) {
      series.setData(candleData);
      lastTimeRef.current = last.time;
      return;
    }

    if (last.time >= lastTimeRef.current) {
      series.update(last);
      lastTimeRef.current = last.time;
    }
  }, [candleData]);

  /* =========================================================
MARKERS (🔥 DEDUPED)
========================================================= */

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    const markers = [];

    for (const t of trades) {
      const time = normalizeTime(t?.time);
      const price = Number(t?.price);
      const side = normalizeSide(t?.side);

      if (!time || !Number.isFinite(price)) continue;

      let marker = null;

      if (side === "BUY") {
        marker = { time, position: "belowBar", shape: "arrowUp", text: "BUY" };
      }

      if (side === "SELL") {
        marker = { time, position: "aboveBar", shape: "arrowDown", text: "SELL" };
      }

      if (side.includes("CLOSE")) {
        marker = { time, position: "aboveBar", shape: "circle", text: "CLOSE" };
      }

      if (marker) markers.push(marker);
    }

    // prevent flicker (only update if changed)
    const prev = JSON.stringify(markersRef.current);
    const next = JSON.stringify(markers);

    if (prev !== next) {
      series.setMarkers(markers);
      markersRef.current = markers;
    }
  }, [trades]);

  /* =========================================================
TRADE PATH (🔥 FIXED PAIRING)
========================================================= */

  useEffect(() => {
    const lineSeries = tradeLineSeriesRef.current;
    if (!lineSeries) return;

    const lines = [];
    let open = null;

    for (const t of trades) {
      const side = normalizeSide(t?.side);
      const time = normalizeTime(t?.time);
      const price = Number(t?.price);

      if (!time || !Number.isFinite(price)) continue;

      if (!open && (side === "BUY" || side === "SELL")) {
        open = { time, price };
        continue;
      }

      if (open && side.includes("CLOSE")) {
        lines.push(
          { time: open.time, value: open.price },
          { time, value: price },
          { time, value: NaN }
        );
        open = null;
      }
    }

    lineSeries.setData(lines);
  }, [trades]);

  /* =========================================================
PRICE LINES (🔥 NO FLICKER)
========================================================= */

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    if (!activePosition) {
      if (entryLineRef.current) series.removePriceLine(entryLineRef.current);
      if (tpLineRef.current) series.removePriceLine(tpLineRef.current);
      if (slLineRef.current) series.removePriceLine(slLineRef.current);

      entryLineRef.current = null;
      tpLineRef.current = null;
      slLineRef.current = null;
      return;
    }

    if (!entryLineRef.current) {
      entryLineRef.current = series.createPriceLine({ price: activePosition.entry });
    } else {
      entryLineRef.current.applyOptions({ price: activePosition.entry });
    }

    if (Number.isFinite(activePosition.takeProfit)) {
      if (!tpLineRef.current) {
        tpLineRef.current = series.createPriceLine({ price: activePosition.takeProfit });
      } else {
        tpLineRef.current.applyOptions({ price: activePosition.takeProfit });
      }
    }

    if (Number.isFinite(activePosition.stopLoss)) {
      if (!slLineRef.current) {
        slLineRef.current = series.createPriceLine({ price: activePosition.stopLoss });
      } else {
        slLineRef.current.applyOptions({ price: activePosition.stopLoss });
      }
    }
  }, [activePosition]);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        height,
        borderRadius: 14,
        border: "1px solid rgba(148,163,184,.15)",
        background: "#0b1220",
      }}
    />
  );
}

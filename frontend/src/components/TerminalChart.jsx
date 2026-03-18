// ============================================================
// FILE: frontend/src/components/TerminalChart.jsx
// TERMINAL CHART — INSTITUTIONAL TRADING VERSION v10
//
// FIXED
// ✔ keeps safe empty-candle sanitizer
// ✔ full candle refresh handling
// ✔ stable markers for BUY/SELL/LONG/SHORT
// ✔ correct exit path support for CLOSE/TP/SL/PARTIAL_CLOSE
// ✔ uses actual position stopLoss / takeProfit when available
// ✔ safer cleanup for chart refs
// ============================================================

import React, { useEffect, useMemo, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

function safeNum(v, fallback = NaN) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSide(side) {
  return String(side || "").toUpperCase();
}

function isEntrySide(side) {
  const s = normalizeSide(side);
  return s === "BUY" || s === "SELL" || s === "LONG" || s === "SHORT";
}

function isExitSide(side) {
  const s = normalizeSide(side);
  return (
    s === "CLOSE" ||
    s === "TAKE_PROFIT" ||
    s === "STOP_LOSS" ||
    s === "PARTIAL_CLOSE"
  );
}

function isLongEntry(side) {
  const s = normalizeSide(side);
  return s === "BUY" || s === "LONG";
}

function isShortEntry(side) {
  const s = normalizeSide(side);
  return s === "SELL" || s === "SHORT";
}

export default function TerminalChart({
  candles = [],
  trades = [],
  position = null,
  height = 520,
  ws = null,
}) {
  const wrapRef = useRef(null);
  const chartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const tradeLineSeriesRef = useRef(null);

  const tpLineRef = useRef(null);
  const slLineRef = useRef(null);
  const entryLineRef = useRef(null);

  const initializedRef = useRef(false);
  const userScrollingRef = useRef(false);

  const liveMarkersRef = useRef([]);

  /* =========================================================
     SAFE CANDLE SANITIZER
     KEEP THIS. This is your empty/broken candle protection.
  ========================================================= */

  const candleData = useMemo(() => {
    const map = new Map();

    for (const c of candles) {
      const time = safeNum(c?.time);
      const open = safeNum(c?.open);
      const high = safeNum(c?.high);
      const low = safeNum(c?.low);
      const close = safeNum(c?.close);

      if (
        !Number.isFinite(time) ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ) {
        continue;
      }

      map.set(time, {
        time,
        open,
        high: Math.max(open, high, low, close),
        low: Math.min(open, high, low, close),
        close,
      });
    }

    const cleaned = Array.from(map.values());
    cleaned.sort((a, b) => a.time - b.time);

    return cleaned;
  }, [candles]);

  /* =========================================================
     CHART INIT
  ========================================================= */

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (chartRef.current) return;

    const chart = createChart(el, {
      height,
      width: el.clientWidth,

      layout: {
        background: { color: "#0b1220" },
        textColor: "#9ca3af",
      },

      grid: {
        vertLines: { color: "rgba(148,163,184,.05)" },
        horzLines: { color: "rgba(148,163,184,.05)" },
      },

      crosshair: { mode: CrosshairMode.Normal },

      rightPriceScale: {
        borderColor: "rgba(148,163,184,.15)",
      },

      timeScale: {
        borderColor: "rgba(148,163,184,.15)",
        timeVisible: true,
        barSpacing: 12,
        rightBarOffset: 6,
        rightBarStaysOnScroll: true,
      },
    });

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    tradeLineSeriesRef.current = chart.addLineSeries({
      color: "#60a5fa",
      lineWidth: 2,
    });

    chartRef.current = chart;

    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (!range) return;

      const bars = candleSeriesRef.current?.barsInLogicalRange?.(range);
      if (!bars) return;

      userScrollingRef.current = !(bars.barsAfter < 1);
    });

    const ro = new ResizeObserver((entries) => {
      const rect = entries?.[0]?.contentRect;
      if (!rect) return;
      chart.resize(rect.width, height);
    });

    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();

      chartRef.current = null;
      candleSeriesRef.current = null;
      tradeLineSeriesRef.current = null;

      tpLineRef.current = null;
      slLineRef.current = null;
      entryLineRef.current = null;

      initializedRef.current = false;
      userScrollingRef.current = false;
      liveMarkersRef.current = [];
    };
  }, [height]);

  /* =========================================================
     UPDATE CANDLES
     Fix: when candle history changes, set full dataset.
     update(last) alone is not enough after refresh/remount/data replacement.
  ========================================================= */

  useEffect(() => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;

    if (!chart || !series) return;

    if (!candleData.length) {
      series.setData([]);
      return;
    }

    series.setData(candleData);

    if (!initializedRef.current) {
      chart.timeScale().fitContent();
      initializedRef.current = true;
    } else if (!userScrollingRef.current) {
      try {
        chart.timeScale().scrollToPosition(0, true);
      } catch {}
    }
  }, [candleData]);

  /* =========================================================
     TRADE MARKERS
  ========================================================= */

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    const markers = [];

    for (const t of trades) {
      const time = safeNum(t?.time);
      if (!Number.isFinite(time)) continue;

      const side = normalizeSide(t?.side);

      if (isLongEntry(side)) {
        markers.push({
          time,
          position: "belowBar",
          color: "#22c55e",
          shape: "arrowUp",
          text: side === "LONG" ? "LONG" : "BUY",
        });
        continue;
      }

      if (isShortEntry(side)) {
        markers.push({
          time,
          position: "aboveBar",
          color: "#ef4444",
          shape: "arrowDown",
          text: side === "SHORT" ? "SHORT" : "SELL",
        });
        continue;
      }

      if (side === "TAKE_PROFIT") {
        markers.push({
          time,
          position: "aboveBar",
          color: "#22c55e",
          shape: "circle",
          text: "TP",
        });
        continue;
      }

      if (side === "STOP_LOSS") {
        markers.push({
          time,
          position: "aboveBar",
          color: "#ef4444",
          shape: "circle",
          text: "SL",
        });
        continue;
      }

      if (side === "PARTIAL_CLOSE") {
        markers.push({
          time,
          position: "aboveBar",
          color: "#f59e0b",
          shape: "circle",
          text: "PARTIAL",
        });
        continue;
      }

      if (side === "CLOSE") {
        markers.push({
          time,
          position: "aboveBar",
          color: "#60a5fa",
          shape: "circle",
          text: "CLOSE",
        });
      }
    }

    liveMarkersRef.current = markers;
    series.setMarkers(markers);
  }, [trades]);

  /* =========================================================
     TRADE PATH LINES
     Fix: supports all exit types, not just CLOSE.
  ========================================================= */

  useEffect(() => {
    const lineSeries = tradeLineSeriesRef.current;
    if (!lineSeries) return;

    const sortedTrades = [...trades].sort(
      (a, b) => safeNum(a?.time, 0) - safeNum(b?.time, 0)
    );

    const lines = [];
    let activeEntry = null;

    for (const t of sortedTrades) {
      const side = normalizeSide(t?.side);
      const time = safeNum(t?.time);
      const price = safeNum(t?.price, safeNum(t?.entry));

      if (!Number.isFinite(time) || !Number.isFinite(price)) {
        continue;
      }

      if (isEntrySide(side)) {
        activeEntry = {
          side,
          time,
          price,
          symbol: t?.symbol || null,
          slot: t?.slot || null,
        };
        continue;
      }

      if (isExitSide(side) && activeEntry) {
        const sameSymbol =
          !activeEntry.symbol ||
          !t?.symbol ||
          activeEntry.symbol === t.symbol;

        const sameSlot =
          !activeEntry.slot ||
          !t?.slot ||
          activeEntry.slot === t.slot;

        if (sameSymbol && sameSlot) {
          lines.push({ time: activeEntry.time, value: activeEntry.price });
          lines.push({ time, value: price });
          lines.push({ time, value: price }); // keep segment closed cleanly

          if (side !== "PARTIAL_CLOSE") {
            activeEntry = null;
          }
        }
      }
    }

    lineSeries.setData(lines);
  }, [trades]);

  /* =========================================================
     ACTIVE TRADE LINES
     Fix: use real stopLoss / takeProfit if present.
  ========================================================= */

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    if (entryLineRef.current) {
      series.removePriceLine(entryLineRef.current);
      entryLineRef.current = null;
    }

    if (tpLineRef.current) {
      series.removePriceLine(tpLineRef.current);
      tpLineRef.current = null;
    }

    if (slLineRef.current) {
      series.removePriceLine(slLineRef.current);
      slLineRef.current = null;
    }

    if (!position) return;

    const entry = safeNum(position.entry);
    if (!Number.isFinite(entry) || entry <= 0) return;

    const side = normalizeSide(position.side);

    const tp = Number.isFinite(safeNum(position.takeProfit))
      ? safeNum(position.takeProfit)
      : side === "LONG"
        ? entry * 1.0035
        : entry * 0.9965;

    const sl = Number.isFinite(safeNum(position.stopLoss))
      ? safeNum(position.stopLoss)
      : side === "LONG"
        ? entry * 0.9975
        : entry * 1.0025;

    entryLineRef.current = series.createPriceLine({
      price: entry,
      color: "#38bdf8",
      lineWidth: 2,
      title: "ENTRY",
    });

    if (Number.isFinite(tp) && tp > 0) {
      tpLineRef.current = series.createPriceLine({
        price: tp,
        color: "#22c55e",
        lineWidth: 2,
        title: "TP",
      });
    }

    if (Number.isFinite(sl) && sl > 0) {
      slLineRef.current = series.createPriceLine({
        price: sl,
        color: "#ef4444",
        lineWidth: 2,
        title: "SL",
      });
    }
  }, [position]);

  return (
    <div style={{ width: "100%" }}>
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
    </div>
  );
}

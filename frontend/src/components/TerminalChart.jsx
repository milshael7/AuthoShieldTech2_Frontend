// ============================================================
// FILE: frontend/src/components/TerminalChart.jsx
// TERMINAL CHART — INSTITUTIONAL TRADING VERSION v5
//
// FEATURES
// ✔ AI BUY / SELL arrows
// ✔ TP / SL exit markers
// ✔ TP / SL price lines
// ✔ active trade highlight
// ✔ snap-to-live market
// ✔ scrollable history
// ============================================================

import React, { useEffect, useMemo, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

export default function TerminalChart({
  candles = [],
  trades = [],
  position = null,
  height = 520
}) {

  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);

  const tpLineRef = useRef(null);
  const slLineRef = useRef(null);
  const entryLineRef = useRef(null);

  const lastTimeRef = useRef(null);
  const initializedRef = useRef(false);

  /* =========================================================
     SAFE CANDLE SANITIZER
  ========================================================= */

  const candleData = useMemo(()=>{

    const map = new Map();

    for(const c of candles){

      const time = Number(c?.time);
      let open = Number(c?.open);
      let high = Number(c?.high);
      let low = Number(c?.low);
      let close = Number(c?.close);

      if(
        !Number.isFinite(time) ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ){
        continue;
      }

      const max = Math.max(open,high,low,close);
      const min = Math.min(open,high,low,close);

      map.set(time,{
        time,
        open,
        high:max,
        low:min,
        close
      });

    }

    const cleaned = Array.from(map.values());
    cleaned.sort((a,b)=>a.time-b.time);

    return cleaned;

  },[candles]);

  /* =========================================================
     CHART INIT
  ========================================================= */

  useEffect(()=>{

    const el = wrapRef.current;
    if(!el) return;
    if(chartRef.current) return;

    const chart = createChart(el,{
      height,
      width: el.clientWidth,

      layout:{
        background:{ color:"#0b1220" },
        textColor:"#9ca3af"
      },

      grid:{
        vertLines:{ color:"rgba(148,163,184,.05)" },
        horzLines:{ color:"rgba(148,163,184,.05)" }
      },

      crosshair:{
        mode: CrosshairMode.Normal
      },

      rightPriceScale:{
        borderColor:"rgba(148,163,184,.15)"
      },

      timeScale:{
        borderColor:"rgba(148,163,184,.15)",
        timeVisible:true,
        barSpacing:12,
        rightBarOffset:6,
        rightBarStaysOnScroll:true
      }

    });

    candleSeriesRef.current =
      chart.addCandlestickSeries({
        upColor:"#22c55e",
        downColor:"#ef4444",
        borderUpColor:"#22c55e",
        borderDownColor:"#ef4444",
        wickUpColor:"#22c55e",
        wickDownColor:"#ef4444"
      });

    chartRef.current = chart;

  },[height]);

  /* =========================================================
     UPDATE CANDLES
  ========================================================= */

  useEffect(()=>{

    const chart = chartRef.current;
    const series = candleSeriesRef.current;

    if(!chart || !series) return;
    if(!candleData.length) return;

    const last = candleData[candleData.length-1];

    if(lastTimeRef.current === null){

      series.setData(candleData);
      lastTimeRef.current = last.time;

      if(!initializedRef.current){

        chart.timeScale().fitContent();
        initializedRef.current = true;

      }

      return;

    }

    if(last.time >= lastTimeRef.current){

      series.update(last);

      try{
        chart.timeScale().scrollToRealTime();
      }catch{}

      lastTimeRef.current = last.time;

    }

  },[candleData]);

  /* =========================================================
     TRADE MARKERS
  ========================================================= */

  useEffect(()=>{

    const series = candleSeriesRef.current;
    if(!series) return;

    const markers = [];

    for(const t of trades){

      const time = Number(t?.time);
      if(!Number.isFinite(time)) continue;

      if(t.side === "BUY"){

        markers.push({
          time,
          position:"belowBar",
          color:"#22c55e",
          shape:"arrowUp",
          text:"AI BUY"
        });

      }

      if(t.side === "SELL"){

        markers.push({
          time,
          position:"aboveBar",
          color:"#ef4444",
          shape:"arrowDown",
          text:"AI SELL"
        });

      }

      if(t.side === "CLOSE"){

        const pnl = Number(t.pnl || 0);

        markers.push({
          time,
          position: pnl >= 0 ? "aboveBar":"belowBar",
          color: pnl >= 0 ? "#22c55e":"#ef4444",
          shape:"circle",
          text: pnl >= 0 ? "TP":"SL"
        });

      }

    }

    series.setMarkers(markers);

  },[trades]);

  /* =========================================================
     ACTIVE TRADE LINES
  ========================================================= */

  useEffect(()=>{

    const series = candleSeriesRef.current;
    if(!series) return;

    if(!position){

      if(tpLineRef.current)
        series.removePriceLine(tpLineRef.current);

      if(slLineRef.current)
        series.removePriceLine(slLineRef.current);

      if(entryLineRef.current)
        series.removePriceLine(entryLineRef.current);

      return;

    }

    const entry = position.entry;

    const tp =
      position.side === "LONG"
        ? entry * 1.0035
        : entry * 0.9965;

    const sl =
      position.side === "LONG"
        ? entry * 0.9975
        : entry * 1.0025;

    entryLineRef.current =
      series.createPriceLine({
        price:entry,
        color:"#38bdf8",
        lineWidth:2,
        title:"ENTRY"
      });

    tpLineRef.current =
      series.createPriceLine({
        price:tp,
        color:"#22c55e",
        lineWidth:2,
        title:"TP"
      });

    slLineRef.current =
      series.createPriceLine({
        price:sl,
        color:"#ef4444",
        lineWidth:2,
        title:"SL"
      });

  },[position]);

  return(

    <div style={{width:"100%"}}>

      <div
        ref={wrapRef}
        style={{
          width:"100%",
          height,
          borderRadius:14,
          border:"1px solid rgba(148,163,184,.15)",
          background:"#0b1220"
        }}
      />

    </div>

  );

}

// ============================================================
// FILE: frontend/src/components/TerminalChart.jsx
// TERMINAL CHART — INSTITUTIONAL TRADING VERSION v4
//
// NEW FEATURES
// ✔ AI BUY / SELL arrows
// ✔ TP / SL exit markers
// ✔ snap-to-live market
// ✔ smooth candle scrolling
// ✔ readable candle spacing
// ✔ scrollable history
// ============================================================

import React, { useEffect, useMemo, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

export default function TerminalChart({
  candles = [],
  trades = [],
  aiSignals = [],
  height = 520
}) {

  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);

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

      high = max;
      low = min;

      if(open > high) open = high;
      if(open < low) open = low;

      if(close > high) close = high;
      if(close < low) close = low;

      map.set(time,{
        time,
        open,
        high,
        low,
        close
      });

    }

    const cleaned = Array.from(map.values());

    cleaned.sort((a,b)=>a.time-b.time);

    return cleaned;

  },[candles]);

  /* =========================================================
     CHART INITIALIZATION
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
        borderColor:"rgba(148,163,184,.15)",
        autoScale:true
      },

      timeScale:{
        borderColor:"rgba(148,163,184,.15)",

        /* IMPORTANT SETTINGS */

        timeVisible:true,
        secondsVisible:false,

        barSpacing:12,
        rightBarOffset:6,

        rightBarStaysOnScroll:true,
        lockVisibleTimeRangeOnResize:true
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

    const ro = new ResizeObserver(entries =>{

      const rect = entries[0].contentRect;

      try{
        chart.resize(rect.width,height);
      }catch{}

    });

    ro.observe(el);

    return ()=>{

      try{ro.disconnect()}catch{}
      try{chart.remove()}catch{}

      chartRef.current = null;
      candleSeriesRef.current = null;

      lastTimeRef.current = null;
      initializedRef.current = false;

    }

  },[height]);

  /* =========================================================
     SAFE DATA UPDATE
  ========================================================= */

  useEffect(()=>{

    const chart = chartRef.current;
    const series = candleSeriesRef.current;

    if(!chart || !series) return;
    if(!candleData.length) return;

    const last = candleData[candleData.length-1];

    if(lastTimeRef.current === null){

      try{
        series.setData(candleData);
      }catch{
        return;
      }

      lastTimeRef.current = last.time;

      if(!initializedRef.current && candleData.length > 20){

        chart.timeScale().fitContent();
        initializedRef.current = true;

      }

      return;

    }

    if(last.time >= lastTimeRef.current){

      try{
        series.update(last);
      }catch{

        try{
          series.setData(candleData);
        }catch{}

      }

      /* SNAP BACK TO LIVE MARKET */

      try{
        chart.timeScale().scrollToRealTime();
      }catch{}

      lastTimeRef.current = last.time;
      return;

    }

    try{
      series.setData(candleData);
    }catch{}

    lastTimeRef.current = last.time;

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

      const side = t.side || t.action;

      /* ENTRY BUY */

      if(side === "BUY"){

        markers.push({
          time,
          position:"belowBar",
          color:"#22c55e",
          shape:"arrowUp",
          text:"AI BUY"
        });

      }

      /* ENTRY SELL */

      if(side === "SELL"){

        markers.push({
          time,
          position:"aboveBar",
          color:"#ef4444",
          shape:"arrowDown",
          text:"AI SELL"
        });

      }

      /* EXIT */

      if(side === "CLOSE"){

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

    try{
      series.setMarkers(markers);
    }catch{}

  },[trades]);

  return(

    <div style={{width:"100%"}}>

      <div
        ref={wrapRef}
        style={{
          width:"100%",
          height,
          borderRadius:14,
          border:"1px solid rgba(148,163,184,.15)",
          overflow:"hidden",
          background:"#0b1220"
        }}
      />

    </div>

  );

}

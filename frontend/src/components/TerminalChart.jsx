// ============================================================
// FILE: frontend/src/components/TerminalChart.jsx
// TERMINAL CHART — INSTITUTIONAL TRADING VERSION v9
//
// NEW
// ✔ AI trade path visualization
// ✔ BUY → SELL connection lines
// ✔ stable markers
// ✔ realtime websocket markers
// ✔ TradingView-style scrolling
// ============================================================

import React, { useEffect, useMemo, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

export default function TerminalChart({
  candles = [],
  trades = [],
  position = null,
  height = 520,
  ws = null
}){

  const wrapRef = useRef(null);
  const chartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const tradeLineSeriesRef = useRef(null);

  const tpLineRef = useRef(null);
  const slLineRef = useRef(null);
  const entryLineRef = useRef(null);

  const lastTimeRef = useRef(null);
  const initializedRef = useRef(false);

  const userScrollingRef = useRef(false);

  const liveMarkersRef = useRef([]);
  const tradeLinesRef = useRef([]);

  /* =========================================================
     SAFE CANDLE SANITIZER
  ========================================================= */

  const candleData = useMemo(()=>{

    const map = new Map();

    for(const c of candles){

      const time = Number(c?.time);
      const open = Number(c?.open);
      const high = Number(c?.high);
      const low = Number(c?.low);
      const close = Number(c?.close);

      if(
        !Number.isFinite(time) ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ){
        continue;
      }

      map.set(time,{
        time,
        open,
        high:Math.max(open,high,low,close),
        low:Math.min(open,high,low,close),
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

      crosshair:{ mode: CrosshairMode.Normal },

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

    /* trade path line series */

    tradeLineSeriesRef.current =
      chart.addLineSeries({
        color:"#60a5fa",
        lineWidth:2
      });

    chartRef.current = chart;

    chart.timeScale().subscribeVisibleLogicalRangeChange((range)=>{

      if(!range) return;

      const bars =
        candleSeriesRef.current?.barsInLogicalRange?.(range);

      if(!bars) return;

      if(bars.barsAfter < 1){
        userScrollingRef.current=false;
      }else{
        userScrollingRef.current=true;
      }

    });

    const ro = new ResizeObserver(entries=>{

      const rect = entries[0].contentRect;

      chart.resize(rect.width,height);

    });

    ro.observe(el);

    return ()=>{

      ro.disconnect();
      chart.remove();

      chartRef.current=null;
      candleSeriesRef.current=null;

    };

  },[height]);

  /* =========================================================
     UPDATE CANDLES
  ========================================================= */

  useEffect(()=>{

    const chart = chartRef.current;
    const series = candleSeriesRef.current;

    if(!chart || !series) return;
    if(!candleData.length) return;

    const last =
      candleData[candleData.length-1];

    if(lastTimeRef.current===null){

      series.setData(candleData);

      lastTimeRef.current = last.time;

      if(!initializedRef.current){

        chart.timeScale().fitContent();
        initializedRef.current=true;

      }

      return;

    }

    if(last.time >= lastTimeRef.current){

      series.update(last);

      if(!userScrollingRef.current){

        try{
          chart.timeScale().scrollToPosition(0,true);
        }catch{}

      }

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

      if(t.side==="BUY"){
        markers.push({
          time,
          position:"belowBar",
          color:"#22c55e",
          shape:"arrowUp",
          text:"BUY"
        });
      }

      if(t.side==="SELL"){
        markers.push({
          time,
          position:"aboveBar",
          color:"#ef4444",
          shape:"arrowDown",
          text:"SELL"
        });
      }

    }

    liveMarkersRef.current = markers;

    series.setMarkers(markers);

  },[trades]);

  /* =========================================================
     TRADE PATH LINES
  ========================================================= */

  useEffect(()=>{

    const lineSeries =
      tradeLineSeriesRef.current;

    if(!lineSeries) return;

    const lines=[];

    let entry=null;

    for(const t of trades){

      if(t.side==="BUY" || t.side==="SELL"){
        entry=t;
      }

      if(t.side==="CLOSE" && entry){

        lines.push({
          time: entry.time,
          value: entry.price
        });

        lines.push({
          time: t.time,
          value: t.price
        });

        entry=null;

      }

    }

    lineSeries.setData(lines);

  },[trades]);

  /* =========================================================
     ACTIVE TRADE LINES
  ========================================================= */

  useEffect(()=>{

    const series = candleSeriesRef.current;
    if(!series) return;

    if(entryLineRef.current){
      series.removePriceLine(entryLineRef.current);
      entryLineRef.current=null;
    }

    if(tpLineRef.current){
      series.removePriceLine(tpLineRef.current);
      tpLineRef.current=null;
    }

    if(slLineRef.current){
      series.removePriceLine(slLineRef.current);
      slLineRef.current=null;
    }

    if(!position) return;

    const entry = position.entry;

    const tp =
      position.side==="LONG"
        ? entry * 1.0035
        : entry * 0.9965;

    const sl =
      position.side==="LONG"
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

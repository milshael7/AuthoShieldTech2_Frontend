import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

export default function TerminalChart({
  candles = [],
  volume = [],
  trades = [],
  aiSignals = [],
  pnlSeries = [],
  height = 520
}){

  const wrapRef = useRef(null);
  const chartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const pnlSeriesRef = useRef(null);
  const trendSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);

  const lastTimeRef = useRef(null);

  const [showTrend,setShowTrend] = useState(true);
  const [showEMA,setShowEMA] = useState(true);

  /* ================= NORMALIZE ================= */

  const candleData = useMemo(()=>{

    return candles.map(c=>({
      time:Number(c.time),
      open:Number(c.open),
      high:Number(c.high),
      low:Number(c.low),
      close:Number(c.close)
    }));

  },[candles]);

  const volumeData = useMemo(()=>{

    return volume.map(v=>({
      time:Number(v.time),
      value:Number(v.value),
      color:v.color || "rgba(100,116,139,.45)"
    }));

  },[volume]);

  const pnlData = useMemo(()=>{

    return pnlSeries.map(p=>({
      time:Number(p.time),
      value:Number(p.value)
    }));

  },[pnlSeries]);

  /* ================= CHART INIT ================= */

  useEffect(()=>{

    const el = wrapRef.current;
    if(!el) return;

    try{ chartRef.current?.remove() }catch{}

    const chart = createChart(el,{

      height,
      width: el.clientWidth,

      layout:{
        background:{color:"#0b1220"},
        textColor:"#9ca3af"
      },

      grid:{
        vertLines:{color:"rgba(148,163,184,.05)"},
        horzLines:{color:"rgba(148,163,184,.05)"}
      },

      rightPriceScale:{
        borderColor:"rgba(148,163,184,.15)"
      },

      crosshair:{
        mode:CrosshairMode.Normal
      },

      timeScale:{
        borderColor:"rgba(148,163,184,.15)",
        timeVisible:true
      }

    });

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor:"#22c55e",
      downColor:"#ef4444",
      borderUpColor:"#22c55e",
      borderDownColor:"#ef4444",
      wickUpColor:"#22c55e",
      wickDownColor:"#ef4444"
    });

    volumeSeriesRef.current =
      chart.addHistogramSeries({
        priceFormat:{type:"volume"},
        priceScaleId:"",
        scaleMargins:{top:0.82,bottom:0}
      });

    pnlSeriesRef.current =
      chart.addLineSeries({
        color:"#facc15",
        lineWidth:2,
        priceScaleId:"left"
      });

    trendSeriesRef.current =
      chart.addLineSeries({
        color:"#38bdf8",
        lineWidth:2
      });

    emaSeriesRef.current =
      chart.addLineSeries({
        color:"#a78bfa",
        lineWidth:2
      });

    chartRef.current = chart;

    const ro = new ResizeObserver(entries=>{

      const rect = entries[0].contentRect;

      chart.resize(rect.width, height);

      // important
      chart.timeScale().fitContent();

    });

    ro.observe(el);

    return ()=>{

      try{ro.disconnect()}catch{}
      try{chart.remove()}catch{}

    };

  },[height]);

  /* ================= DATA UPDATE ================= */

  useEffect(()=>{

    if(!candleSeriesRef.current) return;

    if(!candleData.length) {
      lastTimeRef.current = null;
      return;
    }

    const last = candleData[candleData.length-1];

    // FULL DATA RESET
    if(lastTimeRef.current === null){

      candleSeriesRef.current.setData(candleData);
      lastTimeRef.current = last.time;

      // 🔥 force proper scaling
      chartRef.current?.timeScale().fitContent();

      return;
    }

    // REALTIME UPDATE
    candleSeriesRef.current.update(last);

    if(last.time !== lastTimeRef.current){
      lastTimeRef.current = last.time;
    }

  },[candleData]);

  useEffect(()=>{
    volumeSeriesRef.current?.setData(volumeData);
  },[volumeData]);

  useEffect(()=>{
    pnlSeriesRef.current?.setData(pnlData);
  },[pnlData]);

  useEffect(()=>{
    candleSeriesRef.current?.setMarkers(
      [...trades.map(t=>({
        time:Number(t.time),
        position:t.side==="BUY"?"belowBar":"aboveBar",
        color:t.side==="BUY"?"#22c55e":"#ef4444",
        shape:t.side==="BUY"?"arrowUp":"arrowDown",
        text:t.side
      })),
      ...aiSignals.map(s=>({
        time:Number(s.time),
        position:"aboveBar",
        color:"#facc15",
        shape:"circle",
        text:"AI"
      }))]
    );
  },[trades,aiSignals]);

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

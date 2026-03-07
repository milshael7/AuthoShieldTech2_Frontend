import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

/**
 * TerminalChart — Institutional Trading Chart
 *
 * ✔ Candles
 * ✔ Volume
 * ✔ Trade markers
 * ✔ AI signals
 * ✔ PnL overlay
 * ✔ Trend overlay
 * ✔ Chart type switch
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

  const lineSeriesRef = useRef(null);
  const areaSeriesRef = useRef(null);

  const [chartType,setChartType] = useState("candles");
  const [showTrend,setShowTrend] = useState(true);

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

  const lineData = useMemo(()=>{

    return candleData.map(c=>({
      time:c.time,
      value:c.close
    }));

  },[candleData]);

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

  /* ================= TREND ================= */

  const trendData = useMemo(()=>{

    if(candleData.length<20) return [];

    const out=[];

    for(let i=20;i<candleData.length;i++){

      const slice=candleData.slice(i-20,i);

      const avg =
        slice.reduce((s,c)=>s+c.close,0)/
        slice.length;

      out.push({
        time:candleData[i].time,
        value:avg
      });

    }

    return out;

  },[candleData]);

  /* ================= MARKERS ================= */

  const markers = useMemo(()=>{

    const tradeMarkers = trades.map(t=>({

      time:Number(t.time),
      position:t.side==="BUY"?"belowBar":"aboveBar",
      color:t.side==="BUY"?"#22c55e":"#ef4444",
      shape:t.side==="BUY"?"arrowUp":"arrowDown",
      text:t.side

    }));

    const aiMarkers = aiSignals.map(s=>({

      time:Number(s.time),
      position:"aboveBar",
      color:"#facc15",
      shape:"circle",
      text:"AI"

    }));

    return [...tradeMarkers,...aiMarkers];

  },[trades,aiSignals]);

  /* ================= CHART INIT ================= */

  useEffect(()=>{

    const el = wrapRef.current;
    if(!el) return;

    try{
      chartRef.current?.remove();
    }catch{}

    const chart = createChart(el,{

      height,

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

    /* ===== CANDLES ===== */

    const candleSeries = chart.addCandlestickSeries({

      upColor:"#22c55e",
      downColor:"#ef4444",

      borderUpColor:"#22c55e",
      borderDownColor:"#ef4444",

      wickUpColor:"#22c55e",
      wickDownColor:"#ef4444"

    });

    candleSeries.applyOptions({
      priceLineVisible:true,
      priceLineColor:accent
    });

    /* ===== LINE ===== */

    const lineSeries = chart.addLineSeries({
      color:"#60a5fa",
      lineWidth:2
    });

    /* ===== AREA ===== */

    const areaSeries = chart.addAreaSeries({

      topColor:"rgba(96,165,250,.35)",
      bottomColor:"rgba(96,165,250,.02)",
      lineColor:"#60a5fa",
      lineWidth:2

    });

    /* ===== VOLUME ===== */

    const volumeSeries = chart.addHistogramSeries({

      priceFormat:{type:"volume"},
      priceScaleId:"",

      scaleMargins:{
        top:0.82,
        bottom:0
      }

    });

    /* ===== PNL ===== */

    const pnlLine = chart.addLineSeries({

      color:"#facc15",
      lineWidth:2,
      priceScaleId:"left"

    });

    /* ===== TREND ===== */

    const trendLine = chart.addLineSeries({

      color:"#38bdf8",
      lineWidth:2

    });

    chartRef.current=chart;

    candleSeriesRef.current=candleSeries;
    volumeSeriesRef.current=volumeSeries;
    pnlSeriesRef.current=pnlLine;
    trendSeriesRef.current=trendLine;
    lineSeriesRef.current=lineSeries;
    areaSeriesRef.current=areaSeries;

    chart.timeScale().fitContent();

  },[height]);

  /* ================= DATA ================= */

  useEffect(()=>{

    if(chartType==="candles")
      candleSeriesRef.current?.setData(candleData);

    if(chartType==="line")
      lineSeriesRef.current?.setData(lineData);

    if(chartType==="area")
      areaSeriesRef.current?.setData(lineData);

  },[candleData,lineData,chartType]);

  useEffect(()=>{
    volumeSeriesRef.current?.setData(volumeData);
  },[volumeData]);

  useEffect(()=>{
    pnlSeriesRef.current?.setData(pnlData);
  },[pnlData]);

  useEffect(()=>{

    if(showTrend)
      trendSeriesRef.current?.setData(trendData);
    else
      trendSeriesRef.current?.setData([]);

  },[trendData,showTrend]);

  useEffect(()=>{
    candleSeriesRef.current?.setMarkers(markers);
  },[markers]);

  /* ================= UI ================= */

  return(

    <div style={{width:"100%"}}>

      {/* ===== TOOLBAR ===== */}

      <div style={{
        display:"flex",
        gap:8,
        marginBottom:6
      }}>

        <button onClick={()=>setChartType("candles")}>📊</button>
        <button onClick={()=>setChartType("line")}>📈</button>
        <button onClick={()=>setChartType("area")}>≈</button>

        <button onClick={()=>setShowTrend(v=>!v)}>
          ƒx
        </button>

      </div>

      {/* ===== CHART ===== */}

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

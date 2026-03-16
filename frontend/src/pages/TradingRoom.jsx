// ==========================================================
// FILE: frontend/src/pages/TradingRoom.jsx
// MODULE: Trading Room
// PURPOSE: Live market dashboard + AI paper trading interface
//
// FINAL VERSION
// ✔ live candles
// ✔ AI trade countdown overlay
// ✔ chart TP / SL / ENTRY support
// ✔ websocket reconnect
// ✔ memory protection
// ==========================================================

import React, { useEffect, useRef, useState } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import AIBehaviorPanel from "../components/AIBehaviorPanel";
import AIPerformanceHistoryPanel from "../components/AIPerformanceHistoryPanel";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";

const CANDLE_SECONDS = 60;
const MAX_CANDLES = 500;

export default function TradingRoom(){

const marketWsRef = useRef(null);
const paperWsRef = useRef(null);
const engineStartRef = useRef(null);
const lastCandleRef = useRef(null);

const [candles,setCandles] = useState([]);
const [price,setPrice] = useState(null);

const [equity,setEquity] = useState(0);
const [wallet,setWallet] = useState({usd:0,btc:0});
const [position,setPosition] = useState(null);

const [trades,setTrades] = useState([]);
const [decisions,setDecisions] = useState([]);

const [engineUptime,setEngineUptime] = useState("0s");
const [timeLeft,setTimeLeft] = useState(null);

const [capital,setCapital] = useState({
total:0,
available:0,
locked:0
});

/* =====================================================
TRADE COUNTDOWN
===================================================== */

useEffect(()=>{

if(!position?.time || !position?.maxDuration){
setTimeLeft(null);
return;
}

const update=()=>{

const elapsed=Date.now()-position.time;
const remain=Math.max(position.maxDuration-elapsed,0);

setTimeLeft(remain);

};

update();

const timer=setInterval(update,1000);

return ()=>clearInterval(timer);

},[position]);

function formatTime(ms){

const s=Math.floor(ms/1000);
const m=Math.floor(s/60);
const sec=s%60;

return `${m}m ${sec}s`;

}

/* =====================================================
CANDLE GENERATOR
===================================================== */

function updateCandles(priceNow){

if(!Number.isFinite(priceNow)) return;

const now=Math.floor(Date.now()/1000);
const candleTime=Math.floor(now/CANDLE_SECONDS)*CANDLE_SECONDS;

const last=lastCandleRef.current;

setCandles(prev=>{

let next;

if(!last || last.time!==candleTime){

const newCandle={
time:candleTime,
open:priceNow,
high:priceNow,
low:priceNow,
close:priceNow
};

lastCandleRef.current=newCandle;

next=[...prev.slice(-MAX_CANDLES+1),newCandle];

}else{

const updated={
...last,
high:Math.max(last.high,priceNow),
low:Math.min(last.low,priceNow),
close:priceNow
};

lastCandleRef.current=updated;

next=[...prev];
next[next.length-1]=updated;

}

return next;

});

}

/* =====================================================
ENGINE SNAPSHOT
===================================================== */

async function loadEngineSnapshot(){

const token=getToken();
if(!token||!API_BASE) return;

try{

const res=await fetch(
`${API_BASE}/api/paper/status`,
{headers:{Authorization:`Bearer ${token}`}}
);

const data=await res.json();
const snap=data?.snapshot;

if(!snap) return;

setEquity(Number(snap.equity||0));

setWallet({
usd:Number(snap.cashBalance||0),
btc:Number(snap.position?.qty||0)
});

setPosition(snap.position||null);
setTrades(snap.trades||[]);
setDecisions(snap.decisions||[]);

setCapital({
total:Number(snap.totalCapital||snap.cashBalance||0),
available:Number(snap.availableCapital||snap.cashBalance||0),
locked:Number(snap.lockedCapital||0)
});

}catch{}

}

/* =====================================================
MARKET WS
===================================================== */

function connectMarket(){

const token=getToken();
if(!token||!API_BASE) return;

const url=new URL(API_BASE);
const protocol=url.protocol==="https:"?"wss:":"ws:";

const ws=new WebSocket(
`${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
);

marketWsRef.current=ws;

ws.onmessage=(msg)=>{

try{

const packet=JSON.parse(msg.data);

if(packet.channel!=="market") return;

const market=packet?.data?.[SYMBOL];
if(!market) return;

const p=Number(market.price);

if(Number.isFinite(p)){

setPrice(p);
updateCandles(p);

}

}catch{}

};

ws.onclose=()=>setTimeout(connectMarket,2000);

}

/* =====================================================
PAPER WS
===================================================== */

function connectPaper(){

const token=getToken();
if(!token||!API_BASE) return;

const url=new URL(API_BASE);
const protocol=url.protocol==="https:"?"wss:":"ws:";

const ws=new WebSocket(
`${protocol}//${url.host}/ws?channel=paper&token=${encodeURIComponent(token)}`
);

paperWsRef.current=ws;

ws.onmessage=(msg)=>{

try{

const data=JSON.parse(msg.data);

if(data.channel!=="paper") return;

if(!engineStartRef.current){
engineStartRef.current=data.engineStart||Date.now();
}

const snap=data.snapshot||{};

setEquity(Number(snap.equity||0));

setWallet({
usd:Number(snap.cashBalance||0),
btc:Number(snap.position?.qty||0)
});

setPosition(snap.position||null);
setTrades(snap.trades||[]);
setDecisions(snap.decisions||[]);

setCapital({
total:Number(snap.totalCapital||snap.cashBalance||0),
available:Number(snap.availableCapital||snap.cashBalance||0),
locked:Number(snap.lockedCapital||0)
});

}catch{}

};

ws.onclose=()=>setTimeout(connectPaper,2000);

}

/* =====================================================
INIT
===================================================== */

useEffect(()=>{

loadEngineSnapshot();
connectMarket();
connectPaper();

return ()=>{

try{marketWsRef.current?.close()}catch{}
try{paperWsRef.current?.close()}catch{}

};

},[]);

/* =====================================================
UI
===================================================== */

return(

<div style={{display:"flex",flex:1,background:"#0a0f1c",color:"#fff"}}>

<div style={{flex:1,padding:20,position:"relative"}}>

<div style={{fontWeight:700}}>{SYMBOL}</div>

<div style={{opacity:.7}}>
Live Price: {price ? price.toLocaleString() : "Loading"}
</div>

<TerminalChart
candles={candles}
trades={trades}
position={position}
/>

{position && timeLeft!==null && (

<div style={{
position:"absolute",
top:70,
right:40,
background:"#111827",
padding:"8px 12px",
borderRadius:8,
border:"1px solid rgba(255,255,255,.1)"
}}>

AI TRADE ACTIVE  
<br/>
Time Remaining: {formatTime(timeLeft)}

</div>

)}

<div style={{marginTop:20}}>
<AIBehaviorPanel
trades={trades}
decisions={decisions}
position={position}
/>
</div>

<div style={{marginTop:20}}>
<AIPerformanceHistoryPanel trades={trades}/>
</div>

</div>

<div style={{
width:260,
padding:16,
background:"#111827",
borderLeft:"1px solid rgba(255,255,255,.05)"
}}>

<OrderPanel symbol={SYMBOL} price={price}/>

<div style={{marginTop:20}}>

<h3>AI Engine</h3>

<div>Status: RUNNING</div>

<div style={{marginTop:12}}>
Equity: ${equity.toFixed(2)}
</div>

</div>

<div style={{marginTop:20}}>

<h3>AI Capital</h3>

<div>Total Capital: ${capital.total.toFixed(2)}</div>
<div>Available: ${capital.available.toFixed(2)}</div>
<div>In Trade: ${capital.locked.toFixed(2)}</div>

</div>

</div>

</div>

);

}

import React, { useEffect, useState } from "react";

const WS_BASE =
  (process.env.REACT_APP_WS || "ws://localhost:5000") + "/ws";

export default function TradingDashboard(){

  const [snapshot,setSnapshot] = useState({});
  const [decisions,setDecisions] = useState([]);
  const [price,setPrice] = useState(null);
  const [connected,setConnected] = useState(false);

  /* ================= WS CONNECT ================= */

  useEffect(()=>{

    const token = localStorage.getItem("as_token");

    if(!token) return;

    const ws = new WebSocket(
      `${WS_BASE}?token=${token}&channel=paper`
    );

    ws.onopen = ()=>{
      setConnected(true);
    };

    ws.onclose = ()=>{
      setConnected(false);
    };

    ws.onmessage = (event)=>{

      try{

        const msg = JSON.parse(event.data);

        if(msg.type !== "engine") return;

        const snap = msg.snapshot || {};

        setSnapshot(snap);

        if(Array.isArray(msg.decisions)){
          setDecisions(msg.decisions.slice().reverse());
        }

        if(snap?.lastPrice){
          setPrice(snap.lastPrice);
        }

      }catch{}

    };

    return ()=>ws.close();

  },[]);

  /* ================= RENDER ================= */

  return(

    <div style={{padding:40,fontFamily:"Arial"}}>

      <h1>AI Trading Dashboard</h1>

      <div style={{marginBottom:20}}>
        Status: {connected ? "CONNECTED" : "DISCONNECTED"}
      </div>

{/* =========================================================
ACCOUNT
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Account</h2>

        <div>Equity: ${Number(snapshot?.equity || 0).toFixed(2)}</div>
        <div>Cash: ${Number(snapshot?.cashBalance || 0).toFixed(2)}</div>
        <div>Peak Equity: ${Number(snapshot?.peakEquity || 0).toFixed(2)}</div>

      </div>

{/* =========================================================
POSITION
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Open Position</h2>

        {snapshot?.position ? (

          <div>

            <div>Symbol: {snapshot.position.symbol}</div>
            <div>Entry: {snapshot.position.entry}</div>
            <div>Quantity: {snapshot.position.qty}</div>

          </div>

        ) : (

          <div style={{color:"#777"}}>No open position</div>

        )}

      </div>

{/* =========================================================
MARKET
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Market</h2>

        <div>
          Last Price: {price ? price.toLocaleString() : "waiting for price feed..."}
        </div>

      </div>

{/* =========================================================
AI DECISIONS
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>AI Decisions</h2>

        {decisions.length === 0 && (
          <div style={{color:"#777"}}>
            Waiting for AI engine decisions...
          </div>
        )}

        <table border="1" cellPadding="6">

          <thead>

            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Price</th>
              <th>Risk %</th>
            </tr>

          </thead>

          <tbody>

            {decisions.slice(0,20).map((d,i)=>(
              <tr key={i}>

                <td>
                  {new Date(d.time).toLocaleTimeString()}
                </td>

                <td>{d.action}</td>

                <td>{d.price}</td>

                <td>{((d.riskPct || 0)*100).toFixed(2)}%</td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

{/* =========================================================
TRADES
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Recent Trades</h2>

        {(!snapshot?.trades || snapshot.trades.length===0) && (
          <div style={{color:"#777"}}>
            No trades yet
          </div>
        )}

        <table border="1" cellPadding="6">

          <thead>

            <tr>
              <th>Time</th>
              <th>PnL</th>
            </tr>

          </thead>

          <tbody>

            {snapshot?.trades?.slice(-20).map((t,i)=>(
              <tr key={i}>

                <td>
                  {new Date(t.time).toLocaleTimeString()}
                </td>

                <td style={{
                  color: t.pnl >=0 ? "green":"red"
                }}>
                  {Number(t.pnl || 0).toFixed(2)}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

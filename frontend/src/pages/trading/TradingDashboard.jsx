import React, { useEffect, useState } from "react";

const API = process.env.REACT_APP_API || "http://localhost:5000";

export default function TradingDashboard(){

  const [snapshot,setSnapshot] = useState(null);
  const [decisions,setDecisions] = useState([]);
  const [price,setPrice] = useState(null);
  const [loading,setLoading] = useState(true);

  const tenantId = "default";

/* =========================================================
FETCH SNAPSHOT
========================================================= */

  async function fetchSnapshot(){

    try{

      const res = await fetch(
        `${API}/api/trading/snapshot?tenantId=${tenantId}`
      );

      const data = await res.json();

      if(data?.snapshot){
        setSnapshot(data.snapshot);
      }

    }catch{}

  }

/* =========================================================
FETCH DECISIONS
========================================================= */

  async function fetchDecisions(){

    try{

      const res = await fetch(
        `${API}/api/trading/decisions?tenantId=${tenantId}`
      );

      const data = await res.json();

      if(Array.isArray(data)){
        setDecisions(data.reverse());
      }

    }catch{}

  }

/* =========================================================
FETCH PRICE
========================================================= */

  async function fetchPrice(){

    try{

      const res = await fetch(
        `${API}/api/trading/price?tenantId=${tenantId}`
      );

      const data = await res.json();

      if(data?.price){
        setPrice(data.price);
      }

    }catch{}

  }

/* =========================================================
AUTO REFRESH
========================================================= */

  useEffect(()=>{

    async function load(){

      await Promise.all([
        fetchSnapshot(),
        fetchDecisions(),
        fetchPrice()
      ]);

      setLoading(false);

    }

    load();

    const interval =
      setInterval(load,2000);

    return ()=>clearInterval(interval);

  },[]);

/* =========================================================
RENDER
========================================================= */

  if(loading){
    return <div style={{padding:40}}>Loading trading dashboard...</div>;
  }

  return(

    <div style={{padding:40,fontFamily:"Arial"}}>

      <h1>AI Trading Dashboard</h1>

{/* =========================================================
ACCOUNT
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Account</h2>

        <div>Equity: ${snapshot?.equity?.toFixed(2)}</div>
        <div>Cash: ${snapshot?.cashBalance?.toFixed(2)}</div>
        <div>Peak Equity: ${snapshot?.peakEquity?.toFixed(2)}</div>

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

          <div>No open position</div>

        )}

      </div>

{/* =========================================================
MARKET
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Market</h2>

        <div>Last Price: {price}</div>

      </div>

{/* =========================================================
DECISION STREAM
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>AI Decisions</h2>

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

                <td>{(d.riskPct*100).toFixed(2)}%</td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

{/* =========================================================
TRADE HISTORY
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Recent Trades</h2>

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
                  {t.pnl?.toFixed(2)}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

import React, { useState } from "react";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

export default function OrderPanel({ symbol="BTCUSDT", price=0 }) {

  const [side,setSide] = useState("BUY");
  const [orderType,setOrderType] = useState("MARKET");

  const [size,setSize] = useState("");
  const [limitPrice,setLimitPrice] = useState("");
  const [stopLoss,setStopLoss] = useState("");
  const [takeProfit,setTakeProfit] = useState("");
  const [risk,setRisk] = useState("");

  const [loading,setLoading] = useState(false);
  const [msg,setMsg] = useState("");

  function authHeader(){

    const token = getToken();

    return token
      ? {Authorization:`Bearer ${token}`}
      : {};
  }

  async function submitOrder(){

    if(!size){
      setMsg("Enter position size");
      return;
    }

    setLoading(true);
    setMsg("");

    try{

      const res =
        await fetch(
          `${API_BASE}/api/paper/order`,
          {
            method:"POST",
            headers:{
              "Content-Type":"application/json",
              ...authHeader()
            },
            body:JSON.stringify({
              symbol,
              side,
              type:orderType,
              qty:Number(size),
              price: orderType==="LIMIT" ? Number(limitPrice) : price,
              stopLoss: stopLoss ? Number(stopLoss) : null,
              takeProfit: takeProfit ? Number(takeProfit) : null,
              risk: risk ? Number(risk) : null
            })
          }
        );

      const data = await res.json();

      if(!data?.ok){
        setMsg("Order rejected");
      }else{
        setMsg("Order submitted");
        setSize("");
        setLimitPrice("");
        setStopLoss("");
        setTakeProfit("");
      }

    }catch{
      setMsg("Network error");
    }

    setLoading(false);

  }

  return(

    <div style={{
      width:270,
      background:"#111827",
      padding:16,
      borderLeft:"1px solid rgba(255,255,255,.06)",
      display:"flex",
      flexDirection:"column",
      gap:10
    }}>

      {/* SYMBOL */}

      <div style={{
        fontWeight:700,
        fontSize:14
      }}>
        {symbol}
      </div>

      {/* PRICE */}

      <div style={{
        fontSize:12,
        opacity:.7
      }}>
        Market Price: {price?.toLocaleString()}
      </div>

      {/* ORDER TYPE */}

      <div style={{
        display:"flex",
        gap:6
      }}>

        <button
          onClick={()=>setOrderType("MARKET")}
          style={{
            flex:1,
            background:
              orderType==="MARKET"
              ? "#2563eb"
              : "#1f2937",
            border:"none",
            padding:"6px 0",
            color:"#fff",
            borderRadius:6
          }}
        >
          Market
        </button>

        <button
          onClick={()=>setOrderType("LIMIT")}
          style={{
            flex:1,
            background:
              orderType==="LIMIT"
              ? "#2563eb"
              : "#1f2937",
            border:"none",
            padding:"6px 0",
            color:"#fff",
            borderRadius:6
          }}
        >
          Limit
        </button>

      </div>

      {/* SIDE */}

      <div style={{
        display:"flex",
        gap:6
      }}>

        <button
          onClick={()=>setSide("BUY")}
          style={{
            flex:1,
            background:
              side==="BUY"
              ? "#16a34a"
              : "#1f2937",
            border:"none",
            padding:"8px 0",
            color:"#fff",
            borderRadius:6
          }}
        >
          BUY
        </button>

        <button
          onClick={()=>setSide("SELL")}
          style={{
            flex:1,
            background:
              side==="SELL"
              ? "#dc2626"
              : "#1f2937",
            border:"none",
            padding:"8px 0",
            color:"#fff",
            borderRadius:6
          }}
        >
          SELL
        </button>

      </div>

      {/* SIZE */}

      <div>

        <div style={{fontSize:11,opacity:.6}}>
          Position Size
        </div>

        <input
          value={size}
          onChange={e=>setSize(e.target.value)}
          placeholder="0.01"
          style={{
            width:"100%",
            padding:8,
            marginTop:4,
            background:"#020617",
            border:"1px solid rgba(255,255,255,.08)",
            borderRadius:6,
            color:"#fff"
          }}
        />

      </div>

      {/* LIMIT PRICE */}

      {orderType==="LIMIT" && (

        <div>

          <div style={{fontSize:11,opacity:.6}}>
            Limit Price
          </div>

          <input
            value={limitPrice}
            onChange={e=>setLimitPrice(e.target.value)}
            placeholder="Enter price"
            style={{
              width:"100%",
              padding:8,
              marginTop:4,
              background:"#020617",
              border:"1px solid rgba(255,255,255,.08)",
              borderRadius:6,
              color:"#fff"
            }}
          />

        </div>

      )}

      {/* STOP LOSS */}

      <div>

        <div style={{fontSize:11,opacity:.6}}>
          Stop Loss
        </div>

        <input
          value={stopLoss}
          onChange={e=>setStopLoss(e.target.value)}
          placeholder="Optional"
          style={{
            width:"100%",
            padding:8,
            marginTop:4,
            background:"#020617",
            border:"1px solid rgba(255,255,255,.08)",
            borderRadius:6,
            color:"#fff"
          }}
        />

      </div>

      {/* TAKE PROFIT */}

      <div>

        <div style={{fontSize:11,opacity:.6}}>
          Take Profit
        </div>

        <input
          value={takeProfit}
          onChange={e=>setTakeProfit(e.target.value)}
          placeholder="Optional"
          style={{
            width:"100%",
            padding:8,
            marginTop:4,
            background:"#020617",
            border:"1px solid rgba(255,255,255,.08)",
            borderRadius:6,
            color:"#fff"
          }}
        />

      </div>

      {/* RISK */}

      <div>

        <div style={{fontSize:11,opacity:.6}}>
          Risk %
        </div>

        <input
          value={risk}
          onChange={e=>setRisk(e.target.value)}
          placeholder="1%"
          style={{
            width:"100%",
            padding:8,
            marginTop:4,
            background:"#020617",
            border:"1px solid rgba(255,255,255,.08)",
            borderRadius:6,
            color:"#fff"
          }}
        />

      </div>

      {/* EXECUTE */}

      <button
        onClick={submitOrder}
        disabled={loading}
        style={{
          marginTop:6,
          background:"#2563eb",
          border:"none",
          padding:"10px 0",
          borderRadius:6,
          color:"#fff",
          fontWeight:600
        }}
      >
        {loading ? "Sending..." : `Execute ${side}`}
      </button>

      {/* STATUS */}

      {msg && (

        <div style={{
          fontSize:12,
          opacity:.7
        }}>
          {msg}
        </div>

      )}

    </div>

  );

}

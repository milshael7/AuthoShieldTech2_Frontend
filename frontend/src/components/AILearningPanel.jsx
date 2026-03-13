import React, { useEffect, useState } from "react";
import { getToken } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

export default function AILearningPanel(){

  const [brain,setBrain] = useState(null);

  async function load(){

    const token = getToken();
    if(!token || !API_BASE) return;

    try{

      const res = await fetch(
        `${API_BASE}/api/ai/brain`,
        {headers:{Authorization:`Bearer ${token}`}}
      );

      const data = await res.json();

      if(data){
        setBrain(data);
      }

    }catch{}

  }

  useEffect(()=>{

    load();

    const t = setInterval(load,3000);

    return ()=>clearInterval(t);

  },[]);

  if(!brain){
    return <div className="postureCard">Loading AI brain...</div>;
  }

  const stats = brain.stats || {};
  const adaptive = brain.adaptive || {};
  const telemetry = brain.telemetry || {};

  return(

    <section className="postureCard" style={{marginBottom:20}}>

      <div style={{display:"flex",justifyContent:"space-between"}}>

        <div>
          <h2 style={{color:"#7ec8ff"}}>
            AI Learning Intelligence
          </h2>
          <small>
            Real-time reinforcement learning engine
          </small>
        </div>

        <span className="badge ok">
          ACTIVE
        </span>

      </div>

      <div style={{
        marginTop:20,
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
        gap:16
      }}>

        <div>
          <b>Decisions / Min</b>
          <div>{telemetry.decisionsPerMinute || 0}</div>
        </div>

        <div>
          <b>Trades Learned</b>
          <div>{stats.totalTrades || 0}</div>
        </div>

        <div>
          <b>Win Rate</b>
          <div>{((stats.winRate || 0)*100).toFixed(1)}%</div>
        </div>

        <div>
          <b>Expectancy</b>
          <div>{(stats.expectancy || 0).toFixed(2)}</div>
        </div>

        <div>
          <b>Signals Stored</b>
          <div>{brain.signalMemory || 0}</div>
        </div>

        <div>
          <b>Brain Confidence</b>
          <div>
            {(adaptive.confidenceBoost*100).toFixed(0)}%
          </div>
        </div>

        <div>
          <b>Edge Amplifier</b>
          <div>
            {(adaptive.edgeAmplifier).toFixed(2)}
          </div>
        </div>

        <div>
          <b>Engine Uptime</b>
          <div>
            {Math.floor((telemetry.uptime||0)/60)} min
          </div>
        </div>

      </div>

    </section>

  );

}

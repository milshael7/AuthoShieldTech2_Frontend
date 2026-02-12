import React, { useEffect, useMemo, useRef, useState } from "react";

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function apiBase() {
  return ((import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || "").trim());
}

function fmtPct(n){
  const x = Number(n);
  if(!Number.isFinite(x)) return "—";
  return `${Math.round(x)}%`;
}

export default function SecurityRadar(){
  const [status, setStatus] = useState("Loading…");
  const [posture, setPosture] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let t;
    const base = apiBase();
    if(!base){ setStatus("Missing API"); return; }

    async function load(){
      try{
        const res = await fetch(`${base}/api/security/posture`, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if(!res.ok) throw new Error();
        setPosture(data.posture);
        setStatus("LIVE");
      }catch{
        setStatus("ERROR");
      }
    }

    load();
    t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const domains = useMemo(() => posture?.domains || [], [posture]);
  const score = posture?.score ?? 0;
  const tier = posture?.tier ?? "—";
  const risk = posture?.risk ?? "—";
  const trend = posture?.trend ?? "—";

  const maxIssues = useMemo(
    () => Math.max(1, ...domains.map(d => Number(d.issues)||0)),
    [domains]
  );

  /* ================= RADAR DRAW ================= */

  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    if(!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0,0,cssW,cssH);

    const bg = ctx.createLinearGradient(0,0,0,cssH);
    bg.addColorStop(0,"rgba(20,25,35,0.7)");
    bg.addColorStop(1,"rgba(10,14,20,0.9)");
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,cssW,cssH);

    const n = domains.length || 6;
    const cx = cssW * 0.5;
    const cy = cssH * 0.55;
    const R  = Math.min(cssW, cssH) * 0.34;

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    for(let k=1;k<=5;k++){
      const r = (R*k)/5;
      ctx.beginPath();
      for(let i=0;i<n;i++){
        const a = (Math.PI*2*i)/n - Math.PI/2;
        const x = cx + Math.cos(a)*r;
        const y = cy + Math.sin(a)*r;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    if(!domains.length) return;

    ctx.fillStyle = "rgba(122,167,255,0.25)";
    ctx.strokeStyle = "rgba(122,167,255,0.95)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    for(let i=0;i<n;i++){
      const d = domains[i];
      const cov = clamp((Number(d.coverage)||0)/100, 0, 1);
      const a = (Math.PI*2*i)/n - Math.PI/2;
      const x = cx + Math.cos(a)*R*cov;
      const y = cy + Math.sin(a)*R*cov;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  }, [domains]);

  /* ================= UI ================= */

  return (
    <div className="card">

      {/* ===== EXECUTIVE SCORE HEADER ===== */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div>
          <div style={{fontSize:12,opacity:.6}}>Security Posture Score</div>
          <div style={{fontSize:32,fontWeight:900}}>{score}</div>
          <div style={{fontSize:13,marginTop:4}}>
            Tier: <b>{tier}</b> • Risk: <b>{risk}</b> • Trend: {trend}
          </div>
        </div>

        <span className={`badge ${status==="LIVE"?"ok":""}`}>
          {status}
        </span>
      </div>

      {/* ===== RADAR ===== */}
      <div style={{height:380}}>
        <canvas
          ref={canvasRef}
          style={{
            width:"100%",
            height:"100%",
            borderRadius:18,
            border:"1px solid rgba(255,255,255,0.10)"
          }}
        />
      </div>

      {/* ===== TABLE ===== */}
      <div style={{marginTop:18}}>
        <table className="table">
          <thead>
            <tr>
              <th>Control</th>
              <th>Coverage</th>
              <th>Issues</th>
            </tr>
          </thead>
          <tbody>
            {domains.map(d=>(
              <tr key={d.key}>
                <td>{d.label}</td>
                <td>{fmtPct(d.coverage)}</td>
                <td>{d.issues}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

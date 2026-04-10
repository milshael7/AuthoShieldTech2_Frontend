// ==========================================================
// 🔒 AUTOSHIELD TECH — v41.0 (PRODUCTION PULSE)
// FILE: frontend/src/pages/public/Landing.jsx
// ==========================================================

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { WS_URL } from "../../lib/api.js"; 
import "../../styles/main.css";

export default function Landing() {
  const navigate = useNavigate();
  
  // 🛰️ LIVE STATE
  const [livePrice, setLivePrice] = useState(71720.09);
  const [isLive, setIsLive] = useState(false);
  const wsRef = useRef(null);

  /**
   * 🛰️ PUSH 4.1 FIX: UNIFIED MARKET BRIDGE
   * Syncs with the backend broadcast logic from Push 1.
   */
  useEffect(() => {
    // Vercel/Production safety: Ensure we use wss if on https
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const cleanHost = (WS_URL || "").replace(/^wss?:\/\//, "").replace(/\/+$/, "");
    
    if (!cleanHost) return;

    function connect() {
      // Connecting to the unified broadcast channel
      const ws = new WebSocket(`${protocol}://${cleanHost}/ws`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          
          // 🛰️ PUSH 4.1 FIX: Normalized Payload Check
          // Matches the backend structure: { type: 'snapshot', data: { price: ... } }
          const priceData = msg?.data?.price || msg?.price || msg?.lastPrice;
          
          if (priceData) {
            setLivePrice(Number(priceData));
            setIsLive(true);
          }
        } catch (err) { /* silent heartbeat */ }
      };

      ws.onopen = () => setIsLive(true);
      ws.onclose = () => {
        setIsLive(false);
        setTimeout(connect, 5000); 
      };
    }

    connect();
    return () => wsRef.current?.close();
  }, []);

  const scrollToFreeTools = useCallback(() => {
    const el = document.getElementById("free-tools");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="landing-page">
      {/* --- HEADER --- */}
      <header className="public-header">
        <div className="brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <div style={{ fontWeight: 900, letterSpacing: "0.2em", color: "#00ff88" }}>
            AUTOSHIELD
          </div>
        </div>
        <nav className="public-nav">
          <button className="text-btn" onClick={() => navigate("/login")}>Sign In</button>
          <button className="primary-btn" onClick={() => navigate("/pricing")}>Get Started</button>
        </nav>
      </header>

      {/* --- HERO --- */}
      <section className="hero">
        <div className="hero-content">
          <div className={`live-ticker ${isLive ? 'pulse' : ''}`}>
             <span className="status-dot"></span>
             <span className="ticker-label">ENGINE_FEED_LIVE: </span>
             <span className="ticker-value">BTC/USD ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <h1>
            Professional Cybersecurity Operations
            <span className="accent-text"> Built for Real Scale.</span>
          </h1>

          <p className="hero-sub">
            Unified visibility and AI-driven market intelligence — 
            without the noise of traditional trading gimmicks.
          </p>

          <div className="hero-actions">
            <button className="primary-btn lg" onClick={() => navigate("/pricing")}>Explore Plans</button>
            <button className="outline-btn lg" onClick={scrollToFreeTools}>Free Analysis</button>
          </div>
        </div>
      </section>

      {/* --- FREE TOOLS --- */}
      <section id="free-tools" className="free-tools">
        <div className="section-header">
          <h2>Free Operational Tools</h2>
          <p className="muted">Immediate insights. No credential entry required.</p>
        </div>
        
        <div className="tool-grid">
          {[
            { title: "Exposure Scan", desc: "Identify publicly visible asset risks.", limit: "Read-Only" },
            { title: "Posture Snapshot", desc: "High-level gap analysis & scoring.", limit: "Manual" },
            { title: "Risk Preview", desc: "AI-driven prioritization of attack vectors.", limit: "Limited" },
            { title: "Pulse Check", desc: "Real-time market connectivity audit.", limit: "Standard" },
          ].map((tool) => (
            <div key={tool.title} className="tool-card">
              <div className="tool-tag">{tool.limit}</div>
              <h3>{tool.title}</h3>
              <p className="muted">{tool.desc}</p>
              <button onClick={() => navigate("/pricing")} className="tool-btn">Access Tool</button>
            </div>
          ))}
        </div>
      </section>

      {/* --- PLATFORM PREVIEW --- */}
      <section className="platform-preview">
        <div className="preview-container">
          <h2>Platform Capability Matrix</h2>
          <div className="preview-grid">
            <Preview title="Core Intelligence" text="Autonomous market logic handling multi-asset synchronization." />
            <Preview title="Threat Perimeter" text="Real-time guarding against slippage and volatility spikes." />
            <Preview title="Audit Pipeline" text="Every decision logged to an immutable, executive-ready record." />
            <Preview title="AutoDev 6.5" text="The execution engine behind the shield. Secure. Fast. Stable." />
          </div>
        </div>
      </section>

      <footer className="public-footer">
        <div className="footer-content">
          <p>AutoShield Tech // Secure Trading Operations</p>
          <p className="copyright">© 2026 STEALTH OPS // ALL RIGHTS RESERVED</p>
        </div>
      </footer>
    </div>
  );
}

function Preview({ title, text }) {
  return (
    <div className="preview-item">
      <h4>{title}</h4>
      <p className="muted">{text}</p>
    </div>
  );
}

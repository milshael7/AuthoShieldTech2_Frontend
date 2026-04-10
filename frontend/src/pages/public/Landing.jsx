// ==========================================================
// 🔒 AUTOSHIELD TECH — v40.0 (LIVE-FLOW ENABLED)
// FILE: frontend/src/pages/public/Landing.jsx
// ==========================================================

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { WS_URL } from "../../lib/api.js"; 
import "../../styles/main.css";

export default function Landing() {
  const navigate = useNavigate();
  
  // 🛰️ LIVE STATE: Bringing the landing page to life
  const [livePrice, setLivePrice] = useState(71720.09);
  const [isLive, setIsLive] = useState(false);
  const wsRef = useRef(null);

  // ---- 🛰️ LIVE DATA BRIDGE: Connects public page to backend market stream
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const cleanHost = (WS_URL || "").replace(/^wss?:\/\//, "").replace(/\/+$/, "");
    
    if (!cleanHost) return;

    function connect() {
      const ws = new WebSocket(`${protocol}://${cleanHost}/ws?channel=market`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          // Backend pushes: { type: "market", data: { BTCUSDT: { price: ... } } }
          const btc = msg?.data?.BTCUSDT?.price || msg?.price;
          if (btc) {
            setLivePrice(Number(btc));
            setIsLive(true);
          }
        } catch (err) { /* silent pulse */ }
      };

      ws.onclose = () => setTimeout(connect, 5000); // Auto-reconnect
    }

    connect();
    return () => wsRef.current?.close();
  }, []);

  const scrollToFreeTools = useCallback(() => {
    try {
      const el = document.getElementById("free-tools");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } catch { /* fail silently */ }
  }, []);

  return (
    <div className="landing-page">
      {/* ================= HEADER ================= */}
      <header className="public-header">
        <div className="brand">
          <div style={{ fontWeight: 900, letterSpacing: "0.12em", color: "#7AA7FF" }}>
            AUTOSHIELD
          </div>
        </div>
        <nav className="public-nav">
          <button onClick={() => navigate("/login")}>Sign In</button>
          <button className="primary" onClick={() => navigate("/pricing")}>Get Started</button>
        </nav>
      </header>

      {/* ================= HERO ================= */}
      <section className="hero">
        <h1>
          Professional Cybersecurity Operations
          <br />
          Built for Real Companies
        </h1>

        {/* ⚡ LIVE FEED: Shows real movement on the front page */}
        <div className="live-ticker">
           <span className={`status-dot ${isLive ? 'active' : ''}`}></span>
           <span className="ticker-label">LIVE ENGINE FEED: </span>
           <span className="ticker-value">BTC/USDT ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <p className="muted">
          Visibility, control, and accountability — without shortcuts,
          gimmicks, or uncontrolled automation.
        </p>

        <div className="hero-actions">
          <button className="primary" onClick={() => navigate("/pricing")}>Explore Plans</button>
          <button onClick={scrollToFreeTools}>Try Free Tools</button>
        </div>
      </section>

      {/* ================= FREE TOOLS ================= */}
      <section id="free-tools" className="free-tools">
        <h2>Free Cybersecurity Tools</h2>
        <p className="muted center">Limited access. No signup required. Upgrade anytime.</p>
        <div className="tool-grid">
          {[
            { title: "External Exposure Scan", desc: "Identify publicly visible risks.", items: ["1 asset scan", "Read-only", "No history"] },
            { title: "Security Posture Snapshot", desc: "High-level view of security gaps.", items: ["Basic scoring", "No remediation", "No automation"] },
            { title: "Phishing Risk Check", desc: "Evaluate exposure to phishing.", items: ["Manual assessment", "No monitoring", "No alerting"] },
            { title: "Asset Risk Preview", desc: "See how attackers prioritize assets.", items: ["Limited assets", "No correlations", "No incident linking"] },
          ].map((tool) => (
            <div key={tool.title} className="tool-card">
              <h3>{tool.title}</h3>
              <p className="muted">{tool.desc}</p>
              <ul>{tool.items.map((i) => <li key={i}>{i}</li>)}</ul>
              <button onClick={() => navigate("/pricing")}>Upgrade for Full Access</button>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PLATFORM PREVIEW ================= */}
      <section className="platform-preview">
        <h2>Inside the Platform</h2>
        <div className="preview-grid">
          <Preview title="Security Posture" text="Continuous visibility into risk and control health." />
          <Preview title="Threats & Incidents" text="Priority-driven detection and response workflows." />
          <Preview title="Reports & Audits" text="Executive-ready reporting with immutable records." />
          <Preview title="AutoDev 6.5" text="Advanced cybersecurity execution — individual only." />
        </div>
        <div className="center">
          <button className="primary" onClick={() => navigate("/pricing")}>View Plans</button>
        </div>
      </section>

      <footer className="public-footer">
        <p>AutoShield Tech is a professional cybersecurity platform.</p>
        <p>© 2026 Stealth Operations</p>
      </footer>
    </div>
  );
}

function Preview({ title, text }) {
  return (
    <div>
      <h4>{title}</h4>
      <p className="muted">{text}</p>
    </div>
  );
}

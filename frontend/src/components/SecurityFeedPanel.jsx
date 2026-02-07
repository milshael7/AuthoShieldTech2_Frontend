// frontend/src/components/SecurityFeedPanel.jsx
// Step 19 — Live Cybersecurity Feed Panel
// AuthoDev 6.5 • Professional • Long-form • Shareable • Speakable

import React, { useEffect, useState } from "react";

/* ================= HELPERS ================= */

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.pitch = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function copy(text) {
  navigator.clipboard?.writeText(text);
}

function formatTime(iso) {
  return new Date(iso).toLocaleString();
}

/* ================= COMPONENT ================= */

export default function SecurityFeedPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/security/events?limit=50");
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // live refresh
    return () => clearInterval(t);
  }, []);

  return (
    <div style={panel}>
      <h3 style={title}>Live Security Activity</h3>

      {loading && <div style={muted}>Loading security events…</div>}

      {!loading && events.length === 0 && (
        <div style={muted}>No security events detected yet.</div>
      )}

      <div style={list}>
        {events.map((e) => {
          const explanation = `
Security Alert (${e.severity.toUpperCase()})

Time:
${formatTime(e.iso)}

What happened:
${e.description}

Source:
${e.source || "Unknown"}

Target:
${e.target || "Not specified"}

AuthoDev 6.5 assessment:
This event was detected and logged by the AutoShield security engine.
Based on severity and context, it ${
            e.severity === "high"
              ? "requires immediate attention"
              : "should be reviewed and monitored"
          }.
`.trim();

          return (
            <div key={e.id} style={card}>
              <div style={meta}>
                <b>{e.type}</b>
                <span style={badge(e.severity)}>{e.severity}</span>
              </div>

              <div style={body}>
                <p style={text}>{explanation}</p>
              </div>

              {/* ===== ACTION BAR (LIKE YOUR SCREENSHOT) ===== */}
              <div style={actions}>
                <button style={iconBtn} onClick={() => copy(explanation)}>
                  📋 Copy
                </button>
                <button style={iconBtn} onClick={() => speak(explanation)}>
                  🔊 Speak
                </button>
                <button style={iconBtn}>👍</button>
                <button style={iconBtn}>👎</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const panel = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const title = {
  fontSize: 18,
  fontWeight: 800,
};

const muted = {
  opacity: 0.6,
  fontSize: 14,
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const card = {
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 14,
};

const meta = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const body = {
  fontSize: 14,
  lineHeight: 1.6,
};

const text = {
  whiteSpace: "pre-wrap",
};

const actions = {
  display: "flex",
  gap: 10,
  marginTop: 10,
  borderTop: "1px solid rgba(255,255,255,0.1)",
  paddingTop: 8,
};

const iconBtn = {
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  opacity: 0.85,
};

function badge(sev) {
  return {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background:
      sev === "high"
        ? "#ff5a5f"
        : sev === "medium"
        ? "#ffd166"
        : "#2bd576",
    color: "#000",
  };
}

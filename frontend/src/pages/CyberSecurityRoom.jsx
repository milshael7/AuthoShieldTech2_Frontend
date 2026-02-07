// frontend/src/pages/CyberSecurityRoom.jsx
// Cybersecurity Operations Room
// AuthoDev 6.5 mounted as primary AI assistant

import React, { useCallback } from "react";
import AuthoDevPanel from "../components/AuthoDevPanel";

/* ================= PAGE ================= */

export default function CyberSecurityRoom() {
  /**
   * Context injected into AuthoDev 6.5
   * This is how it "knows where it is"
   */
  const getContext = useCallback(() => {
    return {
      platform: "AutoShield",
      room: "CyberSecurityRoom",

      cybersecurity: {
        active_incidents: 2,
        threat_level: "medium",
        last_alert: "Suspicious login attempt blocked",
        monitored_assets: 14,
      },

      operator: {
        role: "admin",
        permissions: ["view", "respond", "investigate"],
      },
    };
  }, []);

  return (
    <div className="cyber-room">
      {/* ===== HEADER ===== */}
      <header className="cr-header">
        <div>
          <h2>Cybersecurity Operations Room</h2>
          <p className="muted">
            Live security monitoring, incident response, and AI assistance
          </p>
        </div>

        <div className="cr-status">
          <span className="badge warn">Threat Level: Medium</span>
          <span className="badge ok">System Online</span>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="cr-body">
        {/* ===== LEFT: PANELS ===== */}
        <section className="cr-panel">
          <h3>Security Overview</h3>

          <ul className="overview">
            <li><b>Active Incidents:</b> 2</li>
            <li><b>Blocked Attacks Today:</b> 17</li>
            <li><b>Monitored Assets:</b> 14</li>
            <li><b>Last Alert:</b> Suspicious login attempt blocked</li>
          </ul>
        </section>

        {/* ===== RIGHT: AUTHODEV AI ===== */}
        <section className="cr-panel ai">
          <AuthoDevPanel
            title="AuthoDev 6.5 — Cybersecurity Assistant"
            endpoint="/api/ai/chat"
            getContext={getContext}
          />
        </section>
      </div>

      {/* ================= STYLES ================= */}
      <style>{`
        .cyber-room {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
        }

        .cr-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .muted {
          opacity: 0.7;
          font-size: 13px;
        }

        .cr-status {
          display: flex;
          gap: 8px;
        }

        .badge {
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .badge.warn {
          background: #ffd166;
          color: #000;
        }

        .badge.ok {
          background: #2bd576;
          color: #000;
        }

        .cr-body {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: 16px;
        }

        .cr-panel {
          background: rgba(0,0,0,.25);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }

        .cr-panel.ai {
          min-height: 520px;
        }

        .overview {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .cr-body {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

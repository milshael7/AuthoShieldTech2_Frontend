import React, { useEffect, useState } from "react";

/**
 * Notifications.jsx
 * SOC-style Notifications & Alerts
 * Matches Posture dashboard look & feel
 * UI-only (safe to wire backend later)
 */

export default function Notifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Placeholder data (backend can replace later)
    setItems([
      {
        id: 1,
        level: "warn",
        title: "Suspicious Login Attempt",
        message: "Multiple failed login attempts detected from a new location.",
        time: "2 minutes ago",
      },
      {
        id: 2,
        level: "ok",
        title: "Security Scan Completed",
        message: "Daily posture scan completed with no critical findings.",
        time: "1 hour ago",
      },
      {
        id: 3,
        level: "bad",
        title: "Outdated Endpoint Agent",
        message: "One device is running an outdated security agent.",
        time: "Yesterday",
      },
    ]);
  }, []);

  return (
    <div className="postureWrap">
      {/* ================= LEFT: NOTIFICATIONS ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div className="postureTitle">
            <h2>Notifications</h2>
            <small>System alerts, security events, and AI activity</small>
          </div>
        </div>

        {items.length === 0 && (
          <p className="muted">No notifications available.</p>
        )}

        <ul className="list" style={{ marginTop: 16 }}>
          {items.map((n) => (
            <li key={n.id}>
              <span className={`dot ${n.level}`} />
              <div>
                <b>{n.title}</b>
                <div>
                  <small>{n.message}</small>
                </div>
                <small className="muted">{n.time}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ================= RIGHT: CONTEXT / STATUS ================= */}
      <aside className="postureCard">
        <h3>Notification Center</h3>
        <p className="muted">
          This panel surfaces important system events, security alerts,
          and automated findings. Review warnings promptly and resolve
          critical issues to maintain a healthy security posture.
        </p>

        <ul className="list">
          <li>
            <span className="dot ok" />
            <div>
              <b>System Operational</b>
              <small>No active outages detected</small>
            </div>
          </li>
          <li>
            <span className="dot warn" />
            <div>
              <b>Attention Required</b>
              <small>Some alerts need review</small>
            </div>
          </li>
        </ul>
      </aside>
    </div>
  );
}

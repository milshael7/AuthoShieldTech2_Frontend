import React, { useEffect, useState } from "react";

/**
 * Notifications.jsx
 * SOC-style Notifications & Alerts
 *
 * ROLE:
 * - System alerts
 * - Security findings
 * - Operational signals
 *
 * SAFE:
 * - UI only
 * - No backend dependency
 * - Matches platform.css + layout.css
 */

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all"); // all | ok | warn | bad

  useEffect(() => {
    setItems([
      {
        id: 1,
        level: "warn",
        title: "Suspicious Login Attempt",
        message:
          "Multiple failed login attempts detected from a new location.",
        time: "2 minutes ago",
      },
      {
        id: 2,
        level: "ok",
        title: "Security Scan Completed",
        message:
          "Daily posture scan completed with no critical findings.",
        time: "1 hour ago",
      },
      {
        id: 3,
        level: "bad",
        title: "Outdated Endpoint Agent",
        message:
          "One device is running an outdated security agent.",
        time: "Yesterday",
      },
    ]);
  }, []);

  const visible = filter === "all"
    ? items
    : items.filter((i) => i.level === filter);

  return (
    <div className="postureWrap">
      {/* ================= LEFT ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Notifications</h2>
            <small>System alerts and security events</small>
          </div>

          {/* FILTER */}
          <div className="ctrlRow">
            {["all", "ok", "warn", "bad"].map((f) => (
              <button
                key={f}
                className={`pill ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "All"
                  : f === "ok"
                  ? "OK"
                  : f === "warn"
                  ? "Warnings"
                  : "Critical"}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 && (
          <p className="muted" style={{ marginTop: 16 }}>
            No notifications for this filter.
          </p>
        )}

        <ul className="list" style={{ marginTop: 18 }}>
          {visible.map((n) => (
            <li key={n.id}>
              <span className={`dot ${n.level}`} />
              <div>
                <b>{n.title}</b>
                <small>{n.message}</small>
                <div className="muted">{n.time}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ================= RIGHT ================= */}
      <aside className="postureCard">
        <h3>Notification Center</h3>
        <p className="muted">
          This panel highlights important operational and security
          events. Address warnings promptly to maintain posture health.
        </p>

        <ul className="list">
          <li>
            <span className="dot ok" />
            <div>
              <b>System Operational</b>
              <small>No outages detected</small>
            </div>
          </li>
          <li>
            <span className="dot warn" />
            <div>
              <b>Review Required</b>
              <small>Some alerts need attention</small>
            </div>
          </li>
        </ul>
      </aside>
    </div>
  );
}

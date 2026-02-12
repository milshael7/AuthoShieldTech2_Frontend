import React, { useEffect, useState } from "react";

function apiBase() {
  return (
    (import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL ||
      "").trim()
  );
}

export default function VisitorAnalytics() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("Loading…");

  useEffect(() => {
    const base = apiBase();
    if (!base) {
      setStatus("Missing API");
      return;
    }

    async function load() {
      try {
        const res = await fetch(
          `${base}/api/security/analytics/visitors`,
          { credentials: "include" }
        );

        const data = await res.json();
        if (!res.ok) throw new Error();

        setStats(data.stats);
        setStatus("LIVE");
      } catch {
        setStatus("ERROR");
      }
    }

    load();
  }, []);

  if (!stats) {
    return (
      <div className="card">
        <b>Visitor Intelligence</b>
        <div style={{ marginTop: 10 }}>{status}</div>
      </div>
    );
  }

  const countries = Object.entries(stats.byCountry || {}).sort(
    (a, b) => b[1] - a[1]
  );

  const pages = Object.entries(stats.byPath || {}).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <b>Visitor Intelligence</b>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Total Visits: {stats.totalVisits}
          </div>
        </div>
        <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
          {status}
        </span>
      </div>

      {/* Countries */}
      <div style={{ marginTop: 20 }}>
        <b>Top Countries</b>
        <table className="table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Country</th>
              <th>Visits</th>
            </tr>
          </thead>
          <tbody>
            {countries.map(([country, count]) => (
              <tr key={country}>
                <td>{country}</td>
                <td>{count}</td>
              </tr>
            ))}
            {countries.length === 0 && (
              <tr>
                <td colSpan="2">No data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pages */}
      <div style={{ marginTop: 30 }}>
        <b>Most Visited Pages</b>
        <table className="table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Path</th>
              <th>Visits</th>
            </tr>
          </thead>
          <tbody>
            {pages.map(([path, count]) => (
              <tr key={path}>
                <td>{path}</td>
                <td>{count}</td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan="2">No data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

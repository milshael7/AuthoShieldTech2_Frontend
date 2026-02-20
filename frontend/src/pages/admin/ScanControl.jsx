// frontend/src/pages/admin/ScanControl.jsx
// Admin Scan Control — Platform Wide • Override Engine • Enterprise Authority

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api";

export default function ScanControl() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadScans();
  }, []);

  async function loadScans() {
    try {
      const token = getToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/me/scans`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to load scans");

      const data = await res.json();
      setScans(data.scans || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function forceComplete(scanId) {
    try {
      const token = getToken();

      await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/scan/${scanId}/force-complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loadScans();
    } catch {
      alert("Failed to force complete");
    }
  }

  async function cancelScan(scanId) {
    try {
      const token = getToken();

      await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/scan/${scanId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loadScans();
    } catch {
      alert("Failed to cancel scan");
    }
  }

  async function overrideRisk(scanId) {
    const newScore = prompt("Enter new risk score:");

    if (!newScore) return;

    try {
      const token = getToken();

      await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/scan/${scanId}/override-risk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ riskScore: Number(newScore) }),
        }
      );

      loadScans();
    } catch {
      alert("Failed to override risk");
    }
  }

  const filteredScans = statusFilter
    ? scans.filter((s) => s.status === statusFilter)
    : scans;

  function renderStatus(status) {
    switch (status) {
      case "awaiting_payment":
        return <span className="badge warn">Awaiting Payment</span>;
      case "running":
        return <span className="badge info">Running</span>;
      case "completed":
        return <span className="badge ok">Completed</span>;
      case "cancelled":
        return <span className="badge bad">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  }

  return (
    <div className="pageWrap">
      <div className="pageTop">
        <h2>Admin Scan Control</h2>
      </div>

      {loading && <p>Loading scans...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && (
        <>
          <div className="filterBar">
            <label>Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="">All</option>
              <option value="awaiting_payment">
                Awaiting Payment
              </option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">
                Completed
              </option>
              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </div>

          {filteredScans.map((scan) => (
            <div key={scan.id} className="scanCard">
              <div className="scanHeader">
                <div>
                  <strong>{scan.toolName}</strong>
                  <small>{scan.email}</small>
                </div>
                {renderStatus(scan.status)}
              </div>

              <div className="scanBody">
                <p>
                  <strong>Price:</strong> $
                  {scan.finalPrice}
                </p>
                <p>
                  <strong>Risk:</strong>{" "}
                  {
                    scan.result?.overview
                      ?.riskScore
                  }
                </p>
              </div>

              <div className="adminActions">
                {scan.status !== "completed" && (
                  <button
                    className="secondaryBtn"
                    onClick={() =>
                      forceComplete(scan.id)
                    }
                  >
                    Force Complete
                  </button>
                )}

                {scan.status !== "cancelled" && (
                  <button
                    className="secondaryBtn"
                    onClick={() =>
                      cancelScan(scan.id)
                    }
                  >
                    Cancel
                  </button>
                )}

                {scan.status === "completed" && (
                  <button
                    className="primaryBtn"
                    onClick={() =>
                      overrideRisk(scan.id)
                    }
                  >
                    Override Risk
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

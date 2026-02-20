// frontend/src/pages/Scans.jsx
// Scan History — Payment Aware • Status Aware • Revenue Ready

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../lib/api";

export default function Scans() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadScans();
  }, []);

  async function loadScans() {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/me/scans`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load scans");
      }

      const data = await res.json();
      setScans(data.scans || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function renderStatus(scan) {
    switch (scan.status) {
      case "awaiting_payment":
        return <span className="badge warn">Awaiting Payment</span>;
      case "pending":
        return <span className="badge">Queued</span>;
      case "running":
        return <span className="badge info">Running</span>;
      case "completed":
        return <span className="badge ok">Completed</span>;
      default:
        return <span className="badge">{scan.status}</span>;
    }
  }

  function formatDate(d) {
    if (!d) return "-";
    return new Date(d).toLocaleString();
  }

  return (
    <div className="pageWrap">
      <div className="pageTop">
        <h2>Scan History</h2>
        <button
          className="primaryBtn"
          onClick={() => navigate("/user/run-scan")}
        >
          Run New Scan
        </button>
      </div>

      {loading && <p>Loading scans...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && scans.length === 0 && (
        <div className="emptyState">
          <p>No scans yet.</p>
          <button
            className="primaryBtn"
            onClick={() => navigate("/user/run-scan")}
          >
            Start Your First Scan
          </button>
        </div>
      )}

      {!loading && scans.length > 0 && (
        <div className="scanGrid">
          {scans.map((scan) => (
            <div key={scan.id} className="scanCard">
              <div className="scanHeader">
                <div>
                  <strong>{scan.toolName}</strong>
                  <small>
                    Created: {formatDate(scan.createdAt)}
                  </small>
                </div>
                {renderStatus(scan)}
              </div>

              <div className="scanBody">
                <p>
                  <strong>Price:</strong> ${scan.finalPrice}
                </p>

                {scan.status === "completed" && scan.result && (
                  <>
                    <p>
                      <strong>Risk Score:</strong>{" "}
                      {scan.result.overview?.riskScore}
                    </p>
                    <p>
                      <strong>Risk Level:</strong>{" "}
                      {scan.result.overview?.riskLevel}
                    </p>
                  </>
                )}

                {scan.status === "awaiting_payment" && (
                  <p className="warnText">
                    Payment required before processing.
                  </p>
                )}

                {scan.status === "running" && (
                  <p>Scan in progress. Results coming shortly.</p>
                )}
              </div>

              {scan.status === "completed" && (
                <div className="scanFooter">
                  <button
                    className="secondaryBtn"
                    onClick={() =>
                      alert(
                        JSON.stringify(scan.result, null, 2)
                      )
                    }
                  >
                    View Full Report
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

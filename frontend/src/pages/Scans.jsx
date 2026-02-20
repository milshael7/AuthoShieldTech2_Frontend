// frontend/src/pages/Scans.jsx
// Scan History — Live Polling • Payment Retry • Modal Report Viewer

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getSavedUser } from "../lib/api";

export default function Scans() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const navigate = useNavigate();

  /* ================= LOAD SCANS ================= */

  useEffect(() => {
    loadScans();
  }, []);

  /* ================= AUTO POLLING ================= */

  useEffect(() => {
    const hasActive = scans.some(
      (s) => s.status === "running" || s.status === "pending"
    );

    if (!hasActive) return;

    const interval = setInterval(() => {
      loadScans(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [scans]);

  async function loadScans(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
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
      if (showLoader) setLoading(false);
    }
  }

  /* ================= PAYMENT RETRY ================= */

  async function retryPayment(scan) {
    try {
      const token = getToken();
      const user = getSavedUser();

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/public-scans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            toolId: scan.toolId,
            email: user?.email,
            inputData: scan.inputData,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment retry failed");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (e) {
      alert(e.message);
    }
  }

  /* ================= HELPERS ================= */

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

  /* ================= RENDER ================= */

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

      {!loading && scans.length === 0 && (
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
                  <>
                    <p className="warnText">
                      Payment required before processing.
                    </p>
                    <button
                      className="primaryBtn"
                      onClick={() => retryPayment(scan)}
                    >
                      Complete Payment
                    </button>
                  </>
                )}

                {scan.status === "running" && (
                  <p>Scan in progress. Auto-refreshing…</p>
                )}
              </div>

              {scan.status === "completed" && (
                <div className="scanFooter">
                  <button
                    className="secondaryBtn"
                    onClick={() => setSelectedReport(scan)}
                  >
                    View Full Report
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= REPORT MODAL ================= */}

      {selectedReport && (
        <div className="modalOverlay">
          <div className="modalCard">
            <h3>{selectedReport.toolName} Report</h3>

            <p>
              <strong>Risk Score:</strong>{" "}
              {selectedReport.result?.overview?.riskScore}
            </p>
            <p>
              <strong>Risk Level:</strong>{" "}
              {selectedReport.result?.overview?.riskLevel}
            </p>

            <p style={{ marginTop: 12 }}>
              <strong>Findings:</strong>
            </p>
            <ul>
              {selectedReport.result?.findings?.map(
                (f, i) => (
                  <li key={i}>{f}</li>
                )
              )}
            </ul>

            <button
              className="primaryBtn"
              onClick={() => setSelectedReport(null)}
              style={{ marginTop: 20 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

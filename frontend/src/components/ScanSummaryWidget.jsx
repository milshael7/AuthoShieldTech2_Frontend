// frontend/src/components/ScanSummaryWidget.jsx
// Dashboard Widget — Scan Intelligence • Risk Snapshot • Credit Awareness

import React, { useEffect, useState, useMemo } from "react";
import { getToken } from "../lib/api";

export default function ScanSummaryWidget() {
  const [scans, setScans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const token = getToken();

      const [scanRes, billingRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE}/api/me/scans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_BASE}/api/billing/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!scanRes.ok || !billingRes.ok) return;

      const scanData = await scanRes.json();
      const billingData = await billingRes.json();

      setScans(scanData.scans || []);
      setSubscription(billingData.subscription || null);
    } catch {
      // silent fail for widget
    } finally {
      setLoading(false);
    }
  }

  /* ================= CALCULATIONS ================= */

  const completedScans = scans.filter(
    (s) => s.status === "completed"
  );

  const runningScans = scans.filter(
    (s) => s.status === "running" || s.status === "pending"
  );

  const avgRisk = useMemo(() => {
    if (!completedScans.length) return 0;

    const total = completedScans.reduce(
      (sum, s) =>
        sum + (s.result?.overview?.riskScore || 0),
      0
    );

    return Math.round(total / completedScans.length);
  }, [completedScans]);

  const planTier =
    subscription?.companyPlan?.tier ||
    (subscription?.status === "Active" ? "individual" : "trial");

  const includedScans = useMemo(() => {
    switch (planTier) {
      case "enterprise":
        return 999;
      case "mid":
        return 10;
      case "small":
        return 5;
      case "micro":
        return 2;
      case "individual":
        return 1;
      default:
        return 0;
    }
  }, [planTier]);

  const usedScans = completedScans.length;

  const remaining =
    includedScans === 999
      ? "Unlimited"
      : Math.max(includedScans - usedScans, 0);

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <div className="widgetCard">
        <p>Loading scan intelligence...</p>
      </div>
    );
  }

  return (
    <div className="widgetCard">
      <h3>Scan Intelligence</h3>

      <div className="widgetRow">
        <span>Total Completed</span>
        <strong>{completedScans.length}</strong>
      </div>

      <div className="widgetRow">
        <span>Active Scans</span>
        <strong>{runningScans.length}</strong>
      </div>

      <div className="widgetRow">
        <span>Average Risk</span>
        <strong>{avgRisk}</strong>
      </div>

      <div className="widgetRow highlight">
        <span>Credits Remaining</span>
        <strong>{remaining}</strong>
      </div>
    </div>
  );
}

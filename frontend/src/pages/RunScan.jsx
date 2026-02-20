// frontend/src/pages/RunScan.jsx
// Run Scan — Plan Aware • Discount Engine • Revenue Optimized

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getSavedUser } from "../lib/api";

export default function RunScan() {
  const navigate = useNavigate();

  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState("");
  const [depth, setDepth] = useState("standard");
  const [targets, setTargets] = useState(1);
  const [urgency, setUrgency] = useState("normal");

  const [planInfo, setPlanInfo] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD TOOLS ================= */

  useEffect(() => {
    loadTools();
    loadPlan();
  }, []);

  async function loadTools() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/public-scans/tools`
      );

      if (!res.ok) throw new Error("Failed to load tools");

      const data = await res.json();
      setTools(data.tools || []);
    } catch (e) {
      setError(e.message);
    }
  }

  /* ================= LOAD PLAN INFO ================= */

  async function loadPlan() {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/billing/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return;

      const data = await res.json();

      if (data?.subscription) {
        setPlanInfo(data.subscription);
      }
    } catch {
      // silent fail
    }
  }

  /* ================= PRICE PREVIEW ================= */

  const selectedToolData = tools.find(
    (t) => t.id === selectedTool
  );

  const estimatedPrice = useMemo(() => {
    if (!selectedToolData) return 0;

    let price = selectedToolData.basePrice;

    if (depth === "deep") price += 150;
    if (depth === "enterprise") price += 400;

    if (Number(targets) > 1) {
      price += (Number(targets) - 1) * 50;
    }

    if (urgency === "rush") {
      price += 200;
    }

    return price;
  }, [selectedToolData, depth, targets, urgency]);

  const discountPercent =
    planInfo?.status === "Active"
      ? planInfo?.companyPlan?.tier === "enterprise"
        ? 50
        : 30
      : 0;

  const discountedPrice = Math.round(
    estimatedPrice -
      (estimatedPrice * discountPercent) / 100
  );

  const savings = estimatedPrice - discountedPrice;

  /* ================= SUBMIT ================= */

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = getToken();
      const user = getSavedUser();

      if (!selectedTool) {
        throw new Error("Please select a scan type");
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/public-scans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            toolId: selectedTool,
            email: user?.email,
            inputData: {
              depth,
              targets: Number(targets),
              urgency,
            },
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Scan failed");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      navigate("/user/scans");

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ================= RENDER ================= */

  return (
    <div className="pageWrap">
      <div className="pageTop">
        <h2>Run Security Scan</h2>
        <button
          className="secondaryBtn"
          onClick={() => navigate("/user/scans")}
        >
          Back to Scans
        </button>
      </div>

      {planInfo && (
        <div className="planBanner">
          <strong>Plan:</strong> {planInfo.role} •{" "}
          Status: {planInfo.status}
          {discountPercent > 0 && (
            <span className="planDiscount">
              {" "}
              • {discountPercent}% discount applied
            </span>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <form className="scanForm" onSubmit={handleSubmit}>

        <div className="formGroup">
          <label>Select Scan Type</label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
          >
            <option value="">-- Select Tool --</option>
            {tools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name} (${tool.basePrice})
              </option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label>Scan Depth</label>
          <select value={depth} onChange={(e) => setDepth(e.target.value)}>
            <option value="standard">Standard</option>
            <option value="deep">Deep (+$150)</option>
            <option value="enterprise">Enterprise (+$400)</option>
          </select>
        </div>

        <div className="formGroup">
          <label>Number of Targets</label>
          <input
            type="number"
            min="1"
            value={targets}
            onChange={(e) => setTargets(e.target.value)}
          />
        </div>

        <div className="formGroup">
          <label>Urgency</label>
          <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="rush">Rush (+$200)</option>
          </select>
        </div>

        {selectedToolData && (
          <div className="pricePreview">
            <p>
              <strong>Estimated Price:</strong> ${estimatedPrice}
            </p>
            {discountPercent > 0 && (
              <>
                <p>
                  <strong>You Save:</strong> ${savings}
                </p>
                <p>
                  <strong>Final Price:</strong> ${discountedPrice}
                </p>
              </>
            )}
          </div>
        )}

        <button className="primaryBtn" disabled={loading}>
          {loading ? "Processing..." : "Start Scan"}
        </button>
      </form>
    </div>
  );
}

// frontend/src/pages/RunScan.jsx
// Run Scan — Dynamic Pricing • Stripe Redirect • Free Scan Auto-Process

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getSavedUser } from "../lib/api";

export default function RunScan() {
  const navigate = useNavigate();

  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState("");
  const [depth, setDepth] = useState("standard");
  const [targets, setTargets] = useState(1);
  const [urgency, setUrgency] = useState("normal");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTools();
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

      // FREE SCAN
      if (data.finalPrice === 0) {
        navigate("/user/scans");
        return;
      }

      // PAID SCAN → STRIPE
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

      {error && <p className="error">{error}</p>}

      <form className="scanForm" onSubmit={handleSubmit}>

        {/* TOOL SELECT */}
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

        {/* DEPTH */}
        <div className="formGroup">
          <label>Scan Depth</label>
          <select value={depth} onChange={(e) => setDepth(e.target.value)}>
            <option value="standard">Standard</option>
            <option value="deep">Deep (+$150)</option>
            <option value="enterprise">Enterprise (+$400)</option>
          </select>
        </div>

        {/* TARGETS */}
        <div className="formGroup">
          <label>Number of Targets</label>
          <input
            type="number"
            min="1"
            value={targets}
            onChange={(e) => setTargets(e.target.value)}
          />
          <small>Each additional target adds $50</small>
        </div>

        {/* URGENCY */}
        <div className="formGroup">
          <label>Urgency</label>
          <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="rush">Rush (+$200)</option>
          </select>
        </div>

        <button className="primaryBtn" disabled={loading}>
          {loading ? "Processing..." : "Start Scan"}
        </button>
      </form>
    </div>
  );
}

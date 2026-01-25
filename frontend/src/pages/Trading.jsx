// frontend/src/pages/Trading.jsx
import React, { useEffect, useState } from "react";

function apiBase() {
  return (
    (import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL ||
      "").trim()
  );
}

export default function Trading({ user }) {
  const base = apiBase();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // 🔧 CONTROL STATE (YOU control these)
  const [baselinePct, setBaselinePct] = useState(3);
  const [maxPct, setMaxPct] = useState(10);
  const [tradesPerDay, setTradesPerDay] = useState(20);

  // 📊 READ-ONLY STATE (AI state)
  const [tierBase, setTierBase] = useState(0);
  const [sizePct, setSizePct] = useState(0);
  const [forceBaseline, setForceBaseline] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/paper/status`, {
        credentials: "include",
      });
      const data = await res.json();

      setStatus(data);

      // pull current config
      if (data.owner) {
        setBaselinePct(Math.round(data.owner.baselinePct * 100));
        setMaxPct(Math.round(data.owner.maxPct * 100));
        setTradesPerDay(data.owner.maxTradesPerDay);
      }

      // read-only info
      if (data.sizing) {
        setTierBase(data.sizing.tierBase);
        setSizePct(data.sizing.sizePct);
      }

      if (data.limits) {
        setForceBaseline(!!data.limits.forceBaseline);
      }

      setErr("");
    } catch (e) {
      setErr("Failed to load paper trader status");
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await fetch(`${base}/api/paper/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          baselinePct: baselinePct / 100,
          maxPct: maxPct / 100,
          maxTradesPerDay: tradesPerDay,
        }),
      });
      await loadStatus();
    } catch {
      alert("Failed to save config");
    } finally {
      setSaving(false);
    }
  }

  async function resetPaper() {
    const key = prompt("Enter PAPER reset key:");
    if (!key) return;

    await fetch(`${base}/api/paper/reset`, {
      method: "POST",
      headers: { "x-reset-key": key },
      credentials: "include",
    });

    await loadStatus();
  }

  useEffect(() => {
    loadStatus();
    const t = setInterval(loadStatus, 3000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return <div className="card">Loading trading controls…</div>;
  }

  return (
    <div className="tradeWrap">
      <div className="card">
        <h2>Trading Control Panel</h2>
        <small>You are in full control. AI follows your rules.</small>
        {err && <p className="error">{err}</p>}
      </div>

      <div className="card">
        <h3>AI Limits (Manual)</h3>

        <label>Baseline % (safe mode)</label>
        <input
          type="range"
          min="1"
          max="20"
          value={baselinePct}
          onChange={(e) => setBaselinePct(Number(e.target.value))}
        />
        <b>{baselinePct}%</b>

        <label style={{ marginTop: 10 }}>Max % (cap)</label>
        <input
          type="range"
          min={baselinePct}
          max="50"
          value={maxPct}
          onChange={(e) => setMaxPct(Number(e.target.value))}
        />
        <b>{maxPct}%</b>

        <label style={{ marginTop: 10 }}>Trades per day</label>
        <input
          type="number"
          min="1"
          max="200"
          value={tradesPerDay}
          onChange={(e) => setTradesPerDay(Number(e.target.value))}
        />

        <div style={{ marginTop: 12 }}>
          <button onClick={saveConfig} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
          <button onClick={resetPaper} style={{ marginLeft: 10 }}>
            Reset Paper
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Live AI State (Read-Only)</h3>
        <p><b>Tier Base:</b> ${tierBase?.toLocaleString()}</p>
        <p><b>Current Size %:</b> {(sizePct * 100).toFixed(2)}%</p>
        <p>
          <b>Force Baseline:</b>{" "}
          {forceBaseline ? "ON (loss protection)" : "OFF"}
        </p>
      </div>
    </div>
  );
}

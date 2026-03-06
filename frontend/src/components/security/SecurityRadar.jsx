// frontend/src/components/security/SecurityRadar.jsx
// SecurityRadar — Quiet Signal Mode v15
// PASSIVE • EVENT-DRIVEN • NO POLL NOISE • THREAT-ONLY

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { getToken } from "../../lib/api.js";

/* ================= UTILS ================= */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function apiBase() {
  return (
    (import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL ||
      "").trim()
  );
}

function fmtPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${Math.round(x)}%`;
}

/* ================= COMPONENT ================= */

const SecurityRadar = forwardRef(function SecurityRadar(_, ref) {
  const base = apiBase();

  const [status, setStatus] = useState("IDLE");
  const [posture, setPosture] = useState(null);
  const [history, setHistory] = useState([]);

  const canvasRef = useRef(null);
  const mountedRef = useRef(true);

  /* ================= LOAD (ON-DEMAND ONLY) ================= */

  const load = useCallback(async () => {
    const token = getToken();
    if (!base || !token || !mountedRef.current) return;

    try {
      setStatus("UPDATING");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const pRes = await fetch(`${base}/api/security/posture`, { headers });
      if (!pRes.ok) throw new Error("posture failed");

      const pData = await pRes.json().catch(() => ({}));

      setPosture(pData?.posture || null);
      setHistory(Array.isArray(pData?.history) ? pData.history : []);
      setStatus("READY");
    } catch {
      // Quiet failure — no thrashing
      setStatus("STALE");
    }
  }, [base]);

  /* expose reload() safely */
  useImperativeHandle(ref, () => ({
    reload: load,
  }));

  /* ================= BOOT ================= */

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  /* ================= DATA ================= */

  const domains = useMemo(() => {
    const d = posture?.domains || [];
    return Array.isArray(d) ? d : [];
  }, [posture]);

  const score = posture?.score ?? "—";
  const tier = posture?.tier ?? "—";
  const risk = posture?.risk ?? "—";
  const trend = posture?.trend ?? "—";
  const volatility = posture?.volatility ?? "low";

  const maxIssues = useMemo(
    () => Math.max(1, ...domains.map((d) => Number(d?.issues) || 0)),
    [domains]
  );

  /* ================= RADAR DRAW ================= */

  const drawRadar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !domains.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssW, cssH);

    const cx = cssW * 0.5;
    const cy = cssH * 0.55;
    const R = Math.min(cssW, cssH) * 0.34;
    const n = domains.length;

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;

    for (let k = 1; k <= 5; k++) {
      const r = (R * k) / 5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(94,198,255,0.25)";
    ctx.strokeStyle = "rgba(94,198,255,0.9)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const d = domains[i] || {};
      const cov = clamp((Number(d.coverage) || 0) / 100, 0, 1);
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = cx + Math.cos(a) * R * cov;
      const y = cy + Math.sin(a) * R * cov;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < n; i++) {
      const d = domains[i] || {};
      const cov = clamp((Number(d.coverage) || 0) / 100, 0, 1);
      const issues = clamp(Number(d.issues) || 0, 0, 999);
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = cx + Math.cos(a) * R * cov;
      const y = cy + Math.sin(a) * R * cov;
      const sz = 3 + (issues / maxIssues) * 6;
      ctx.fillStyle = issues > 0 ? "#ff5a5f" : "#2bd576";
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [domains, maxIssues]);

  useEffect(() => {
    drawRadar();
  }, [drawRadar]);

  /* ================= UI ================= */

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Enterprise Security Score
          </div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>{score}</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            Tier: <b>{tier}</b> • Risk: <b>{risk}</b> • Trend:{" "}
            <b>{String(trend).toUpperCase()}</b> • Volatility:{" "}
            <b>{String(volatility).toUpperCase()}</b>
          </div>
        </div>

        <span className="badge">{status}</span>
      </div>

      <div style={{ height: 360 }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Control Domain</th>
              <th>Coverage</th>
              <th>Open Gaps</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr key={d.key}>
                <td>{d.label}</td>
                <td>{fmtPct(d.coverage)}</td>
                <td>{d.issues}</td>
              </tr>
            ))}
            {!domains.length && (
              <tr>
                <td colSpan="3" style={{ opacity: 0.6 }}>
                  No posture data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default SecurityRadar;

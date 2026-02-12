import React, { useEffect, useMemo, useRef, useState } from "react";

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

function gradeFromScore(score) {
  if (score >= 90) return { grade: "A", label: "Excellent", color: "#2bd576" };
  if (score >= 75) return { grade: "B", label: "Strong", color: "#5EC6FF" };
  if (score >= 60) return { grade: "C", label: "Moderate", color: "#ffd166" };
  return { grade: "D", label: "At Risk", color: "#ff5a5f" };
}

export default function SecurityRadar() {
  const [status, setStatus] = useState("Loading…");
  const [posture, setPosture] = useState(null);
  const canvasRef = useRef(null);

  const base = apiBase();

  async function load() {
    if (!base) return;

    try {
      const res = await fetch(`${base}/api/security/posture`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setPosture(data.posture);
      setStatus("LIVE");
    } catch {
      setStatus("ERROR");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  // 🔥 Instant refresh when marketplace installs tools
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("security:refresh", handler);
    return () => window.removeEventListener("security:refresh", handler);
  }, []);

  const domains = useMemo(() => posture?.domains || [], [posture]);
  const score = posture?.score || 0;
  const gradeInfo = gradeFromScore(score);

  const maxIssues = useMemo(
    () => Math.max(1, ...domains.map((d) => Number(d.issues) || 0)),
    [domains]
  );

  /* ================= RADAR DRAW ================= */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssW, cssH);

    const bg = ctx.createLinearGradient(0, 0, 0, cssH);
    bg.addColorStop(0, "rgba(20,25,35,0.7)");
    bg.addColorStop(1, "rgba(10,14,20,0.85)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);

    const n = domains.length || 1;
    const cx = cssW * 0.5;
    const cy = cssH * 0.55;
    const R = Math.min(cssW, cssH) * 0.32;

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
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

    if (!domains.length) return;

    ctx.fillStyle = "rgba(94,198,255,0.25)";
    ctx.strokeStyle = "rgba(94,198,255,0.95)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const d = domains[i];
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
      const d = domains[i];
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

  /* ================= UI ================= */

  return (
    <div className="card">
      {/* ===== SCORE RING ===== */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>
            Overall Security Score
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: gradeInfo.color,
              lineHeight: 1,
            }}
          >
            {score}
          </div>
          <div style={{ fontSize: 14 }}>
            Grade {gradeInfo.grade} — {gradeInfo.label}
          </div>
        </div>

        <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
          {status}
        </span>
      </div>

      {/* ===== RADAR ===== */}
      <div style={{ marginTop: 20, height: 380 }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        />
      </div>

      {/* ===== TABLE ===== */}
      <div style={{ marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Control</th>
              <th>Coverage</th>
              <th>Issues</th>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

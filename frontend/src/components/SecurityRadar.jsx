// frontend/src/components/security/SecurityRadar.jsx
// SecurityRadar — QUIET COMPLIANCE v18
// PASSIVE • BACKOFF • NO CONSOLE NOISE • SIGNAL-ONLY
// LOUD ONLY WHEN DATA IS VALID

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { api } from "../lib/api";

/* ================= UTIL ================= */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function fmtPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${Math.round(x)}%`;
}

function gradeFromScore(score) {
  if (score >= 90)
    return { grade: "A", label: "Excellent", color: "#2bd576" };
  if (score >= 75)
    return { grade: "B", label: "Strong", color: "#5EC6FF" };
  if (score >= 60)
    return { grade: "C", label: "Moderate", color: "#ffd166" };
  return { grade: "D", label: "At Risk", color: "#ff5a5f" };
}

function riskTier(score) {
  if (score >= 90)
    return { level: "LOW", desc: "Hardened posture", color: "#2bd576" };
  if (score >= 75)
    return { level: "MODERATE", desc: "Stable with minor gaps", color: "#5EC6FF" };
  if (score >= 60)
    return { level: "ELEVATED", desc: "Security gaps detected", color: "#ffd166" };
  return { level: "CRITICAL", desc: "Immediate action required", color: "#ff5a5f" };
}

/* ================= COMPONENT ================= */

export default function SecurityRadar() {
  const [status, setStatus] = useState("IDLE");
  const [posture, setPosture] = useState(null);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const failureRef = useRef(0);
  const quietRef = useRef(false);

  /* ================= SAFE LOAD ================= */

  const load = useCallback(async () => {
    if (quietRef.current) return;

    try {
      const data = await api.postureSummary();

      if (!data || typeof data !== "object") {
        throw new Error("invalid_payload");
      }

      setPosture(data);
      setStatus("LIVE");

      failureRef.current = 0;
    } catch {
      failureRef.current += 1;
      setStatus("DEGRADED");

      // 🔇 after 3 failures, go quiet
      if (failureRef.current >= 3) {
        quietRef.current = true;
        setStatus("QUIET");
      }
    }
  }, []);

  /* ================= BOOT ================= */

  useEffect(() => {
    load();

    timerRef.current = setInterval(() => {
      if (!quietRef.current) load();
    }, 30000); // slower, safer, quieter

    return () => clearInterval(timerRef.current);
  }, [load]);

  /* ================= DATA ================= */

  const domains = useMemo(
    () => Array.isArray(posture?.domains) ? posture.domains : [],
    [posture]
  );

  const score = posture?.score || 0;
  const gradeInfo = gradeFromScore(score);
  const tier = riskTier(score);

  /* ================= RADAR DRAW ================= */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !domains.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssW, cssH);

    const cx = cssW * 0.5;
    const cy = cssH * 0.55;
    const R = Math.min(cssW, cssH) * 0.32;
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
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.beginPath();
    domains.forEach((d, i) => {
      const cov = clamp((Number(d.coverage) || 0) / 100, 0, 1);
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = cx + Math.cos(a) * R * cov;
      const y = cy + Math.sin(a) * R * cov;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();

    ctx.fillStyle = "rgba(94,198,255,0.25)";
    ctx.strokeStyle = "rgba(94,198,255,0.9)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }, [domains]);

  /* ================= UI ================= */

  return (
    <div className="card">
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
            }}
          >
            {score}
          </div>

          <div style={{ fontSize: 14 }}>
            Grade {gradeInfo.grade} — {gradeInfo.label}
          </div>

          <div
            style={{
              marginTop: 10,
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              display: "inline-block",
              background: tier.color + "22",
              color: tier.color,
              border: `1px solid ${tier.color}55`,
            }}
          >
            {tier.level} RISK — {tier.desc}
          </div>
        </div>

        <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
          {status}
        </span>
      </div>

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
    </div>
  );
}

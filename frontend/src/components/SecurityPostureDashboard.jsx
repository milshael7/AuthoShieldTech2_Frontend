import React, { useMemo } from "react";

/**
 * SecurityPostureDashboard
 * - Pure UI for now (no backend required)
 * - You can pass:
 *   score (0-100)
 *   coverage: { phishing, malware, accountTakeover, fraud } (0-100 each)
 *
 * Later we will wire these numbers to real backend metrics.
 */
export default function SecurityPostureDashboard({
  score = 82,
  coverage = { phishing: 88, malware: 76, accountTakeover: 91, fraud: 69 },
  subtitle = "Live posture snapshot (MVP UI)",
}) {
  const s = clampNum(score, 0, 100);

  const cov = useMemo(() => {
    const c = coverage || {};
    return {
      phishing: clampNum(c.phishing ?? 0, 0, 100),
      malware: clampNum(c.malware ?? 0, 0, 100),
      accountTakeover: clampNum(c.accountTakeover ?? 0, 0, 100),
      fraud: clampNum(c.fraud ?? 0, 0, 100),
    };
  }, [coverage]);

  const grade = s >= 90 ? "Excellent" : s >= 80 ? "Good" : s >= 65 ? "Fair" : "At Risk";
  const scoreHint =
    s >= 90 ? "Strong defenses active" :
    s >= 80 ? "Healthy posture, keep monitoring" :
    s >= 65 ? "Some gaps detected" :
    "High risk areas need attention";

  return (
    <div className="postureWrap">
      {/* Left: Score + coverage */}
      <div className="postureCard">
        <div className="postureTop">
          <div className="postureTitle">
            <b>Security Posture</b>
            <small>{subtitle}</small>
          </div>

          <div className="postureScore">
            <div className="scoreRing" title={`Score: ${s}/100`}>
              {s}
            </div>
            <div className="scoreMeta">
              <b>{grade}</b>
              <span>{scoreHint}</span>
            </div>
          </div>
        </div>

        {/* Meter */}
        <div className="meter" aria-hidden="true">
          <div style={{ width: `${s}%` }} />
        </div>

        {/* Coverage grid */}
        <div className="coverGrid" style={{ marginTop: 14 }}>
          <CoverageItem label="Phishing Protection" value={cov.phishing} />
          <CoverageItem label="Malware Defense" value={cov.malware} />
          <CoverageItem label="Account Takeover" value={cov.accountTakeover} />
          <CoverageItem label="Fraud Detection" value={cov.fraud} />
        </div>

        <div style={{ marginTop: 12 }}>
          <small className="muted">
            Next step: connect these meters to real audit events + detection results.
          </small>
        </div>
      </div>

      {/* Right: Radar-style visual (placeholder) */}
      <div className="postureCard radarBox">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <b>Coverage Radar</b>
          <small className="muted">visual map</small>
        </div>

        <div style={{ height: 10 }} />

        <div className="radar" />

        <div style={{ marginTop: 10 }}>
          <small className="muted">
            This is a clean “command center” look. Later we can replace it with a real chart.
          </small>
        </div>
      </div>
    </div>
  );
}

function CoverageItem({ label, value }) {
  const v = clampNum(value, 0, 100);
  return (
    <div>
      <div className="coverItemTop">
        <b>{label}</b>
        <small className="muted">{v}%</small>
      </div>
      <div className="coverBar" aria-hidden="true">
        <div style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function clampNum(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

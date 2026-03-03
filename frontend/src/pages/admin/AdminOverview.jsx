
    // frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — SAFE REBUILD
// Includes:
// - Platform View + Operator View
// - Operator Panels (Queue/Fleet/Notifications/Email/Archive)
// - Work Policy Gating (Option B: NO auto alerts outside hours)
// - Company signals (Green/Yellow/Red) + overload ring
// - Notifications board + Email cabinet (per company)
// - Archive + Incident registry
//
// NOTE: This is self-contained in this file (no new pages needed).

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";

import ExecutiveRiskBanner from "../../components/ExecutiveRiskBanner";
import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityRadar from "../../components/SecurityRadar";
import IncidentBoard from "../../components/IncidentBoard";

import "../../styles/platform.css";

/* ================= UTILITIES ================= */

function containmentFromRisk(risk) {
  if (risk >= 75) return "LOCKDOWN";
  if (risk >= 50) return "MONITORING";
  if (risk >= 25) return "CONTAINED";
  return "STABLE";
}

function priorityFromRisk(risk) {
  if (risk >= 75) return "P1";
  if (risk >= 60) return "P2";
  if (risk >= 40) return "P3";
  return "P4";
}

function bumpPriority(priority) {
  if (priority === "P4") return "P3";
  if (priority === "P3") return "P2";
  if (priority === "P2") return "P1";
  return "P1";
}

function slaDuration(priority) {
  switch (priority) {
    case "P1":
      return 5 * 60 * 1000;
    case "P2":
      return 15 * 60 * 1000;
    case "P3":
      return 30 * 60 * 1000;
    default:
      return 60 * 60 * 1000;
  }
}

function formatCountdown(ms) {
  if (ms <= 0) return "BREACHED";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function nowTs() {
  return Date.now();
}

function safeStr(v) {
  return String(v ?? "").trim();
}

function makeId(prefix = "id") {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${nowTs()}`;
}

function dayLabel(d) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d] || String(d);
}

/* ================= WORK POLICY (Option B) ================= */

const DEFAULT_POLICY = {
  timezone: "Local",
  workDays: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 17, // exclusive
  vacationMode: false,
};

function normalizePolicy(policy) {
  const p = policy || {};
  const startHour = Number.isFinite(Number(p.startHour)) ? Number(p.startHour) : 9;
  const endHour = Number.isFinite(Number(p.endHour)) ? Number(p.endHour) : 17;

  return {
    timezone: safeStr(p.timezone) || "Local",
    workDays: Array.isArray(p.workDays) && p.workDays.length ? p.workDays : [1, 2, 3, 4, 5],
    startHour,
    endHour,
    vacationMode: Boolean(p.vacationMode),
  };
}

function isWithinWorkWindow(company) {
  const policy = normalizePolicy(company?.policy);
  if (policy.vacationMode) return false;

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  if (!policy.workDays.includes(day)) return false;
  if (hour < policy.startHour || hour >= policy.endHour) return false;

  return true;
}

function policyBadge(company) {
  const policy = normalizePolicy(company?.policy);
  if (policy.vacationMode) return { label: "VACATION MODE", tone: "warn" };
  return isWithinWorkWindow(company)
    ? { label: "ACTIVE WINDOW", tone: "ok" }
    : { label: "OUTSIDE HOURS", tone: "muted" };
}

/* ================= SIGNALS (Green/Yellow/Red) =================
   - Red: overload (too many threats)
   - Yellow: pending email draft exists
   - Green: controlled
*/

function dotStyle(level) {
  const base = {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
    marginRight: 8,
    border: "1px solid rgba(255,255,255,.25)",
    background: "rgba(255,255,255,.18)",
  };
  if (level === "GREEN") return { ...base, background: "rgba(60,255,150,.65)" };
  if (level === "YELLOW") return { ...base, background: "rgba(255,210,60,.75)" };
  return { ...base, background: "rgba(255,70,70,.75)" };
}

/* ================= COMPONENT ================= */

export default function AdminOverview() {
  const { integrityAlert } = useSecurity();

  // platform | operator
  const [mode, setMode] = useState("platform");

  // operator panels
  const [operatorPanel, setOperatorPanel] = useState("queue"); // queue | fleet | notifications | email | archive

  // automatic | manual
  const [operatorMode, setOperatorMode] = useState("automatic");

  // controls
  const [tick, setTick] = useState(Date.now());
  const [enginePaused, setEnginePaused] = useState(false);
  const [engineSpeed, setEngineSpeed] = useState("normal"); // slow | normal | aggressive
  const [filter, setFilter] = useState("ALL"); // ALL | OPEN | BREACHED | P1
  const [workspace, setWorkspace] = useState("ALL");
  const [role, setRole] = useState("Supervisor"); // Tier1 | Tier2 | Supervisor

  // UI
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // comms selection
  const [selectedCompanyForComms, setSelectedCompanyForComms] = useState("ALL");
  const [selectedEmailId, setSelectedEmailId] = useState(null);

  // companies
  const [companies, setCompanies] = useState([

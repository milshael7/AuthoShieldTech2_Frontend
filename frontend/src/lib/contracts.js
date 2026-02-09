/* =========================================================
   AUTOSHIELD DATA CONTRACTS — SOC BASELINE (LOCKED)
   File: frontend/src/lib/contracts.js

   Purpose:
   - Single source of truth for frontend data expectations
   - Defines shapes used across Posture, Assets, Threats,
     Incidents, Vulnerabilities, Compliance, Policies, Reports
   - Prevents frontend/backend drift
   - Backend MUST conform to these contracts

   RULES:
   - NO UI
   - NO API CALLS
   - NO BUSINESS LOGIC
   - DATA SHAPE ONLY

   NOTE:
   - "AutoDev 6.5" is a SYSTEM ACTOR (not called AI anywhere)
   - Companies may NOT use AutoDev 6.5
   - Individuals MAY upgrade to AutoDev 6.5
   - Small Companies may upgrade to Full Company ONLY
   ========================================================= */

/* =============================
   COMMON ENUMS
   ============================= */

export const Severity = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const Status = {
  OK: "ok",
  WARN: "warn",
  FAIL: "fail",
};

export const RiskLevel = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const Exposure = {
  INTERNAL: "internal",
  EXTERNAL: "external",
};

export const AssetType = {
  USER: "user",
  ENDPOINT: "endpoint",
  SERVER: "server",
  CLOUD: "cloud",
  NETWORK: "network",
};

/* =============================
   PLATFORM ROLES
   ============================= */

export const PlatformRole = {
  ADMIN: "admin",
  MANAGER: "manager",
  COMPANY: "company",
  SMALL_COMPANY: "small_company",
  INDIVIDUAL: "individual",
};

/* =============================
   AUTODEV 6.5 (SYSTEM ACTOR)
   ============================= */

export const AutoDevMode = {
  DISABLED: "disabled",
  ADVISORY: "advisory", // guidance + reporting only
  EXECUTION: "execution", // performs cyber tasks autonomously
};

export const AutoDevContract = {
  enabled: false,
  mode: AutoDevMode.DISABLED,

  // Who can use AutoDev 6.5
  allowedRoles: ["individual"],

  // Scheduling (AutoDev does NOT work 24/7 unless configured)
  schedule: {
    timezone: "UTC",
    workDays: ["mon", "tue", "wed", "thu", "fri"],
    startHour: "09:00",
    endHour: "17:00",
  },

  // Reporting behavior
  reporting: {
    enabled: true,
    delivery: "dashboard | email",
    recipientEmails: [],
  },

  // Task lifecycle rules
  lifecycle: {
    finishActiveTaskOnCancel: true,
    stopNewTasksOnCancel: true,
  },
};

/* =============================
   POSTURE
   ============================= */

export const PostureSummaryContract = {
  scope: {
    type: "global | manager | company | small_company | individual",
  },
  score: 0, // 0–100
  users: 0,
  devices: 0,
  mailboxes: 0,
  browsers: 0,
  drives: 0,
  assets: 0,
  highRiskAssets: 0,
  updatedAt: "ISO_TIMESTAMP",
};

export const PostureCheckContract = {
  id: "string",
  title: "string",
  message: "string",
  status: Status.OK,
};

/* =============================
   ASSETS
   ============================= */

export const AssetContract = {
  id: "string | number",
  name: "string",
  type: AssetType.ENDPOINT,
  risk: RiskLevel.MEDIUM,
  exposure: Exposure.INTERNAL,
  status: "string",
  lastSeen: "ISO_TIMESTAMP",
};

/* =============================
   THREATS
   ============================= */

export const ThreatContract = {
  id: "string | number",
  name: "string",
  severity: Severity.HIGH,
  source: "Identity | Endpoint | Email | Cloud | Network",
  status: "Investigating | Open | Contained | Resolved",
  time: "relative | ISO_TIMESTAMP",
};

/* =============================
   INCIDENTS
   ============================= */

export const IncidentContract = {
  id: "INC-XXXXX",
  title: "string",
  severity: Severity.MEDIUM,
  asset: "string",
  status: "Open | Investigating | Contained | Resolved",
  detectedAt: "ISO_TIMESTAMP",
};

/* =============================
   VULNERABILITIES
   ============================= */

export const VulnerabilityContract = {
  id: "CVE-YYYY-NNNN",
  asset: "string",
  severity: Severity.HIGH,
  score: 0.0, // CVSS
  status: "Open | Mitigated | Accepted",
};

/* =============================
   COMPLIANCE
   ============================= */

export const ComplianceControlContract = {
  id: "string",
  framework: "SOC 2 | NIST | ISO 27001 | HIPAA",
  title: "string",
  status: Status.OK,
};

/* =============================
   POLICIES
   ============================= */

export const PolicyContract = {
  id: "POL-XXX",
  name: "string",
  category: "string",
  status: "enforced | partial | missing",
  acknowledged: 0, // percentage
};

/* =============================
   REPORTS / EXECUTIVE METRICS
   ============================= */

export const ReportMetricsContract = {
  postureScore: 0, // 0–100
  incidents: 0,
  criticalFindings: 0,
  resolvedIssues: 0,
  trend: {
    posture: "▲ | ▼ | =",
    incidents: "▲ | ▼ | =",
    risk: "▲ | ▼ | =",
  },
};

/* =============================
   SUBSCRIPTION & UPGRADE RULES
   ============================= */

export const SubscriptionContract = {
  role: PlatformRole.INDIVIDUAL,

  limits: {
    maxUsers: 1,
    maxAssets: 50,
    maxIncidents: 100,
  },

  upgradePaths: {
    individual: ["autodev"],
    small_company: ["company"],
    company: [],
  },

  autodevAllowed: false,
};

/* =============================
   SOC MATURITY (NEXT PHASE)
   ============================= */

export const SocMaturityContract = {
  overall: 0, // 0–100
  postureWeight: 0,
  threatWeight: 0,
  vulnerabilityWeight: 0,
  complianceWeight: 0,
  grade: "A | B | C | D | F",
};

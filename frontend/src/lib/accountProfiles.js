/* =========================================================
   AUTOSHIELD ACCOUNT PROFILES — SOC BASELINE (LOCKED)
   File: frontend/src/lib/accountProfiles.js

   Purpose:
   - Defines account types and operational limits
   - Enforces Small Company constraints
   - Controls upgrade eligibility (NOT automatic)
   - Prevents role abuse and task overlap
   - Aligns with pricing + AutoDev 6.5 rules

   ⚠️ NO UI
   ⚠️ NO API CALLS
   ⚠️ NO BUSINESS EXECUTION
   ========================================================= */

import { AccountType } from "./permits";

/* =============================
   ACCOUNT PROFILES
   ============================= */

export const AccountProfiles = {
  /* =====================================================
     INDIVIDUAL
     ===================================================== */
  [AccountType.INDIVIDUAL]: {
    label: "Individual",
    description:
      "Independent cybersecurity professional serving multiple companies, one role per company.",

    limits: {
      maxCompaniesServed: "multiple",
      maxRolesPerCompany: 1,        // 🔒 CRITICAL RULE
      maxActiveTasksPerCompany: 1,  // 🔒 No multi-task abuse
      maxEmployeesManaged: 0,
    },

    features: {
      posture: true,
      assets: true,
      threats: true,
      incidents: true,
      vulnerabilities: true,
      compliance: false,
      policies: false,
      reports: true,
    },

    autodev: {
      allowed: true,
      mode: "optional",
      firstMonthTrial: true,
    },

    upgradeOptions: [], // Individuals do NOT upgrade to company automatically
  },

  /* =====================================================
     SMALL COMPANY
     ===================================================== */
  [AccountType.SMALL_COMPANY]: {
    label: "Small Company",
    description:
      "Growing organization with limited workforce and controlled access.",

    limits: {
      minEmployees: 1,
      maxEmployees: 15,           // ✅ per your rule (10–15)
      maxManagers: 2,
      maxProjects: "limited",
    },

    features: {
      posture: true,
      assets: true,
      threats: true,
      incidents: true,
      vulnerabilities: true,
      compliance: false,
      policies: false,
      reports: true,
    },

    restrictions: {
      autodevAllowed: false,      // 🔒 NEVER allowed
      hardUserCap: true,          // 🔔 blocks adding more users
    },

    notifications: {
      monthlyUpgradeReminder: true,
      limitReachedWarning: true,  // 🔔 special notification
    },

    upgradeOptions: ["company"], // 🔔 notification only
  },

  /* =====================================================
     COMPANY
     ===================================================== */
  [AccountType.COMPANY]: {
    label: "Company",
    description:
      "Full organization with internal cybersecurity workforce and governance.",

    limits: {
      maxEmployees: "unlimited",
      maxManagers: "unlimited",
      maxProjects: "unlimited",
    },

    features: {
      posture: true,
      assets: true,
      threats: true,
      incidents: true,
      vulnerabilities: true,
      compliance: true,
      policies: true,
      reports: true,
    },

    restrictions: {
      autodevAllowed: false, // 🔒 Company NEVER uses AutoDev 6.5
    },

    notifications: {
      monthlyPlanNotice: true,
    },

    upgradeOptions: [], // Top tier
  },
};

/* =============================
   HELPERS (SAFE, READ-ONLY)
   ============================= */

export function getAccountProfile(type) {
  return AccountProfiles[type] || null;
}

export function canUpgradeTo(type, target) {
  const profile = AccountProfiles[type];
  if (!profile) return false;
  return profile.upgradeOptions.includes(target);
}

export function isSmallCompany(type) {
  return type === AccountType.SMALL_COMPANY;
}

export function isIndividual(type) {
  return type === AccountType.INDIVIDUAL;
}

export function isCompany(type) {
  return type === AccountType.COMPANY;
}

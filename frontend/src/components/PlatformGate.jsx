// frontend/src/components/PlatformGate.jsx
// PlatformGate — Enterprise Auth Stabilizer v12
// QUIET • DECISION-BASED • NO ZOMBIE STATES • TRADING-SAFE

import React, { useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";

function normalize(v) {
  return String(v || "").trim().toLowerCase();
}

const ROLE_HIERARCHY = {
  admin: 5,
  manager: 4,
  company: 3,
  small_company: 2,
  individual: 1,
};

function hasAccess(userRole, allowedRoles) {
  const userLevel = ROLE_HIERARCHY[normalize(userRole)] || 0;

  return allowedRoles.some((role) => {
    const requiredLevel = ROLE_HIERARCHY[normalize(role)] || 0;
    return userLevel >= requiredLevel;
  });
}

function isInactiveSubscription(status) {
  const s = normalize(status);
  return s === "locked" || s === "past due" || s === "past_due";
}

export default function PlatformGate({
  user,
  ready,
  allow,
  requireSubscription = false,
  children,
}) {
  const location = useLocation();

  // Track first valid authentication only
  const hadUserRef = useRef(false);
  const softHoldRef = useRef(false);

  if (user) {
    hadUserRef.current = true;
    softHoldRef.current = false;
  }

  /* ================= WAIT FOR BOOT ================= */
  if (!ready) {
    return <div style={{ padding: 40 }}>Initializing platform…</div>;
  }

  /* ================= SESSION DECISION =================
     RULES:
     - Allow ONE soft hold only
     - Never block indefinitely
     - Trading routes must not snap
  */
  if (!user) {
    // Allow ONE transient render if we previously had a user
    if (hadUserRef.current && !softHoldRef.current) {
      softHoldRef.current = true;
      return <div style={{ padding: 40 }}>Restoring session…</div>;
    }

    // After one hold, decide firmly
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  /* ================= ROLE ACCESS ================= */
  if (allow && !hasAccess(user.role, allow)) {
    return <Navigate to="/404" replace />;
  }

  /* ================= SUBSCRIPTION ================= */
  if (requireSubscription && isInactiveSubscription(user.subscriptionStatus)) {
    return <Navigate to="/pricing" replace />;
  }

  return children;
}

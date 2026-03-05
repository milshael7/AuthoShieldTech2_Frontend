import React from "react";
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

  /* ================= WAIT FOR AUTH BOOT ================= */
  if (!ready) {
    return <div style={{ padding: 40 }}>Initializing platform…</div>;
  }

  /* ================= AUTH RESOLUTION =================
     At this point:
     - Auth restoration is DONE
     - If user is null, session is invalid
     - We must redirect ONCE (not loop)
  */
  if (ready && !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  /* ================= ROLE ACCESS ================= */
  if (allow && user && !hasAccess(user.role, allow)) {
    return <Navigate to="/404" replace />;
  }

  /* ================= SUBSCRIPTION ================= */
  if (
    requireSubscription &&
    user &&
    isInactiveSubscription(user.subscriptionStatus)
  ) {
    return <Navigate to="/pricing" replace />;
  }

  return children;
}

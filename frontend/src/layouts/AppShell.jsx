/**
 * AutoShield Tech — App Shell
 *
 * RESPONSIBILITY:
 * - Global UI wrapper
 * - Mount background system
 * - Safe place for global visual layers
 *
 * HARD RULES:
 * - Does NOT replace Admin / Manager / Company layouts
 * - Does NOT contain navigation
 * - Does NOT contain business logic
 * - Visual + structural only
 */

import React from "react";
import { Outlet } from "react-router-dom";
import BackgroundLayer from "../components/BackgroundLayer";

export default function AppShell() {
  return (
    <>
      {/* ===== BACKGROUND (GLOBAL) ===== */}
      <BackgroundLayer />

      {/* ===== ROUTED CONTENT ===== */}
      <Outlet />
    </>
  );
}

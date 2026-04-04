// ==========================================================
// 🔒 AUTOSHIELD CORE — v35.0 (STEALTH SYNCED & HARDENED)
// FILE: frontend/src/App.jsx
// ==========================================================

import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* 🛠️ CORE UTILS & API */
import { 
  getSavedUser, 
  getToken, 
  setToken, 
  saveUser, 
  API_BASE 
} from "./lib/api.js";

/* 🏢 CONTEXT PROVIDERS */
import { CompanyProvider } from "./context/CompanyContext";
import { ToolProvider } from "./pages/tools/ToolContext.jsx";
import { SecurityProvider } from "./context/SecurityContext.jsx";
import { TradingProvider } from "./context/TradingContext.jsx";
import { EventBusProvider } from "./core/EventBus.jsx";
import { AIDecisionProvider } from "./core/AIDecisionBus.jsx";

/* 🧠 ENGINE ADAPTERS */
import BrainAdapter from "./core/BrainAdapter.jsx";
import AutoDevEngine from "./core/AutoDevEngine.jsx";

/* 🛡️ GATEKEEPER */
import PlatformGate from "./components/PlatformGate.jsx";

/* 🏗️ LAYOUTS */
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManagerLayout from "./layouts/ManagerLayout.jsx";
import UserLayout from "./layouts/UserLayout.jsx";

/* 🌐 PUBLIC PAGES */
import Landing from "./pages/public/Landing.jsx";
import Pricing from "./pages/public/Pricing.jsx";
import Signup from "./pages/public/Signup.jsx";
import Login from "./pages/Login.jsx";

/* 📊 SHARED MODULES */
import Intelligence from "./pages/Intelligence.jsx";
import SOC from "./pages/SOC.jsx";
import Assets from "./pages/Assets.jsx";
import Incidents from "./pages/Incidents.jsx";
import Vulnerabilities from "./pages/Vulnerabilities.jsx";
import Reports from "./pages/Reports.jsx";
import Notifications from "./pages/Notifications.jsx";
import Threats from "./pages/Threats.jsx";
import NotFound from "./pages/NotFound.jsx";

/* 🔑 ADMIN MODULES */
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import GlobalControl from "./pages/admin/GlobalControl.jsx";
import AdminCompanies from "./pages/admin/AdminCompanies.jsx";
import AuditExplorer from "./pages/admin/AuditExplorer.jsx";
import AdminToolGovernance from "./pages/admin/AdminToolGovernance.jsx";
import AdminCompanyRoom from "./pages/admin/AdminCompanyRoom.jsx";
import CorporateEntities from "./pages/admin/CorporateEntities.jsx";
import UserGovernance from "./pages/admin/UserGovernance.jsx";

/* 👔 MANAGER MODULES */
import ManagerCommand from "./pages/manager/ManagerCommand.jsx";

/* 🛡️ SECURITY MODULES */
import SecurityOverview from "./components/security/SecurityOverview.jsx";
import RiskMonitor from "./pages/RiskMonitor.jsx";
import SessionMonitor from "./pages/SessionMonitor.jsx";
import DeviceIntegrityPanel from "./pages/DeviceIntegrityPanel.jsx";

/* 📈 TRADING MODULES */
import TradingLayout from "./pages/trading/TradingLayout.jsx";

/* =========================================================
   ROUTES ARCHITECTURE
========================================================= */

function AppRoutes({ user, ready }) {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* ADMIN ENCLAVE */}
      <Route
        path="/admin/*"
        element={
          <PlatformGate user={user} ready={ready} allow={["admin"]}>
            <AdminLayout />
          </PlatformGate>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="soc" element={<SOC />} />
        <Route path="threats" element={<Threats />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="company/:companyId" element={<AdminCompanyRoom />} />
        <Route path="corporate" element={<CorporateEntities />} />
        <Route path="user-governance" element={<UserGovernance />} />
        <Route path="assets" element={<Assets />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="global" element={<GlobalControl />} />
        <Route path="audit" element={<AuditExplorer />} />
        <Route path="tool-governance" element={<AdminToolGovernance />} />
        <Route path="security" element={<SecurityOverview />} />
        <Route path="risk" element={<RiskMonitor />} />
        <Route path="sessions" element={<SessionMonitor />} />
        <Route path="device-integrity" element={<DeviceIntegrityPanel />} />
        <Route path="trading/*" element={<TradingLayout />} />
      </Route>

      {/* MANAGER ENCLAVE */}
      <Route
        path="/manager/*"
        element={
          <PlatformGate user={user} ready={ready} allow={["manager", "admin"]}>
            <ManagerLayout />
          </PlatformGate>
        }
      >
        <Route index element={<SOC />} />
        <Route path="command" element={<ManagerCommand />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="threats" element={<Threats />} />
        <Route path="assets" element={<Assets />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/* =========================================================
   MAIN APPLICATION BOOTSTRAP
========================================================= */

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    async function bootAuth() {
      try {
        const token = getToken();
        const storedUser = getSavedUser();

        if (!token || !storedUser) {
          setUser(null);
          setReady(true);
          return;
        }

        // Refresh session on boot
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.token && data?.user) {
            setToken(data.token);
            saveUser(data.user);
            setUser(data.user);
          } else {
            setUser(storedUser);
          }
        } else {
          setUser(storedUser); // Fallback to local storage if offline
        }
      } catch (err) {
        console.warn("Auth Boot Warning:", err.message);
        setUser(getSavedUser());
      } finally {
        setReady(true);
      }
    }

    bootAuth();
  }, []);

  if (!ready) {
    return (
      <div style={{ 
        background: "#0a0a0a", 
        color: "#00ff88", 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center", 
        fontFamily: "monospace" 
      }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>🛡️ AUTOSHIELD</h1>
        <p style={{ color: "#666" }}>INITIALIZING STEALTH CORE...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <EventBusProvider>
        <AIDecisionProvider>
          <TradingProvider>
            <CompanyProvider>
              <SecurityProvider>
                <ToolProvider user={user}>
                  <BrainAdapter />
                  <AutoDevEngine />
                  <AppRoutes user={user} ready={ready} />
                </ToolProvider>
              </SecurityProvider>
            </CompanyProvider>
          </TradingProvider>
        </AIDecisionProvider>
      </EventBusProvider>
    </BrowserRouter>
  );
}

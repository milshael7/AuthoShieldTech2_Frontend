// ==========================================================
// 🔒 AUTOSHIELD CORE — v35.0 (OPTIMIZED & DE-DUPLICATED)
// FILE: frontend/src/App.jsx
// ==========================================================

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Routes, Route } from "react-router-dom";

/* 🛠️ CORE UTILS & API */
import { 
  getSavedUser, 
  getToken, 
  setToken, 
  saveUser, 
  API_BASE 
} from "./lib/api.js";

/* 🏢 CONTEXT PROVIDERS */
// Removed CompanyProvider (Now managed in main.jsx)
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

/* 🏗️ LAYOUTS & PAGES */
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManagerLayout from "./layouts/ManagerLayout.jsx";
import Landing from "./pages/public/Landing.jsx";
import Pricing from "./pages/public/Pricing.jsx";
import Signup from "./pages/public/Signup.jsx";
import Login from "./pages/Login.jsx";

/* 📊 SHARED & ADMIN MODULES */
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import GlobalControl from "./pages/admin/GlobalControl.jsx";
import TradingLayout from "./pages/trading/TradingLayout.jsx";
import NotFound from "./pages/NotFound.jsx";
// (Note: Keep your other imports like SOC, Threats, etc., as they were)

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
        <Route path="global" element={<GlobalControl />} />
        <Route path="trading/*" element={<TradingLayout />} />
        {/* ... Other Admin Routes ... */}
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
        <Route index element={<AdminOverview />} /> 
        {/* ... Other Manager Routes ... */}
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
          setUser(storedUser); 
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
        background: "#0a0a0a", color: "#00ff88", height: "100vh", 
        display: "flex", flexDirection: "column", alignItems: "center", 
        justifyContent: "center", fontFamily: "monospace" 
      }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>🛡️ AUTOSHIELD</h1>
        <p style={{ color: "#666" }}>INITIALIZING STEALTH CORE...</p>
      </div>
    );
  }

  return (
    <EventBusProvider>
      <AIDecisionProvider>
        <TradingProvider>
          {/* CompanyProvider is now handled at the Root (main.jsx) */}
          <SecurityProvider>
            <ToolProvider user={user}>
              {/* Headless Logic Engines */}
              <BrainAdapter />
              <AutoDevEngine />
              
              <AppRoutes user={user} ready={ready} />
            </ToolProvider>
          </SecurityProvider>
        </TradingProvider>
      </AIDecisionProvider>
    </EventBusProvider>
  );
}

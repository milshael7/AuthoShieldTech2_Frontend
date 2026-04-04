// ==========================================================
// 🔒 AUTOSHIELD CORE — v35.0 (VERCEL-ALIGNED)
// FILE: frontend/src/App.jsx
// ==========================================================

import React, { useEffect, useState, useRef } from "react";
import { Routes, Route } from "react-router-dom";

/* 🛠️ CORE UTILS & API */
// ✅ FIXED: api is now the default export. Named helpers stay in braces.
import api, { 
  getSavedUser, 
  getToken, 
  setToken, 
  saveUser 
} from "./lib/api.js";

/* 🏢 CONTEXT PROVIDERS */
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

        // ✅ REPLACED: Manual fetch with hardened api.request 
        // This ensures headers and base URLs are always correct
        const res = await api.status(); 

        if (res.ok && res.user) {
            setUser(res.user);
            saveUser(res.user);
        } else {
            // If the token is valid enough to get a 200, keep the session
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
        justifyContent: "center", fontFamily: "monospace", textAlign: "center",
        padding: "20px"
      }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "10px", letterSpacing: "4px" }}>🛡️ AUTOSHIELD</h1>
        <p style={{ color: "#444", fontSize: "0.7rem", fontWeight: "bold" }}>INITIALIZING STEALTH CORE • v35.0</p>
      </div>
    );
  }

  return (
    <EventBusProvider>
      <AIDecisionProvider>
        <TradingProvider>
          <SecurityProvider>
            <ToolProvider user={user}>
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

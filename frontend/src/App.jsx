// ==========================================================
// 🔒 AUTOSHIELD CORE — v35.1 (CRASH-RESISTANT)
// FILE: frontend/src/App.jsx
// ==========================================================

import React, { useEffect, useState, useRef } from "react";
import { Routes, Route } from "react-router-dom";

import api, { 
  getSavedUser, 
  getToken, 
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
import PlatformGate from "./components/PlatformGate.jsx";

/* 🏗️ LAYOUTS & PAGES */
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManagerLayout from "./layouts/ManagerLayout.jsx";
import Landing from "./pages/public/Landing.jsx";
import Pricing from "./pages/public/Pricing.jsx";
import Signup from "./pages/public/Signup.jsx";
import Login from "./pages/Login.jsx";
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import GlobalControl from "./pages/admin/GlobalControl.jsx";
import TradingLayout from "./pages/trading/TradingLayout.jsx";
import NotFound from "./pages/NotFound.jsx";

function AppRoutes({ user, ready }) {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

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

        if (!token) {
          setReady(true);
          return;
        }

        // Use a timeout so the boot doesn't hang the UI forever
        const res = await Promise.race([
          api.status(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
        ]);

        if (res?.ok && res?.user) {
            setUser(res.user);
            saveUser(res.user);
        } else if (storedUser) {
            setUser(storedUser);
        }
      } catch (err) {
        console.warn("Auth Boot Shielded:", err.message);
        const backupUser = getSavedUser();
        if (backupUser) setUser(backupUser);
      } finally {
        setReady(true);
      }
    }

    bootAuth();
  }, []);

  // LOADING STATE (Matches your branding)
  if (!ready) {
    return (
      <div style={{ 
        background: "#050505", color: "#00ff88", height: "100vh", 
        display: "flex", flexDirection: "column", alignItems: "center", 
        justifyContent: "center", fontFamily: "monospace", textAlign: "center"
      }}>
        <div style={{ border: "1px solid #00ff88", padding: "40px", borderRadius: "4px" }}>
            <h1 style={{ fontSize: "1.5rem", margin: 0, letterSpacing: "8px" }}>AUTOSHIELD</h1>
            <div style={{ height: "2px", background: "#00ff88", width: "100%", marginTop: "10px", opacity: 0.3 }}></div>
            <p style={{ color: "#444", fontSize: "0.6rem", marginTop: "15px" }}>ESTABLISHING SECURE PROTOCOLS...</p>
        </div>
      </div>
    );
  }

  return (
    <EventBusProvider>
      <SecurityProvider>
        <AIDecisionProvider>
          <TradingProvider>
            {/* ToolProvider gets a default object if user is null to prevent the Root Crash */}
            <ToolProvider user={user || { role: 'guest', id: 'booting' }}>
              <BrainAdapter />
              <AutoDevEngine />
              <AppRoutes user={user} ready={ready} />
            </ToolProvider>
          </TradingProvider>
        </AIDecisionProvider>
      </SecurityProvider>
    </EventBusProvider>
  );
}

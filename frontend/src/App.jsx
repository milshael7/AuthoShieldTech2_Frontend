// ==========================================================
// 🛡️ AUTOSHIELD CORE — v35.2 (UNIFIED & STALL-PROOF)
// FILE: frontend/src/App.jsx
// ==========================================================

import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";

/* 🔑 AUTH & SECURITY */
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { SecurityProvider } from "./context/SecurityContext.jsx";
import { TradingProvider } from "./context/TradingContext.jsx";

/* 🏢 CONTEXT PROVIDERS */
import { ToolProvider } from "./pages/tools/ToolContext.jsx";
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

/**
 * 🛰️ ROUTE ARCHITECTURE
 */
function AppRoutes() {
  const { user, loading } = useAuth(); // Now pulling from the unified context

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin/*"
        element={
          <PlatformGate user={user} ready={!loading} allow={["admin"]}>
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
          <PlatformGate user={user} ready={!loading} allow={["manager", "admin"]}>
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

/**
 * 🏗️ MASTER PROVIDER WRAPPER
 */
export default function App() {
  return (
    <BrowserRouter> {/* Ensures Routing is handled at the root */}
      <AuthProvider>
        <EventBusProvider>
          <SecurityProvider>
            <AIDecisionProvider>
              <TradingProvider>
                <AuthWrapper />
              </TradingProvider>
            </AIDecisionProvider>
          </SecurityProvider>
        </EventBusProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * 🔒 AUTH WRAPPER: Handles the Boot UI and ToolProvider Sync
 */
function AuthWrapper() {
  const { user, loading } = useAuth();

  // Show branding while AuthContext verifies the token
  if (loading) {
    return (
      <div style={{ 
        background: "#050505", color: "#00ff88", height: "100vh", 
        display: "flex", flexDirection: "column", alignItems: "center", 
        justifyContent: "center", fontFamily: "monospace", textAlign: "center"
      }}>
        <div style={{ border: "1px solid #00ff88", padding: "40px", borderRadius: "4px" }}>
            <h1 style={{ fontSize: "1.5rem", margin: 0, letterSpacing: "8px" }}>AUTOSHIELD</h1>
            <div style={{ height: "2px", background: "#00ff88", width: "100%", marginTop: "10px", opacity: 0.3 }}></div>
            <p style={{ color: "rgba(0,255,136,0.4)", fontSize: "0.6rem", marginTop: "15px" }}>INITIALIZING_SECURE_PROTOCOLS...</p>
        </div>
      </div>
    );
  }

  return (
    <ToolProvider user={user || { role: 'guest', id: 'booting' }}>
      <BrainAdapter />
      <AutoDevEngine />
      <AppRoutes />
    </ToolProvider>
  );
}

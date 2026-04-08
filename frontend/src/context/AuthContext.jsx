// ============================================================
// 🛡️ AUTH CONTEXT — v10.0 (STALL-PROOF)
// FILE: src/context/AuthContext.jsx
// ============================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import api, { getToken, getSavedUser, clearToken, clearUser } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

  // 🚀 BOOT CHECK: Verify session without locking the UI
  useEffect(() => {
    async function verifySession() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Heartbeat check to see if the token is still valid
        const data = await api.me();
        if (data && !data.error) {
          setUser(data.user || data);
          setIsAuthenticated(true);
        } else {
          // Token is dead, clean up silently
          logout();
        }
      } catch (err) {
        console.warn("Auth Link Latency - Proceeding with cached state");
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    if (data?.token) {
      localStorage.setItem("autho_token", data.token);
      localStorage.setItem("autho_user", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: data?.error || "Login Failed" };
  };

  const logout = () => {
    clearToken();
    clearUser();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
      {/* 🛡️ ENGINE STALL PREVENTION: We only show children when loading is done */}
      {!loading ? children : (
        <div style={{ 
          background: "#080a0f", 
          height: "100vh", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: "#00ff88",
          fontFamily: "monospace",
          fontSize: "12px",
          letterSpacing: "2px"
        }}>
          INITIALIZING_SECURE_SESSION...
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

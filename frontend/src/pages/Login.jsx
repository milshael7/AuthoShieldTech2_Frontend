import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken, saveUser } from "../lib/api.js";

function extractToken(result) {
  if (!result) return "";
  return (
    result.token ||
    result.jwt ||
    result.access_token ||
    result.accessToken ||
    ""
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await api.login(email, password);

      const token = extractToken(result);
      if (!token) throw new Error("No token returned");

      // ✅ STORE USING CORRECT KEYS
      setToken(token);

      if (result.user) {
        saveUser(result.user);
      }

      // ✅ ROUTE BY ROLE
      const role = result.user?.role;

      if (role === "Admin") navigate("/admin");
      else if (role === "Manager") navigate("/manager");
      else if (role === "Company") navigate("/company");
      else navigate("/user");

    } catch (err) {
      alert(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    try {
      await api.resetPassword(resetEmail, resetPass);
      alert("Password updated. Now sign in.");
      setMode("login");
    } catch (err) {
      alert(err?.message || "Reset failed");
    }
  };

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h2>{mode === "login" ? "Sign in" : "Reset password"}</h2>

          {mode === "login" ? (
            <form onSubmit={submit}>
              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div style={{ height: 10 }} />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div style={{ height: 12 }} />

              <button type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <div style={{ height: 10 }} />

              <small>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("reset");
                  }}
                >
                  Reset password
                </a>
              </small>
            </form>
          ) : (
            <form onSubmit={reset}>
              <input
                placeholder="Email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <div style={{ height: 10 }} />

              <input
                type="password"
                placeholder="New password"
                value={resetPass}
                onChange={(e) => setResetPass(e.target.value)}
              />
              <div style={{ height: 12 }} />

              <button type="submit">Set new password</button>

              <div style={{ height: 10 }} />

              <small>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("login");
                  }}
                >
                  Back
                </a>
              </small>
            </form>
          )}
        </div>
      </div>

      <div className="col">
        <div className="card">
          <h3>Trial ($19.99 / 30 days)</h3>
          <small>
            Text-only experience with Read Aloud. AutoProtect add-on is separate.
          </small>
        </div>
      </div>
    </div>
  );
}

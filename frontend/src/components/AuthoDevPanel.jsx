// frontend/src/components/AuthoDevPanel.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { readAloud, stopReadAloud } from "./ReadAloud";

const MAX_MESSAGES = 50;

/* ================= HELPERS ================= */

function getApiBase() {
  return (
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "");
}

function buildUrl(base, path) {
  if (!base) return path;
  return base + "/" + path.replace(/^\/+/, "");
}

/* ================= STORAGE ================= */

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, val); } catch {}
}

function getRoomId() {
  if (typeof window === "undefined") return "root";
  return window.location.pathname.replace(/\/+$/, "") || "root";
}

function getUser() {
  try { return JSON.parse(localStorage.getItem("as_user") || "null"); }
  catch { return null; }
}

function getStorageKey() {
  const user = getUser();
  const tenant = user?.companyId || user?.company || "unknown";
  return `authodev.panel.${tenant}.${getRoomId()}`;
}

function copyText(text) {
  try { navigator.clipboard?.writeText(String(text || "")); } catch {}
}

/* ================= CONTEXT ================= */

function detectModule() {
  const path = window.location.pathname;
  if (path.includes("/admin/trading")) return "trading";
  if (path.includes("/admin/security")) return "security";
  if (path.includes("/admin/risk")) return "risk";
  if (path.includes("/admin/incidents")) return "incident";
  if (path.includes("/admin/companies")) return "company";
  return "platform";
}

/* ================= COMPONENT ================= */

export default function AuthoDevPanel({
  title = "Advisor",
  endpoint = "/api/ai/chat",
  getContext,
}) {

  const API_BASE = useMemo(() => getApiBase(), []);
  const apiUrl = useMemo(() => buildUrl(API_BASE, endpoint), [API_BASE, endpoint]);

  const mountedRef = useRef(true);
  const abortRef = useRef(null);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  const storageKey = useMemo(() => getStorageKey(), []);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  /* ================= LIFECYCLE ================= */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      try { stopReadAloud(); } catch {}
      try { abortRef.current?.abort(); } catch {}
    };
  }, []);

  /* ================= STORAGE ================= */

  useEffect(() => {
    const raw = safeGet(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.messages)) {
        setMessages(parsed.messages);
      }
    } catch {}

  }, [storageKey]);

  useEffect(() => {
    safeSet(storageKey, JSON.stringify({
      messages,
      lastActive: Date.now(),
    }));
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SPEECH ================= */

  function handleSpeak(text) {
    readAloud(text);
  }

  /* ================= VOICE INPUT ================= */

  function startListening() {

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    try { recognitionRef.current?.stop(); } catch {}

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;

    rec.onstart = () => mountedRef.current && setListening(true);
    rec.onend = () => mountedRef.current && setListening(false);

    rec.onresult = (e) => {
      const last = e.results?.[e.results.length - 1];
      const text = last?.[0]?.transcript || "";
      if (text) setInput(text);
    };

    recognitionRef.current = rec;
    rec.start();

  }

  function stopListening() {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }

  /* ================= SEND ================= */

  async function sendMessage() {

    const messageText = String(input || "").trim();
    if (!messageText || loading) return;

    if (listening) stopListening();

    setMessages(m => [
      ...m.slice(-MAX_MESSAGES + 1),
      { role: "user", text: messageText, ts: Date.now() }
    ]);

    setInput("");
    setLoading(true);

    try {

      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      const ctxFromParent = typeof getContext === "function" ? getContext() : {};
      const module = detectModule();

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          message: messageText,
          context: {
            ...ctxFromParent,
            module,
            tradingActive: module === "trading",
            location: window.location.pathname,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      const reply = data?.reply || "Assistant unavailable.";

      if (!mountedRef.current) return;

      setMessages(m => [
        ...m.slice(-MAX_MESSAGES + 1),
        { role: "ai", text: reply, ts: Date.now() }
      ]);

    }
    catch {

      if (!mountedRef.current) return;

      setMessages(m => [
        ...m.slice(-MAX_MESSAGES + 1),
        { role: "ai", text: "Assistant unavailable.", ts: Date.now() }
      ]);

    }
    finally {

      mountedRef.current && setLoading(false);

    }

  }

  /* ================= UI ================= */

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
        {title}
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>

        {messages.map((m, i) => (

          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start" }}>

            <div
              style={{
                maxWidth: "75%",
                padding: "14px 18px",
                borderRadius: 18,
                background:
                  m.role === "user"
                    ? "linear-gradient(135deg,#5EC6FF,#7aa2ff)"
                    : "rgba(255,255,255,.06)",
                color: "#fff",
              }}
            >
              {m.text}
            </div>

            {m.role === "ai" && (

              <div style={{ display: "flex", gap: 1, marginTop: 6, opacity: 0.75 }}>

                <button onClick={() => handleSpeak(m.text)}>🔊</button>
                <button onClick={() => copyText(m.text)}>📋</button>
                <button>👍</button>
                <button>👎</button>
                <button>🔄</button>
                <button>🔗</button>

              </div>

            )}

          </div>

        ))}

        <div ref={bottomRef} />

      </div>

      {/* INPUT */}

      <div
        style={{
          marginTop: 14,
          padding: "10px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,.05)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >

        <button onClick={!listening ? startListening : stopListening}>🎤</button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            resize: "none",
            fontSize: 14,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button onClick={sendMessage}>➤</button>

      </div>

    </div>
  );
}

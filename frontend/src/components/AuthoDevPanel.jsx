// frontend/src/components/AuthoDevPanel.jsx
// AuthoDevPanel — Shell-Safe Enterprise Advisor (HARDENED)
// FIXED: no disposed objects • abort-safe • speech-safe • unmount-safe

import React, { useEffect, useMemo, useRef, useState } from "react";
import { readAloud, stopReadAloud } from "./ReadAloud";

const MAX_MESSAGES = 50;

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
  const mountedRef = useRef(true);
  const abortRef = useRef(null);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  const storageKey = useMemo(() => getStorageKey(), []);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);

  /* ================= MOUNT / UNMOUNT ================= */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      try { recognitionRef.current?.stop(); } catch {}
      try { stopReadAloud(); } catch {}
      try { abortRef.current?.abort(); } catch {}

      recognitionRef.current = null;
      abortRef.current = null;
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
    if (!mountedRef.current) return;
    safeSet(storageKey, JSON.stringify({
      messages,
      lastActive: Date.now(),
    }));
  }, [messages, storageKey]);

  useEffect(() => {
    if (!mountedRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SPEECH ================= */

  function handleSpeak(text, index) {
    setSpeakingIndex(index);
    readAloud(text, () => {
      if (mountedRef.current) setSpeakingIndex(null);
    });
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
      if (!mountedRef.current) return;
      const last = e.results?.[e.results.length - 1];
      const text = last?.[0]?.transcript || "";
      if (text) setInput(text);
    };

    recognitionRef.current = rec;
    rec.start();
  }

  function stopListening() {
    try { recognitionRef.current?.stop(); } catch {}
    if (mountedRef.current) setListening(false);
  }

  /* ================= SEND ================= */

  async function sendMessage(customText = null, replaceIndex = null) {
    const messageText = String(customText ?? input ?? "").trim();
    if (!messageText || loading) return;

    if (listening) stopListening();

    if (replaceIndex === null) {
      setMessages(m => [
        ...m.slice(-MAX_MESSAGES + 1),
        { role: "user", text: messageText, ts: new Date().toLocaleTimeString() }
      ]);
      setInput("");
    }

    setLoading(true);

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const ctxFromParent = typeof getContext === "function" ? getContext() : {};
      const module = detectModule();

      const res = await fetch(endpoint, {
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
            location: window.location.pathname
          }
        }),
      });

      if (!mountedRef.current) return;

      const data = await res.json().catch(() => ({}));
      const reply = data?.reply || "Assistant unavailable.";

      setMessages(prev => {
        const newMsg = { role: "ai", text: reply, ts: new Date().toLocaleTimeString() };
        if (replaceIndex !== null) {
          const copy = [...prev];
          copy[replaceIndex] = newMsg;
          return copy;
        }
        return [...prev.slice(-MAX_MESSAGES + 1), newMsg];
      });

    } catch {
      if (!mountedRef.current) return;
      setMessages(prev => [
        ...prev.slice(-MAX_MESSAGES + 1),
        { role: "ai", text: "Assistant unavailable.", ts: new Date().toLocaleTimeString() }
      ]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 13, opacity: .7, marginBottom: 12 }}>{title}</div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 26 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "75%",
              padding: "14px 18px",
              borderRadius: 18,
              background: m.role === "user"
                ? "linear-gradient(135deg,#5EC6FF,#7aa2ff)"
                : "rgba(255,255,255,.06)",
              color: "#fff"
            }}>
              {m.text}
            </div>

            {m.role === "ai" && (
              <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
                <IconButton onClick={() => handleSpeak(m.text, i)}>🔊</IconButton>
                <IconButton onClick={() => copyText(m.text)}>📋</IconButton>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything"
          style={{ flex: 1 }}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button onClick={() => sendMessage()}>Send</button>
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */

const IconButton = ({ children, onClick }) => (
  <button onClick={onClick} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
    {children}
  </button>
);

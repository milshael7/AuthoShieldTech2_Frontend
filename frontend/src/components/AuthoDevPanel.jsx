// frontend/src/components/AuthoDevPanel.jsx
// AuthoDevPanel — Enterprise Advisor v6.5 (RESTORED)
// SHELL-SAFE • ABORT-SAFE • SPEECH-SAFE • FULL COMMAND UI

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
      if (Array.isArray(parsed?.messages)) setMessages(parsed.messages);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!mountedRef.current) return;
    safeSet(storageKey, JSON.stringify({ messages, lastActive: Date.now() }));
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SPEECH ================= */

  function handleSpeak(text, index) {
    setSpeakingIndex(index);
    readAloud(text, () => mountedRef.current && setSpeakingIndex(null));
  }

  /* ================= SEND ================= */

  async function sendMessage(customText = null, replaceIndex = null) {
    const messageText = String(customText ?? input ?? "").trim();
    if (!messageText || loading) return;

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
          context: { ...ctxFromParent, module, location: window.location.pathname }
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
      mountedRef.current && setLoading(false);
    }
  }

  function regenerate(index) {
    const previousUser = [...messages].slice(0, index).reverse()
      .find(m => m.role === "user");
    if (previousUser?.text) sendMessage(previousUser.text, index);
  }

  function share(text) {
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else copyText(text);
  }

  function react(index, type) {
    setMessages(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], reaction: type };
      return copy;
    });
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
              <div style={{ display: "flex", gap: 14, marginTop: 12, opacity: .85 }}>
                <IconBtn onClick={() => handleSpeak(m.text, i)}>🔊</IconBtn>
                <IconBtn onClick={() => copyText(m.text)}>📋</IconBtn>
                <IconBtn onClick={() => react(i, "up")}>👍</IconBtn>
                <IconBtn onClick={() => react(i, "down")}>👎</IconBtn>
                <IconBtn onClick={() => regenerate(i)}>🔁</IconBtn>
                <IconBtn onClick={() => share(m.text)}>📤</IconBtn>
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
        <button onClick={() => sendMessage()} disabled={loading}>
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

/* ================= UI ================= */

const IconBtn = ({ children, onClick }) => (
  <button
    onClick={onClick}
    style={{
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: 14
    }}
  >
    {children}
  </button>
);

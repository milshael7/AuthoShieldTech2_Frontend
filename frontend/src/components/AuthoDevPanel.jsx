// frontend/src/components/AuthoDevPanel.jsx
// AuthoDev 6.5 — Universal AI Text + Speech Panel (HARDENED)
//
// RESPONSIBILITY:
// - Text-based advisory assistant
// - Optional click-to-speak (TTS)
// - Role + page aware context
//
// ENFORCEMENT:
// - NO microphone
// - NO auto speech
// - NO execution
// - NO UI layout changes
// - Speech is USER-INITIATED ONLY

import React, { useEffect, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";
import { getSavedUser } from "../lib/api";

/* ================= HELPERS ================= */

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
}

function getRoomId() {
  const path = window.location.pathname.replace(/\/+$/, "");
  return path || "root";
}

function getStorageKey() {
  const user = getSavedUser();
  const tenantId = user?.companyId || user?.company || "unknown";
  const roomId = getRoomId();
  return `authodev.panel.${tenantId}.${roomId}`;
}

function buildSystemContext(user, pageContext = {}) {
  const role = String(user?.role || "user").toLowerCase();
  const page = pageContext?.page || getRoomId();

  return {
    role,
    page,
    tone: {
      admin:
        "SOC advisor. Concise, technical, decisive. Assume expertise.",
      manager:
        "Risk-focused advisor. Highlight trends and decisions.",
      company:
        "Security guidance. Clear explanations, minimal jargon.",
      user:
        "Simple security assistance. Practical and calm.",
    }[role],
  };
}

/* ================= COMPONENT ================= */

export default function AuthoDevPanel({
  title = "AuthoDev 6.5",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const storageKey = getStorageKey();
  const user = getSavedUser();

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw).messages || [] : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  /* ================= PERSIST ================= */

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ messages }));
    } catch {}
  }, [messages, storageKey]);

  /* ================= SEND ================= */

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg = {
      role: "user",
      text: input.trim(),
      ts: new Date().toLocaleTimeString(),
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const pageContext =
        typeof getContext === "function" ? getContext() : {};

      const systemContext = buildSystemContext(user, pageContext);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMsg.text,
          context: {
            ...pageContext,
            system: systemContext,
          },
        }),
      });

      const data = await res.json();

      const aiText = data?.reply || "No response available.";

      const aiMsg = {
        role: "ai",
        text: aiText,
        speakText: data?.speakText || aiText,
        ts: new Date().toLocaleTimeString(),
      };

      setMessages((m) => [...m, aiMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text:
            "The assistant is temporarily unavailable. Please retry shortly.",
          speakText:
            "The assistant is temporarily unavailable. Please retry shortly.",
          ts: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    }
  }

  /* ================= UI ================= */

  return (
    <div className="authodev-panel">
      <header className="ad-header">
        <div className="ad-title">
          <span className="ad-badge">AI</span>
          <h3>{title}</h3>
        </div>
        <span className="ad-sub">Advisory assistant</span>
      </header>

      <div className="ad-messages">
        {messages.map((m, i) => (
          <div key={i} className={`ad-msg ${m.role}`}>
            <div className="ad-text">{m.text}</div>

            {m.role === "ai" && (
              <div className="ad-actions">
                <button
                  title="Read aloud"
                  onClick={() => readAloud(m.speakText)}
                >
                  🔊
                </button>
                <button title="Copy" onClick={() => copyText(m.text)}>
                  📋
                </button>
                <button title="Helpful">👍</button>
                <button title="Not helpful">👎</button>
                <button
                  title="Share"
                  onClick={() =>
                    navigator.share?.({ text: m.text }) ||
                    copyText(m.text)
                  }
                >
                  🔗
                </button>
              </div>
            )}

            <div className="ad-time">{m.ts}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT — TEXT ONLY */}
      <div className="ad-input">
        <textarea
          placeholder="Ask about risks, posture, or actions…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button onClick={sendMessage} disabled={loading}>
          {loading ? "Analyzing…" : "Send"}
        </button>
      </div>
    </div>
  );
}

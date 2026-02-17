// frontend/src/components/AuthoDevPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";

/* ================= STORAGE ================= */

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
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

export default function AuthoDevPanel({
  title = "",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const storageKey = useMemo(() => getStorageKey(), []);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // voice
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const bottomRef = useRef(null);

  /* ================= LOAD / SAVE ================= */

  useEffect(() => {
    const raw = safeGet(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setMessages(Array.isArray(parsed?.messages) ? parsed.messages : []);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    safeSet(storageKey, JSON.stringify({ messages }));
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= VOICE ================= */

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported in this browser.");
      return;
    }

    // stop any previous session
    try { recognitionRef.current?.stop(); } catch {}

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      // take best current transcript
      const last = e.results?.[e.results.length - 1];
      const text = last?.[0]?.transcript || "";
      if (text) setInput(text);
    };

    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
  }

  function stopListening() {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }

  /* ================= ACTIONS ================= */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  async function shareText(text) {
    if (!navigator.share) {
      await copyText(text);
      return;
    }
    try {
      await navigator.share({ text });
    } catch {
      // user cancelled share -> do nothing (prevents that Promise rejection spam)
    }
  }

  function setReaction(index, type) {
    setMessages((m) =>
      m.map((msg, i) => (i === index ? { ...msg, reaction: type } : msg))
    );
  }

  /* ================= SEND ================= */

  async function sendMessage(regenText = null) {
    const messageText = (regenText || input).trim();
    if (!messageText || loading) return;

    if (!regenText) {
      setMessages((m) => [
        ...m,
        { role: "user", text: messageText, ts: new Date().toLocaleTimeString() },
      ]);
      setInput("");
    }

    setLoading(true);

    try {
      const ctx = typeof getContext === "function" ? getContext() : {};
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: messageText, context: ctx }),
      });

      const data = await res.json().catch(() => ({}));
      const reply = data?.reply || "No response available.";

      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: reply,
          speakText: data?.speakText || reply,
          reaction: null,
          ts: new Date().toLocaleTimeString(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "Assistant unavailable.",
          speakText: "Assistant unavailable.",
          reaction: null,
          ts: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="advisor-wrap">
      {/* HEADER (stays) */}
      <div className="advisor-miniTitle">
        {title || "Advisor"}
      </div>

      {/* FEED (scrolls only) */}
      <div className="advisor-feed">
        {messages.map((m, i) => (
          <div key={i} className={`advisor-row ${m.role}`}>
            <div className="advisor-bubble">{m.text}</div>

            {m.role === "ai" && (
              <div className="advisor-actions">
                <button onClick={() => readAloud(m.speakText)} title="Read aloud">🔊</button>
                <button onClick={() => copyText(m.text)} title="Copy">⧉</button>
                <button onClick={() => shareText(m.text)} title="Share">⇪</button>

                <button
                  className={m.reaction === "up" ? "active" : ""}
                  onClick={() => setReaction(i, "up")}
                  title="Helpful"
                >
                  👍
                </button>

                <button
                  className={m.reaction === "down" ? "active" : ""}
                  onClick={() => setReaction(i, "down")}
                  title="Not helpful"
                >
                  👎
                </button>

                <button onClick={() => sendMessage(m.text)} title="Regenerate">↻</button>
              </div>
            )}

            <div className="advisor-ts">{m.ts}</div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* INPUT (stays) */}
      <div className="advisor-inputBar">
        {/* MIC LEFT */}
        {!listening ? (
          <button className="advisor-micBtn" onClick={startListening} title="Voice">
            🎙
          </button>
        ) : (
          <button className="advisor-micBtn" onClick={stopListening} title="Stop">
            ■
          </button>
        )}

        {/* CENTER INPUT */}
        <div className="advisor-inputCenter">
          <textarea
            className="advisor-textarea"
            placeholder="Ask about threats, posture, compliance…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          {/* VOICE BARS (only while listening) */}
          {listening && (
            <div className="advisor-bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {/* SEND RIGHT */}
        <button
          className="advisor-sendBtn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          title="Send"
        >
          ➤
        </button>
      </div>

      {loading && <div className="advisor-loading">Analyzing…</div>}
    </div>
  );
}

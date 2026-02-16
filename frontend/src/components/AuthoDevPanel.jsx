import React, { useEffect, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";

/* ================= STORAGE ================= */

function safeGet(key) {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); }
  catch {}
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

/* ================= COMPONENT ================= */

export default function AuthoDevPanel({
  title = "Security Advisor",
  endpoint = "/api/ai/chat",
  getContext
}) {
  const storageKey = getStorageKey();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  /* ================= LOAD / SAVE ================= */

  useEffect(() => {
    const raw = safeGet(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setMessages(parsed?.messages || []);
      } catch {}
    }
  }, [storageKey]);

  useEffect(() => {
    safeSet(storageKey, JSON.stringify({ messages }));
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= VOICE INPUT ================= */

  function startListening() {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice not supported in this browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  /* ================= SEND ================= */

  async function sendMessage(regenerateText = null) {
    const messageText = regenerateText || input.trim();
    if (!messageText || loading) return;

    if (!regenerateText) {
      setMessages(m => [
        ...m,
        { role: "user", text: messageText, ts: new Date().toLocaleTimeString() }
      ]);
      setInput("");
    }

    setLoading(true);

    try {
      const context =
        typeof getContext === "function" ? getContext() : {};

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: messageText,
          context
        })
      });

      const data = await res.json().catch(() => ({}));

      setMessages(m => [
        ...m,
        {
          role: "ai",
          text: data?.reply || "No response available.",
          speakText: data?.speakText || data?.reply,
          reaction: null,
          ts: new Date().toLocaleTimeString()
        }
      ]);

    } catch {
      setMessages(m => [
        ...m,
        {
          role: "ai",
          text: "Assistant unavailable.",
          speakText: "Assistant unavailable.",
          reaction: null,
          ts: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= MESSAGE ACTIONS ================= */

  function copyText(text) {
    navigator.clipboard.writeText(text);
  }

  function shareText(text) {
    if (navigator.share) {
      navigator.share({ text });
    } else {
      copyText(text);
      alert("Copied (sharing not supported).");
    }
  }

  function setReaction(index, type) {
    setMessages(m =>
      m.map((msg, i) =>
        i === index ? { ...msg, reaction: type } : msg
      )
    );
  }

  /* ================= UI ================= */

  return (
    <div className="advisor-container">

      <div className="advisor-header">
        <strong>{title}</strong>
      </div>

      <div className="advisor-messages">
        {messages.map((m, i) => (
          <div key={i} className={`advisor-bubble ${m.role}`}>

            <div className="advisor-text">{m.text}</div>

            {m.role === "ai" && (
              <div className="advisor-actions">

                <button onClick={() => readAloud(m.speakText)}>🔊</button>
                <button onClick={() => copyText(m.text)}>📋</button>
                <button onClick={() => shareText(m.text)}>📤</button>

                <button
                  className={m.reaction === "up" ? "active" : ""}
                  onClick={() => setReaction(i, "up")}
                >
                  👍
                </button>

                <button
                  className={m.reaction === "down" ? "active" : ""}
                  onClick={() => setReaction(i, "down")}
                >
                  👎
                </button>

                <button onClick={() => sendMessage(m.text)}>↻</button>

              </div>
            )}

            <div className="advisor-time">{m.ts}</div>

          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="advisor-input">

        <textarea
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={2}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <div className="advisor-input-actions">

          {!listening ? (
            <button onClick={startListening}>🎙</button>
          ) : (
            <button onClick={stopListening}>⏹</button>
          )}

          <button onClick={() => sendMessage()}>
            ➤
          </button>

        </div>

      </div>
    </div>
  );
}

// frontend/src/components/VoiceAI.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * VoiceAI
 * - Push-to-talk OR Conversation mode (hands-free)
 * - Speaks replies using SpeechSynthesis
 * - Sends message + context to backend endpoint (default: /api/ai/chat)
 *
 * IMPORTANT:
 * - Mic must be started by user gesture (mobile/browser rule)
 */

function getApiBase() {
  return (
    (import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL ||
      "https://authoshieldtech2.onrender.com") + ""
  ).trim();
}

// Professional voice chooser (no “extra/joke” labels)
// Picks the best match available on the device.
function buildProfessionalVoiceChoices(voices) {
  const list = Array.isArray(voices) ? voices : [];
  const find = (pred) => list.find(pred);

  const candidates = [
    // iOS / macOS often
    {
      id: "us_female_premium",
      label: "US English (Female) — Clear",
      match: (v) =>
        /en-US/i.test(v.lang) &&
        /(Siri|Samantha|Ava|Allison|Jenny|Aria|Google US English)/i.test(v.name),
    },
    {
      id: "us_male_premium",
      label: "US English (Male) — Clear",
      match: (v) =>
        /en-US/i.test(v.lang) &&
        /(Siri|Alex|Daniel|Tom|Guy|Davis|Matthew|Google US English)/i.test(v.name),
    },

    // UK
    {
      id: "uk_professional",
      label: "UK English — Professional",
      match: (v) => /en-GB/i.test(v.lang),
    },

    // Neutral English fallback
    {
      id: "english_neutral",
      label: "English — Neutral",
      match: (v) => /^en/i.test(v.lang),
    },

    // Accessibility / enhanced (varies)
    {
      id: "accessibility",
      label: "English — Accessibility / Enhanced",
      match: (v) =>
        /^en/i.test(v.lang) && /(compact|enhanced|premium|neural)/i.test(v.name),
    },

    // System default fallback (whatever the device prefers)
    {
      id: "system_default",
      label: "System Default",
      match: (v) => true,
    },
  ];

  const resolved = [];
  for (const c of candidates) {
    const v = find(c.match);
    if (v && !resolved.some((x) => x.voiceName === v.name && x.lang === v.lang)) {
      resolved.push({ id: c.id, label: c.label, voiceName: v.name, lang: v.lang });
    }
  }

  // If somehow nothing resolved, use first available
  if (resolved.length === 0 && list.length) {
    resolved.push({
      id: "fallback",
      label: "System Default",
      voiceName: list[0].name,
      lang: list[0].lang,
    });
  }

  // Keep it tight + professional (max 6)
  return resolved.slice(0, 6);
}

export default function VoiceAI({
  endpoint = "/api/ai/chat",
  title = "AutoProtect Voice",
  getContext,
}) {
  const API_BASE = useMemo(() => getApiBase(), []);
  const [supported, setSupported] = useState(true);

  // Modes (exactly what you described)
  const [conversationMode, setConversationMode] = useState(false); // hands-free
  const [voiceReply, setVoiceReply] = useState(true);

  // UI / status
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [youSaid, setYouSaid] = useState("");
  const [aiSays, setAiSays] = useState("");
  const [lastErr, setLastErr] = useState("");

  // voices
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [voiceChoice, setVoiceChoice] = useState(() => {
    try {
      return window.localStorage.getItem("autoprotect_voice_choice") || "us_female_premium";
    } catch {
      return "us_female_premium";
    }
  });

  // SpeechRecognition
  const recRef = useRef(null);
  const bufferFinalRef = useRef("");
  const interimRef = useRef("");
  const silenceTimerRef = useRef(null);
  const lastSendRef = useRef("");
  const busyRef = useRef(false);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Load voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const load = () => {
      const v = window.speechSynthesis.getVoices?.() || [];
      const opts = buildProfessionalVoiceChoices(v);
      setVoiceOptions(opts);

      if (opts.length && !opts.some((o) => o.id === voiceChoice)) {
        setVoiceChoice(opts[0].id);
      }
    };

    load();
    window.speechSynthesis.onvoiceschanged = load;

    return () => {
      try { window.speechSynthesis.onvoiceschanged = null; } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save voice choice
  useEffect(() => {
    try {
      window.localStorage.setItem("autoprotect_voice_choice", voiceChoice);
    } catch {}
  }, [voiceChoice]);

  // Setup SpeechRecognition
  useEffect(() => {
    if (!SpeechRecognition) {
      setSupported(false);
      setStatus("SpeechRecognition not supported on this device/browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      setListening(true);
      setLastErr("");
      setStatus(conversationMode ? "Conversation listening…" : "Listening…");
    };

    rec.onerror = (e) => {
      setListening(false);
      clearTimeout(silenceTimerRef.current);
      const msg = "Mic error: " + (e?.error || "unknown");
      setLastErr(msg);
      setStatus(msg);
    };

    rec.onend = () => {
      setListening(false);
      clearTimeout(silenceTimerRef.current);

      if (!conversationMode) {
        const finalText = (bufferFinalRef.current + " " + interimRef.current).trim();
        bufferFinalRef.current = "";
        interimRef.current = "";
        setYouSaid(finalText || "");
        if (finalText) void sendToAI(finalText);
        setStatus("Idle");
      } else {
        setStatus("Conversation paused (tap Start to resume)");
      }
    };

    rec.onresult = (event) => {
      let finalText = bufferFinalRef.current || "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const text = r[0]?.transcript || "";
        if (r.isFinal) finalText += text + " ";
        else interim += text;
      }

      bufferFinalRef.current = finalText;
      interimRef.current = interim;

      const combined = (finalText + interim).trim();
      setYouSaid(combined);

      if (conversationMode) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const msg = (bufferFinalRef.current + " " + interimRef.current).trim();
          if (!msg) return;

          if (msg === lastSendRef.current) return;
          lastSendRef.current = msg;

          bufferFinalRef.current = "";
          interimRef.current = "";
          setYouSaid(msg);

          void sendToAI(msg);
        }, 900);
      }
    };

    recRef.current = rec;

    return () => {
      try { rec.stop(); } catch {}
      clearTimeout(silenceTimerRef.current);
    };
  }, [conversationMode, SpeechRecognition]);

  function pickVoice() {
    try {
      const all = window.speechSynthesis.getVoices?.() || [];
      const opt = voiceOptions.find((o) => o.id === voiceChoice);
      if (!opt) return null;
      return all.find((v) => v.name === opt.voiceName) || null;
    } catch {
      return null;
    }
  }

  function speak(text) {
    if (!voiceReply) return;
    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text || ""));

      const chosen = pickVoice();
      if (chosen) u.voice = chosen;

      u.rate = 1.0;
      u.pitch = 1.0;

      u.onstart = () => setStatus("Speaking…");
      u.onend = () => setStatus(conversationMode ? "Conversation listening…" : "Reply ready");

      window.speechSynthesis.speak(u);
    } catch {}
  }

  async function sendToAI(message) {
    const clean = (message || "").trim();
    if (!clean) return;
    if (busyRef.current) return;

    busyRef.current = true;
    setLastErr("");
    setStatus("Thinking…");
    setAiSays("");

    const ctx = (() => {
      try { return typeof getContext === "function" ? (getContext() || {}) : {}; }
      catch { return {}; }
    })();

    const payload = { message: clean, context: ctx };

    try {
      const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || data?.message || data?.detail || `HTTP ${res.status}`;
        setAiSays(String(msg));
        setLastErr(String(msg));
        setStatus("AI error");
        speak("AI error. " + String(msg));
        busyRef.current = false;
        return;
      }

      const text =
        data?.reply ??
        data?.text ??
        data?.message ??
        data?.output ??
        data?.result ??
        "";

      if (!text) {
        setAiSays("(No reply from AI)");
        setStatus("Reply empty");
        speak("I did not receive a reply.");
        busyRef.current = false;
        return;
      }

      setAiSays(text);
      setStatus("Reply ready");
      speak(text);
    } catch {
      setAiSays("Network error calling AI");
      setLastErr("Network error calling AI");
      setStatus("Network error");
      speak("Network error calling the AI.");
    } finally {
      busyRef.current = false;
    }
  }

  function start() {
    if (!recRef.current) return;
    try {
      bufferFinalRef.current = "";
      interimRef.current = "";
      lastSendRef.current = "";
      setYouSaid("");
      setAiSays("");
      setLastErr("");
      recRef.current.start();
    } catch {}
  }

  function stop() {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
  }

  if (!supported) {
    return (
      <div style={card}>
        <div style={rowTop}>
          <div style={titleStyle}>{title}</div>
        </div>
        <div style={{ opacity: 0.85, marginTop: 8 }}>{status}</div>
      </div>
    );
  }

  const actionLabel = listening
    ? "Stop"
    : (conversationMode ? "Start Conversation" : "Push to Talk");

  const selectedVoice = voiceOptions.find(v => v.id === voiceChoice);

  return (
    <div style={card}>
      <div style={rowTop}>
        <div>
          <div style={titleStyle}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
            {conversationMode
              ? "Conversation mode: talk naturally, it replies when you stop."
              : "Quick mode: press button, speak, it replies."}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={statusPill}>{status}</div>
          {lastErr ? <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>⚠️ {lastErr}</div> : null}
        </div>
      </div>

      <div style={controls}>
        <button
          onClick={() => (listening ? stop() : start())}
          style={btnPrimary}
          type="button"
        >
          {actionLabel}
        </button>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={conversationMode}
            onChange={() => setConversationMode((v) => !v)}
          />
          Conversation mode
        </label>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={voiceReply}
            onChange={() => setVoiceReply((v) => !v)}
          />
          Voice reply
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, opacity: 0.85 }}>Voice</span>
          <select
            value={voiceChoice}
            onChange={(e) => setVoiceChoice(e.target.value)}
            style={selectStyle}
          >
            {voiceOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>

          <button
            style={btnSmall}
            onClick={() => speak("Voice preview. AutoProtect is online and ready.")}
            type="button"
          >
            Preview
          </button>
        </div>

        {/* show the actual device voice name (quietly) for clarity/debug */}
        {selectedVoice?.voiceName ? (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Using: <b>{selectedVoice.voiceName}</b>
          </div>
        ) : null}
      </div>

      <div style={box}>
        <div style={boxLabel}>You said</div>
        <div style={boxText}>{youSaid || "…"}</div>
      </div>

      <div style={box}>
        <div style={boxLabel}>AutoProtect says</div>
        <div style={boxText}>{aiSays || "…"}</div>
      </div>
    </div>
  );
}

// ---- styles ----
const card = {
  borderRadius: 14,
  padding: 14,
  background: "rgba(0,0,0,0.38)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(8px)",
};

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
};

const titleStyle = { fontWeight: 900, letterSpacing: 0.2 };

const statusPill = {
  display: "inline-block",
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  opacity: 0.95,
  maxWidth: 260,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const controls = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 12,
  alignItems: "center",
};

const btnPrimary = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.10)",
  color: "white",
  cursor: "pointer",
  fontWeight: 900,
  minWidth: 170,
};

const btnSmall = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const toggle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  opacity: 0.92,
  padding: "6px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.18)",
};

const selectStyle = {
  borderRadius: 12,
  padding: "8px 10px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.28)",
  color: "white",
  outline: "none",
  maxWidth: 260,
};

const box = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.22)",
};

const boxLabel = { fontSize: 12, opacity: 0.78, marginBottom: 6, fontWeight: 800 };
const boxText = { whiteSpace: "pre-wrap", lineHeight: 1.35, fontSize: 14 };

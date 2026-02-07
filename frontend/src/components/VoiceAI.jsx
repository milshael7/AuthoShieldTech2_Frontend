// frontend/src/components/VoiceAI.jsx
// AutoShield Voice — Step 12 FINAL (CORRECTED)
// Persistent-brain aware • Human cadence • History-capable
// SAFE: No internal AI state leakage

import React, { useEffect, useRef, useState, useMemo } from "react";

/* ================= BRAND STATES ================= */

const AI_STATE = {
  IDLE: "Idle",
  LISTENING: "Listening",
  THINKING: "Thinking",
  SPEAKING: "Speaking",
};

/* ================= HELPERS ================= */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cleanForSpeech(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s+/g, "$1 … ")
    .trim();
}

function getApiBase() {
  return String(
    import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL ||
      ""
  ).trim();
}

function joinUrl(base, path) {
  if (!base) return path;
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

/* ================= COMPONENT ================= */

export default function VoiceAI({
  endpoint = "/api/ai/chat",
  title = "AutoShield AI",
  getContext,
}) {
  const API_BASE = useMemo(() => getApiBase(), []);
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const [aiState, setAiState] = useState(AI_STATE.IDLE);
  const [listening, setListening] = useState(false);
  const [youSaid, setYouSaid] = useState("");
  const [aiSays, setAiSays] = useState("");

  const recRef = useRef(null);
  const speakingRef = useRef(false);
  const silenceTimer = useRef(null);
  const busyRef = useRef(false);

  /* ================= SPEAK ================= */

  const speak = async (text) => {
    if (!("speechSynthesis" in window)) return;

    const say = cleanForSpeech(text);
    if (!say) return;

    if (listening) stopListening();

    try {
      const synth = window.speechSynthesis;
      synth.cancel();

      const u = new SpeechSynthesisUtterance(say);
      u.rate = 0.95;
      u.pitch = 0.98;
      u.volume = 1.0;

      speakingRef.current = true;
      setAiState(AI_STATE.SPEAKING);

      u.onend = async () => {
        speakingRef.current = false;
        setAiState(AI_STATE.IDLE);
        await sleep(250);
      };

      synth.speak(u);
    } catch {
      speakingRef.current = false;
      setAiState(AI_STATE.IDLE);
    }
  };

  /* ================= MIC ================= */

  const startListening = () => {
    if (!recRef.current || speakingRef.current) return;
    try {
      recRef.current.start();
    } catch {}
  };

  const stopListening = () => {
    try {
      recRef.current?.stop();
    } catch {}
  };

  useEffect(() => {
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setListening(true);
      setAiState(AI_STATE.LISTENING);
    };

    rec.onend = () => {
      setListening(false);
      if (!speakingRef.current) setAiState(AI_STATE.IDLE);
    };

    rec.onresult = (e) => {
      if (speakingRef.current) return;

      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }

      setYouSaid(text);

      clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        sendToAI(text);
      }, 900);
    };

    recRef.current = rec;
    return () => rec.stop();
  }, []);

  /* ================= AI ================= */

  async function sendToAI(message) {
    const clean = String(message || "").trim();
    if (!clean || busyRef.current) return;

    busyRef.current = true;
    setAiState(AI_STATE.THINKING);
    setAiSays("");

    const payload = {
      message: clean,
      context: {
        ...(typeof getContext === "function" ? getContext() : {}),
        voice: {
          enabled: true,
          lastHeard: clean,
        },
      },
    };

    try {
      const res = await fetch(joinUrl(API_BASE, endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const reply = data?.reply || "";

      setAiSays(reply);
      await speak(data?.speakText || reply);
    } catch {
      setAiSays("I’m having trouble reaching the system.");
      await speak("I’m having trouble reaching the system.");
    } finally {
      busyRef.current = false;
      setAiState(AI_STATE.IDLE);
    }
  }

  /* ================= UI ================= */

  return (
    <div style={card}>
      <div style={header}>
        <div style={titleStyle}>
          {title}
          <span style={{ ...dot, background: stateColor(aiState) }} />
        </div>
        <div style={stateText}>{aiState}</div>
      </div>

      <button
        style={btn}
        onClick={() => (listening ? stopListening() : startListening())}
      >
        {listening ? "Stop Listening" : "Talk to AutoShield"}
      </button>

      <div style={box}>
        <b>You said</b>
        <div>{youSaid || "…"}</div>
      </div>

      <div style={box}>
        <b>AutoShield says</b>
        <div>{aiSays || "…"}</div>
      </div>

      <div style={hint}>
        Speak naturally. AutoShield remembers past context and explains in real
        time.
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const card = {
  padding: 14,
  borderRadius: 16,
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const titleStyle = {
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const dot = {
  width: 10,
  height: 10,
  borderRadius: "50%",
};

const stateText = {
  fontSize: 12,
  opacity: 0.75,
};

const btn = {
  marginTop: 10,
  padding: "12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "#fff",
  fontWeight: 700,
};

const box = {
  marginTop: 10,
  padding: 10,
  borderRadius: 12,
  background: "rgba(0,0,0,.25)",
};

const hint = {
  marginTop: 8,
  fontSize: 12,
  opacity: 0.7,
};

function stateColor(state) {
  if (state === AI_STATE.SPEAKING) return "#2bd576";
  if (state === AI_STATE.THINKING) return "#ffd166";
  if (state === AI_STATE.LISTENING) return "#7aa2ff";
  return "#666";
}

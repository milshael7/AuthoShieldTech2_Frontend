import React, { useEffect, useMemo, useRef, useState } from "react";

function getApiBase() {
  return (
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://authoshieldtech2.onrender.com"
  );
}

function safeJsonParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}

/**
 * Professional voice presets (business tone).
 * We still map to whatever voices the device actually has.
 */
function buildVoicePresets(allVoices) {
  const list = allVoices || [];
  const by = (reLang, reName) =>
    list.find(v => reLang.test(v.lang) && reName.test(v.name));

  const presets = [
    { id: "system_default", label: "System Default (Recommended)", pick: () => list[0] },

    // US
    { id: "pro_us_female_1", label: "Professional US (Female) 1", pick: () => by(/en-US/i, /Samantha|Jenny|Aria|Google US English/i) },
    { id: "pro_us_male_1",   label: "Professional US (Male) 1",   pick: () => by(/en-US/i, /Alex|Daniel|Matthew|Guy|Davis|Google US English/i) },

    // UK
    { id: "pro_uk_1", label: "Professional UK 1", pick: () => by(/en-GB/i, /Serena|Kate|Oliver|George|Google UK English/i) },
    { id: "pro_uk_2", label: "Professional UK 2", pick: () => list.find(v => /en-GB/i.test(v.lang)) },

    // Canada / AU
    { id: "pro_ca_1", label: "Professional Canada", pick: () => list.find(v => /en-CA/i.test(v.lang)) },
    { id: "pro_au_1", label: "Professional Australia", pick: () => list.find(v => /en-AU/i.test(v.lang)) },

    // Neutral backups
    { id: "neutral_en_1", label: "Neutral English 1", pick: () => list.find(v => /^en/i.test(v.lang)) },
    { id: "neutral_en_2", label: "Neutral English 2", pick: () => list.find(v => /^en/i.test(v.lang) && /Google|Microsoft|Apple/i.test(v.name)) },

    // Accessibility-style (often clearer)
    { id: "clear_voice", label: "Clear / Accessibility Voice", pick: () => list.find(v => /en/i.test(v.lang) && /enhanced|premium|compact/i.test(v.name)) },
  ];

  // Resolve to only presets that actually find a voice
  const resolved = presets
    .map(p => {
      const v = p.pick();
      return v ? { id: p.id, label: p.label, voiceName: v.name, lang: v.lang } : null;
    })
    .filter(Boolean);

  // Always keep at least one option
  if (!resolved.length && list.length) {
    resolved.push({ id: "fallback", label: "Standard Voice", voiceName: list[0].name, lang: list[0].lang });
  }

  return resolved;
}

export default function VoiceAI({
  endpoint = "/api/ai/chat",
  title = "AutoProtect Voice",
  getContext,
}) {
  const API_BASE = useMemo(() => getApiBase(), []);
  const [supported, setSupported] = useState(true);

  // Modes
  const [conversationMode, setConversationMode] = useState(false);
  const [voiceReply, setVoiceReply] = useState(true);

  // NEW: lock voice so it never flips back to default mid-session
  const [lockVoice, setLockVoice] = useState(true);

  // Voice list + selection
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [voiceChoice, setVoiceChoice] = useState(() => {
    return window.localStorage.getItem("autoprotect_voice_choice") || "system_default";
  });

  // Once we resolve a real device voice name, we store it here (prevents switching)
  const resolvedVoiceNameRef = useRef("");

  // SpeechRecognition states
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [youSaid, setYouSaid] = useState("");
  const [aiSays, setAiSays] = useState("");

  const recRef = useRef(null);
  const bufferFinalRef = useRef("");
  const interimRef = useRef("");
  const silenceTimerRef = useRef(null);
  const lastSendRef = useRef("");
  const busyRef = useRef(false);

  // If voices aren't ready yet, queue one reply until they are
  const pendingSpeakRef = useRef("");

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  // Load speech synthesis voices and keep them updated
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const load = () => {
      const voices = window.speechSynthesis.getVoices?.() || [];
      const opts = buildVoicePresets(voices);
      setVoiceOptions(opts);

      // If current choice isn't available, pick first
      if (opts.length && !opts.some(o => o.id === voiceChoice)) {
        setVoiceChoice(opts[0].id);
      }

      // Refresh resolved voice name (lock)
      const chosenOpt = opts.find(o => o.id === voiceChoice) || opts[0];
      if (chosenOpt?.voiceName) {
        resolvedVoiceNameRef.current = chosenOpt.voiceName;
      }

      // If we were waiting to speak, speak now (once voices exist)
      if (pendingSpeakRef.current && voices.length) {
        const msg = pendingSpeakRef.current;
        pendingSpeakRef.current = "";
        speak(msg);
      }
    };

    load();
    window.speechSynthesis.onvoiceschanged = load;

    return () => {
      try { window.speechSynthesis.onvoiceschanged = null; } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceChoice]);

  // Create recognition instance
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
      setStatus(conversationMode ? "Conversation listening…" : "Listening…");
    };

    rec.onerror = (e) => {
      setListening(false);
      setStatus("Mic error: " + (e?.error || "unknown"));
      clearTimeout(silenceTimerRef.current);
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
  }, [conversationMode]);

  // Save voice choice
  useEffect(() => {
    try {
      window.localStorage.setItem("autoprotect_voice_choice", voiceChoice);
    } catch {}
  }, [voiceChoice]);

  function getBestVoice() {
    const voices = window.speechSynthesis.getVoices?.() || [];
    const opts = voiceOptions || [];

    // If lockVoice is on, always use the resolved name
    if (lockVoice && resolvedVoiceNameRef.current) {
      return voices.find(v => v.name === resolvedVoiceNameRef.current) || null;
    }

    // Otherwise choose by selection
    const opt = opts.find(o => o.id === voiceChoice);
    if (!opt) return voices[0] || null;
    return voices.find(v => v.name === opt.voiceName) || voices[0] || null;
  }

  function speak(text) {
    if (!voiceReply) return;
    if (!("speechSynthesis" in window)) return;

    const voices = window.speechSynthesis.getVoices?.() || [];
    if (!voices.length) {
      // Voices not ready yet (common on iOS). Queue once.
      pendingSpeakRef.current = text;
      setStatus("Loading voices…");
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(text);

      const v = getBestVoice();
      if (v) {
        u.voice = v;
        u.lang = v.lang || "en-US";

        // When locked, remember the actual voice used so it never flips
        if (lockVoice && v.name) resolvedVoiceNameRef.current = v.name;
      }

      // Clear, business-like delivery
      u.rate = 1.0;
      u.pitch = 1.0;

      u.onstart = () => setStatus("Speaking…");
      u.onend = () => setStatus(conversationMode ? "Conversation listening…" : "Reply ready");

      window.speechSynthesis.speak(u);
    } catch {
      // If speaking fails, we still show text.
    }
  }

  async function sendToAI(message) {
    const clean = (message || "").trim();
    if (!clean) return;
    if (busyRef.current) return;

    busyRef.current = true;
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
        <div style={{ opacity: 0.85 }}>{status}</div>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={rowTop}>
        <div style={titleStyle}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{status}</div>
      </div>

      <div style={controls}>
        <button
          onClick={() => { if (listening) stop(); else start(); }}
          style={btnPrimary}
        >
          {listening ? "Stop" : (conversationMode ? "Start Conversation" : "Push to Talk")}
        </button>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={conversationMode}
            onChange={() => setConversationMode(v => !v)}
          />
          Conversation mode (hands-free)
        </label>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={voiceReply}
            onChange={() => setVoiceReply(v => !v)}
          />
          Voice reply
        </label>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={lockVoice}
            onChange={() => setLockVoice(v => !v)}
          />
          Lock voice (prevents switching)
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Voice</span>
          <select
            value={voiceChoice}
            onChange={(e) => {
              setVoiceChoice(e.target.value);
              // Reset resolved voice so it re-locks to the new one
              resolvedVoiceNameRef.current = "";
            }}
            style={selectStyle}
          >
            {voiceOptions.length === 0 && <option value="system_default">System Default</option>}
            {voiceOptions.map(v => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>

          <button
            style={btnSmall}
            onClick={() => speak("Voice preview. AutoProtect is ready.")}
            type="button"
          >
            Preview
          </button>
        </div>
      </div>

      <div style={box}>
        <div style={boxLabel}>You said</div>
        <div style={boxText}>{youSaid || "…"}</div>
      </div>

      <div style={box}>
        <div style={boxLabel}>AI says</div>
        <div style={boxText}>{aiSays || "…"}</div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
        Tip: Keep <b>Lock voice</b> ON. If iPhone loads voices late, the first reply may wait a second — but it won’t flip back to default.
      </div>
    </div>
  );
}

const card = {
  borderRadius: 14,
  padding: 14,
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(8px)",
};

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const titleStyle = { fontWeight: 800, letterSpacing: 0.2 };

const controls = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 10,
  alignItems: "center",
};

const btnPrimary = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const btnSmall = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const toggle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  opacity: 0.9,
};

const selectStyle = {
  borderRadius: 10,
  padding: "8px 10px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
};

const box = {
  marginTop: 10,
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.25)",
};

const boxLabel = { fontSize: 12, opacity: 0.75, marginBottom: 6 };
const boxText = { whiteSpace: "pre-wrap", lineHeight: 1.35 };

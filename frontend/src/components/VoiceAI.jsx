import React, { useEffect, useMemo, useRef, useState } from "react";

function getApiBase() {
  return (
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://authoshieldtech2.onrender.com"
  );
}

/**
 * We DO NOT show raw voice names to the user.
 * We map the best available voices on the device into “professional” choices.
 * Reality check: browsers/devices control what voices exist. We can only select from what’s available.
 */
function pickProfessionalVoices(voices) {
  const list = voices || [];
  const by = (pred) => list.find(pred);

  // Helper matchers
  const isEN = (v) => /^en/i.test(v.lang || "");
  const isUS = (v) => /en-US/i.test(v.lang || "");
  const isUK = (v) => /en-GB/i.test(v.lang || "");
  const isAU = (v) => /en-AU/i.test(v.lang || "");
  const isIN = (v) => /en-IN/i.test(v.lang || "");

  const nameHas = (re) => (v) => re.test(v.name || "");

  // “Premium-ish” voices often contain these words (varies per OS)
  const premiumHint = /enhanced|premium|natural|neural|compact/i;

  // 10 business-grade labels (we’ll fill what we can from device voices)
  const candidates = [
    {
      id: "biz_us_female_1",
      label: "Business US (Female) 1",
      match: (v) => isUS(v) && nameHas(/Samantha|Ava|Allison|Jenny|Aria|Emma|Olivia|Google US English/i)(v),
    },
    {
      id: "biz_us_male_1",
      label: "Business US (Male) 1",
      match: (v) => isUS(v) && nameHas(/Alex|Daniel|Guy|Davis|Matthew|Google US English/i)(v),
    },
    {
      id: "biz_us_female_2",
      label: "Business US (Female) 2",
      match: (v) => isUS(v) && premiumHint.test(v.name || ""),
    },
    {
      id: "biz_us_male_2",
      label: "Business US (Male) 2",
      match: (v) => isUS(v) && premiumHint.test(v.name || "") && nameHas(/Male|Alex|Daniel|Guy|Davis|Matthew/i)(v),
    },
    {
      id: "biz_uk_female",
      label: "Business UK (Female)",
      match: (v) => isUK(v) && !nameHas(/Male/i)(v),
    },
    {
      id: "biz_uk_male",
      label: "Business UK (Male)",
      match: (v) => isUK(v) && nameHas(/Male/i)(v),
    },
    {
      id: "biz_au",
      label: "Business Australian",
      match: (v) => isAU(v),
    },
    {
      id: "biz_india",
      label: "Business India",
      match: (v) => isIN(v),
    },
    {
      id: "biz_neutral",
      label: "Business Neutral (English)",
      match: (v) => isEN(v),
    },
    {
      id: "accessibility",
      label: "Accessibility Voice (Clear)",
      match: (v) => isEN(v) && premiumHint.test(v.name || ""),
    },
  ];

  const resolved = [];
  const used = new Set();

  for (const c of candidates) {
    const found = by((v) => !used.has(v.name) && c.match(v));
    if (found) {
      used.add(found.name);
      resolved.push({ ...c, voiceName: found.name, lang: found.lang });
    }
  }

  // Fallback: still provide at least one option if any voices exist
  if (resolved.length === 0 && list.length) {
    resolved.push({
      id: "fallback",
      label: "Business Standard",
      voiceName: list[0].name,
      lang: list[0].lang,
    });
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
  const [conversationMode, setConversationMode] = useState(false); // hands-free
  const [voiceReply, setVoiceReply] = useState(true);

  // Voice selection (professional labels)
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [voiceChoice, setVoiceChoice] = useState(() => {
    return window.localStorage.getItem("autoprotect_voice_choice") || "biz_us_female_1";
  });

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

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  // ---- Load voices reliably ----
  const waitForVoices = () =>
    new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve([]);
      const tryGet = () => window.speechSynthesis.getVoices?.() || [];

      const initial = tryGet();
      if (initial.length) return resolve(initial);

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        try { window.speechSynthesis.onvoiceschanged = null; } catch {}
        resolve(tryGet());
      };

      // Some browsers populate voices later
      try {
        window.speechSynthesis.onvoiceschanged = finish;
      } catch {}

      // Hard timeout so we never hang
      setTimeout(finish, 1200);
    });

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!("speechSynthesis" in window)) return;
      const voices = await waitForVoices();
      if (!alive) return;

      const opts = pickProfessionalVoices(voices);
      setVoiceOptions(opts);

      // If saved choice isn't available, pick first available
      if (opts.length && !opts.some((o) => o.id === voiceChoice)) {
        setVoiceChoice(opts[0].id);
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, [conversationMode, SpeechRecognition]);

  useEffect(() => {
    try {
      window.localStorage.setItem("autoprotect_voice_choice", voiceChoice);
    } catch {}
  }, [voiceChoice]);

  async function speak(text) {
    if (!voiceReply) return;
    if (!("speechSynthesis" in window)) return;

    try {
      const voices = await waitForVoices();
      const opt = voiceOptions.find((o) => o.id === voiceChoice);

      const chosen = opt
        ? voices.find((v) => v.name === opt.voiceName)
        : null;

      // Some mobile browsers ignore voice selection unless you cancel + slight delay
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(text);
      if (chosen) {
        u.voice = chosen;
        u.lang = chosen.lang || "en-US";
      } else {
        u.lang = "en-US";
      }

      u.onstart = () => setStatus("Speaking…");
      u.onend = () => setStatus(conversationMode ? "Conversation listening…" : "Reply ready");

      setTimeout(() => {
        try { window.speechSynthesis.speak(u); } catch {}
      }, 80);
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
          onClick={() => {
            if (listening) stop();
            else start();
          }}
          style={btnPrimary}
          type="button"
        >
          {listening ? "Stop" : (conversationMode ? "Start Conversation" : "Push to Talk")}
        </button>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={conversationMode}
            onChange={() => setConversationMode((v) => !v)}
          />
          Conversation mode (hands-free)
        </label>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={voiceReply}
            onChange={() => setVoiceReply((v) => !v)}
          />
          Voice reply
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Voice</span>
          <select
            value={voiceChoice}
            onChange={(e) => setVoiceChoice(e.target.value)}
            style={selectStyle}
          >
            {voiceOptions.length === 0 && <option value="fallback">Business Standard</option>}
            {voiceOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
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
        Tip: Turn on Conversation mode and just talk. When you stop speaking, AutoProtect replies automatically.
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

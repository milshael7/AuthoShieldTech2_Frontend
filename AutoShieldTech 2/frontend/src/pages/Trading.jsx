import React, { useEffect, useMemo, useRef, useState } from "react";

function apiBase() {
  return (import.meta.env.VITE_API_BASE || "").trim();
}

function canSTT() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function speakText(text) {
  try {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

export default function Trading() {
  const UI_SYMBOLS = ["BTCUSD", "ETHUSD"];
  const UI_TO_BACKEND = { BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT" };

  const [symbol, setSymbol] = useState("BTCUSD");
  const [mode, setMode] = useState("Paper");

  const [feedStatus, setFeedStatus] = useState("Connecting…");
  const [last, setLast] = useState(65300);

  // Panels
  const [showAI, setShowAI] = useState(true);
  const [wideChart, setWideChart] = useState(false);

  // Voice
  const [voiceOn, setVoiceOn] = useState(false);
  const [conversationMode, setConversationMode] = useState(false); // ✅ dialogue loop
  const [listening, setListening] = useState(false);
  const sttSupported = useMemo(() => canSTT(), []);

  // Chat
  const [messages, setMessages] = useState([
    { from: "ai", text: "AutoProtect AI ready. Turn Voice ON and use Tap-to-speak, or enable Conversation Mode for back-and-forth." }
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef(null);

  // Paper status
  const [paper, setPaper] = useState({ running: false, balance: 0, pnl: 0, trades: [] });
  const [paperStatus, setPaperStatus] = useState("Loading…");

  // keep scroll pinned
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  // WebSocket ticks (uses backend ws)
  useEffect(() => {
    let ws;
    let fallbackTimer;

    const base = apiBase();
    const wsBase = base
      ? base.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://")
      : "";

    const wantedBackendSymbol = UI_TO_BACKEND[symbol] || symbol;

    const startFallback = () => {
      setFeedStatus("Disconnected (demo fallback)");
      let price = last || (symbol === "ETHUSD" ? 3500 : 65300);
      fallbackTimer = setInterval(() => {
        const delta = (Math.random() - 0.5) * (symbol === "ETHUSD" ? 6 : 40);
        price = Math.max(1, price + delta);
        setLast(Number(price.toFixed(2)));
      }, 900);
    };

    try {
      if (!wsBase) {
        startFallback();
        return () => clearInterval(fallbackTimer);
      }

      setFeedStatus("Connecting…");
      ws = new WebSocket(`${wsBase}/ws/market`);
      ws.onopen = () => setFeedStatus("Connected");
      ws.onclose = () => startFallback();
      ws.onerror = () => startFallback();

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg?.type === "tick" && msg.symbol === wantedBackendSymbol) {
            setLast(Number(msg.price.toFixed(2)));
          }
        } catch {}
      };
    } catch {
      startFallback();
    }

    return () => {
      try { if (ws) ws.close(); } catch {}
      clearInterval(fallbackTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  // Pull paper status
  useEffect(() => {
    let t;
    const base = apiBase();
    if (!base) {
      setPaperStatus("Missing VITE_API_BASE");
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${base}/api/paper/status`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPaper(data);
        setPaperStatus("OK");
      } catch {
        setPaperStatus("Error loading paper status");
      }
    };

    fetchStatus();
    t = setInterval(fetchStatus, 2000);
    return () => clearInterval(t);
  }, []);

  async function askAI(userText) {
    const base = apiBase();
    const clean = (userText || "").trim();
    if (!clean) return;

    setMessages((prev) => [...prev, { from: "you", text: clean }]);

    // Convert our chat log to OpenAI roles
    const convo = [{ role: "user", content: clean }];

    try {
      const res = await fetch(`${base}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: convo,
          context: { symbol, mode, lastPrice: last }
        })
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "AI error");

      const reply = data.content || "";
      setMessages((prev) => [...prev, { from: "ai", text: reply }]);
      if (voiceOn) speakText(reply);
    } catch (e) {
      const fallback =
        `AI is not connected yet. (${String(e.message || e)})\n` +
        `Tip: confirm OPENAI_API_KEY is set on Render and redeployed.`;
      setMessages((prev) => [...prev, { from: "ai", text: fallback }]);
      if (voiceOn) speakText("AI is not connected yet. Please check the backend key.");
    }
  }

  function startVoiceOnce() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      const text = e?.results?.[0]?.[0]?.transcript || "";
      askAI(text);
    };

    rec.start();
  }

  // Conversation mode loop: restart recognition after each result
  const convoRecRef = useRef(null);
  useEffect(() => {
    if (!conversationMode) {
      try {
        if (convoRecRef.current) convoRecRef.current.stop();
      } catch {}
      convoRecRef.current = null;
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    convoRecRef.current = rec;

    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = true;

    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      // auto-restart if convo mode still on
      if (conversationMode) {
        try { rec.start(); } catch {}
      }
    };

    rec.onresult = (e) => {
      const text = e?.results?.[e.results.length - 1]?.[0]?.transcript || "";
      if (text && text.trim()) askAI(text);
    };

    try { rec.start(); } catch {}

    return () => {
      try { rec.stop(); } catch {}
      convoRecRef.current = null;
      setListening(false);
    };
  }, [conversationMode]); // eslint-disable-line

  const showRightPanel = showAI && !wideChart;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <b>Trading Terminal</b>

        <span style={{ opacity: 0.8 }}>Feed: {feedStatus}</span>
        <span style={{ opacity: 0.8 }}>Last: {Number(last).toLocaleString()}</span>

        <label>
          Mode:&nbsp;
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>Paper</option>
            <option>Live</option>
          </select>
        </label>

        <label>
          Symbol:&nbsp;
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {UI_SYMBOLS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>

        <button onClick={() => setShowAI(v => !v)} style={{ width: "auto" }}>
          {showAI ? "Hide AI" : "Show AI"}
        </button>

        <button onClick={() => setWideChart(v => !v)} style={{ width: "auto" }}>
          {wideChart ? "Normal View" : "Wide Chart"}
        </button>

        <button onClick={() => setVoiceOn(v => !v)} style={{ width: "auto" }}>
          Voice: {voiceOn ? "ON" : "OFF"}
        </button>

        <button
          disabled={!sttSupported}
          onClick={() => setConversationMode(v => !v)}
          style={{ width: "auto" }}
          title={!sttSupported ? "Voice input not supported on this browser" : ""}
        >
          Conversation: {conversationMode ? "ON" : "OFF"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showRightPanel ? "1.8fr 1fr" : "1fr", gap: 16, marginTop: 16 }}>
        <div style={{ padding: 14, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12 }}>
          <b>Paper Status</b>
          <div style={{ opacity: 0.85, marginTop: 8 }}>
            Status: {paperStatus} • Running: {String(!!paper.running)}<br />
            Balance: ${Number(paper.balance || 0).toLocaleString()} • P/L: ${Number(paper.pnl || 0).toLocaleString()}
          </div>

          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "rgba(0,0,0,0.25)" }}>
            <b>Chart (basic)</b>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              We’ll make this “Kraken-level” next (timeframes + indicators + teaching overlays).
            </div>
          </div>
        </div>

        {showRightPanel && (
          <div style={{ padding: 14, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12 }}>
            <b>AI Panel</b>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              Tap-to-speak = one question. Conversation Mode = back-and-forth.
            </div>

            <div ref={logRef} style={{ marginTop: 12, height: 280, overflow: "auto", padding: 10, background: "rgba(0,0,0,0.25)", borderRadius: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <b>{m.from === "you" ? "You" : "AutoProtect AI"}:</b>
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    askAI(input);
                    setInput("");
                  }
                }}
              />
              <button onClick={() => { askAI(input); setInput(""); }} style={{ width: 110 }}>
                Send
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
              <button disabled={!sttSupported || listening} onClick={startVoiceOnce} style={{ width: "auto" }}>
                {listening ? "Listening…" : "🎙 Tap to speak"}
              </button>
              <span style={{ opacity: 0.8 }}>
                {sttSupported ? "Voice input ready" : "Voice input not supported here"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

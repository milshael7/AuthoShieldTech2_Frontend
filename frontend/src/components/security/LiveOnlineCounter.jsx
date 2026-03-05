import React, { useEffect, useRef, useState } from "react";

function wsBase() {
  const api =
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BACKEND_URL ||
    "";

  if (!api) return null;

  return api.replace(/^http/, "ws") + "/ws/market";
}

export default function LiveOnlineCounter() {

  const [online, setOnline] = useState(0);
  const [status, setStatus] = useState("Connecting…");

  const socketRef = useRef(null);
  const retryRef = useRef(null);

  function connect() {

    const url = wsBase();

    if (!url) {
      setStatus("Missing API");
      return;
    }

    const socket = new WebSocket(url);

    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("LIVE");
    };

    socket.onmessage = (event) => {
      try {

        const data = JSON.parse(event.data);

        if (data.type === "online") {
          setOnline(data.online);
        }

        if (data.online !== undefined) {
          setOnline(data.online);
        }

      } catch {}
    };

    socket.onerror = () => {
      setStatus("ERROR");
    };

    socket.onclose = () => {
      setStatus("Reconnecting…");

      retryRef.current = setTimeout(connect, 3000);
    };
  }

  useEffect(() => {

    connect();

    return () => {
      socketRef.current?.close();
      clearTimeout(retryRef.current);
    };

  }, []);

  return (
    <div className="card">

      <div style={{ display: "flex", justifyContent: "space-between" }}>

        <div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Live Online Users
          </div>

          <div style={{ fontSize: 32, fontWeight: 900 }}>
            {online}
          </div>
        </div>

        <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
          {status}
        </span>

      </div>

    </div>
  );
}

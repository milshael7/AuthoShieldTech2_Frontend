// frontend/src/pages/NotFound.jsx
import React from "react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "12px" }}>
        404 – Page Not Found
      </h1>

      <p style={{ opacity: 0.7, maxWidth: 420 }}>
        The page you’re looking for doesn’t exist or was moved.
      </p>

      <div style={{ marginTop: 24 }}>
        <a
          href="/"
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            textDecoration: "none",
            background: "rgba(160,120,255,.35)",
            color: "#111",
            fontWeight: 600,
          }}
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}

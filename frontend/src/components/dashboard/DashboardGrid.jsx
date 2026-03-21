import React from "react";

export default function DashboardGrid({ children }) {
  return (
    <div
      className="dashboard-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr",
        gridAutoRows: "minmax(120px, auto)",
        gap: 20,
        alignItems: "start",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

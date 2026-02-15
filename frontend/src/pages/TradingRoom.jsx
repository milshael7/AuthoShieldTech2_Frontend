  {/* =======================================================
     HEADER
  ======================================================= */}

  <div className="trading-top">
    <div>
      <h2 style={{ margin: 0 }}>Trading Command Center</h2>
      <div style={{ opacity: 0.6, fontSize: 13 }}>
        Institutional Oversight Interface
      </div>
    </div>

    <div
      className={`badge ${
        wsStatus === "connected"
          ? "ok"
          : wsStatus === "error"
          ? "warn"
          : ""
      }`}
    >
      Feed: {wsStatus.toUpperCase()}
    </div>
  </div>

  {/* =======================================================
     KPI STRIP
  ======================================================= */}

  <div className="kpi-strip">
    {kpis.map(k => (
      <div key={k.label} className="kpi-card">
        <small>{k.label}</small>
        <b>{k.value}</b>
      </div>
    ))}
  </div>

  {/* =======================================================
     MAIN GRID
  ======================================================= */}

  <div className="dashboard-grid">

    {/* ================= LEFT COLUMN ================= */}

    <div className="card">
      <div className="card-title">Live Market Stream</div>
      <div className="card-sub">
        Real-time tick feed
      </div>

      {Object.keys(prices).length === 0 ? (
        <div style={{ opacity: 0.6 }}>Waiting for ticks...</div>
      ) : (
        <div className="trading-market-grid">
          {Object.entries(prices).map(([symbol, price]) => (
            <div key={symbol} className="trading-ticker">
              <span>{symbol}</span>
              <span>{price}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* ================= RIGHT COLUMN ================= */}

    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ACTIVE POSITION */}

      <div className="card">
        <div className="card-title">Active Position</div>

        {position ? (
          <table className="trading-table">
            <tbody>
              <tr>
                <th>Quantity</th>
                <td>{position.qty}</td>
              </tr>
              <tr>
                <th>Entry</th>
                <td>{money(position.entry)}</td>
              </tr>
              <tr>
                <th>Trades</th>
                <td>{paper?.trades?.length || 0}</td>
              </tr>
              <tr>
                <th>Paper Equity</th>
                <td>{money(paper?.equity)}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div style={{ opacity: 0.6 }}>
            No open positions
          </div>
        )}
      </div>

      {/* LIVE ENGINE STATUS */}

      <div className="card">
        <div className="card-title">Live Engine Status</div>

        {live ? (
          <table className="trading-table">
            <tbody>
              <tr>
                <th>Mode</th>
                <td>{live.mode}</td>
              </tr>
              <tr>
                <th>Equity</th>
                <td>{money(live.equity)}</td>
              </tr>
              <tr>
                <th>Margin Used</th>
                <td>{money(live.marginUsed)}</td>
              </tr>
              <tr>
                <th>Liquidation</th>
                <td>
                  {live.liquidation ? (
                    <span className="status-negative">
                      YES ⚠
                    </span>
                  ) : (
                    <span className="status-positive">
                      No
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          "Unavailable"
        )}
      </div>

      {/* RISK CONTROL */}

      <div className="card">
        <div className="card-title">Risk Control</div>

        {risk ? (
          <table className="trading-table">
            <tbody>
              <tr>
                <th>Halted</th>
                <td>
                  {risk.halted ? (
                    <span className="status-negative">
                      YES
                    </span>
                  ) : (
                    <span className="status-positive">
                      No
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <th>Reason</th>
                <td>{risk.haltReason || "—"}</td>
              </tr>
              <tr>
                <th>Multiplier</th>
                <td>{risk.riskMultiplier?.toFixed(2)}</td>
              </tr>
              <tr>
                <th>Drawdown</th>
                <td>{pct(risk.drawdown)}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          "Unavailable"
        )}
      </div>

    </div>
  </div>
</div>

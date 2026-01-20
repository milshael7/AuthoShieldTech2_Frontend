{showTradeLog && (
  <div style={{ marginTop: 12 }}>
    <b>Trade Log</b>
    <div className="tableWrap">
      <table className="table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Price</th>
            <th>USD</th>
            <th>Entry Cost</th>
            <th>Net P/L</th>
          </tr>
        </thead>
        <tbody>
          {(paper.trades || [])
            .slice()
            .reverse()
            .slice(0, 12)
            .map((t, i) => (
              <tr key={i}>
                <td>{new Date(t.time).toLocaleTimeString()}</td>
                <td>{t.type}</td>

                {/* Price is a price, but still show $ because it’s USD pairs */}
                <td>{fmtMoney(t.price, 2)}</td>

                {/* USD notional used for the order (you added this in backend: t.usd) */}
                <td>{t.usd !== undefined ? fmtMoneyCompact(t.usd, 2) : "—"}</td>

                {/* Entry cost only exists on BUY rows (you added this: t.cost) */}
                <td>{t.cost !== undefined ? fmtMoneyCompact(t.cost, 2) : "—"}</td>

                {/* Profit only exists on SELL rows (you added this: t.profit) */}
                <td>{t.profit !== undefined ? fmtMoneyCompact(t.profit, 2) : "—"}</td>
              </tr>
            ))}

          {(!paper.trades || paper.trades.length === 0) && (
            <tr>
              <td colSpan="6" className="muted">
                No trades yet (it’s learning)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

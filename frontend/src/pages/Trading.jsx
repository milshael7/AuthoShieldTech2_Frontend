{showTradeLog && (
  <div style={{ marginTop: 12 }}>
    <b>Trade Log</b>
    <div className="tableWrap">
      <table className="table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Symbol</th>
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
            .map((t, i) => {
              const time = t?.time ? new Date(t.time).toLocaleTimeString() : "—";
              const type = t?.type || "—";
              const sym = t?.symbol || "—";

              const price =
                t?.price !== undefined && t?.price !== null
                  ? fmtMoney(Number(t.price), 2)
                  : "—";

              const usd =
                t?.usd !== undefined && t?.usd !== null
                  ? fmtMoneyCompact(Number(t.usd), 2)
                  : "—";

              const cost =
                t?.cost !== undefined && t?.cost !== null
                  ? fmtMoneyCompact(Number(t.cost), 2)
                  : "—";

              const profit =
                t?.profit !== undefined && t?.profit !== null
                  ? fmtMoneyCompact(Number(t.profit), 2)
                  : "—";

              return (
                <tr key={i}>
                  <td>{time}</td>
                  <td>{type}</td>
                  <td>{sym}</td>
                  <td>{price}</td>
                  <td>{usd}</td>
                  <td>{cost}</td>
                  <td>{profit}</td>
                </tr>
              );
            })}

          {(!paper.trades || paper.trades.length === 0) && (
            <tr>
              <td colSpan="7" className="muted">
                No trades yet (it’s learning)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

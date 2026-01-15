import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { createChart } from 'lightweight-charts';

export default function Trading({ user }) {
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const containerRef = useRef(null);
  const wsRef = useRef(null);

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [symbols, setSymbols] = useState(['BTCUSDT', 'ETHUSDT']);
  const [status, setStatus] = useState('connecting');
  const [lastTick, setLastTick] = useState(null);

  const [aiMsg, setAiMsg] = useState('');
  const [aiLog, setAiLog] = useState([]);

  // init chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 520,
      layout: { background: { color: 'transparent' }, textColor: '#cfd8ff' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    const series = chart.addCandlestickSeries();
    chartRef.current = chart;
    seriesRef.current = series;

    const resize = () => {
      const w = containerRef.current?.clientWidth || 900;
      chart.applyOptions({ width: w });
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      chart.remove();
    };
  }, []);

  // load symbols
  useEffect(() => {
    api.tradingSymbols()
      .then(r => setSymbols(r.symbols || ['BTCUSDT', 'ETHUSDT']))
      .catch(() => {});
  }, []);

  // load candles whenever symbol changes
  useEffect(() => {
    (async () => {
      try {
        const r = await api.tradingCandles(symbol);
        seriesRef.current?.setData(r.candles || []);
      } catch (e) {
        alert(e.message);
      }
    })();
  }, [symbol]);

  // websocket tick stream
  useEffect(() => {
    setStatus('connecting');
    const base = import.meta.env.VITE_API_BASE || '';
    const wsUrl = base.replace(/^http/, 'ws') + '/ws/market';

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setStatus('live');
      ws.onclose = () => setStatus('closed');
      ws.onerror = () => setStatus('error');

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'tick' && msg.symbol === symbol) {
            setLastTick({ price: msg.price, ts: msg.ts });
          }
        } catch {}
      };

      return () => ws.close();
    } catch {
      setStatus('error');
    }
  }, [symbol]);

  const sendAi = async () => {
    const m = aiMsg.trim();
    if (!m) return;
    setAiLog(l => [...l, { who: 'you', text: m }]);
    setAiMsg('');
    try {
      const r = await api.aiChat(m, { symbol, lastTick });
      setAiLog(l => [...l, { who: 'ai', text: r.reply }]);
    } catch (e) {
      setAiLog(l => [...l, { who: 'ai', text: `Error: ${e.message}` }]);
    }
  };

  return (
    <div className="tradeWrap">
      <div className="tradeTop">
        <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
          <h2 style={{margin:0}}>Trading Terminal</h2>
          <span className={`badge ${status==='live'?'ok':(status==='connecting'?'warn':'danger')}`}>{status}</span>
          {lastTick && <span className="badge">Last: {Number(lastTick.price).toFixed(2)}</span>}
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <label><small>Symbol</small></label>
          <select value={symbol} onChange={e=>setSymbol(e.target.value)}>
            {symbols.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="tradeGrid">
        <div className="card tradeChart">
          <div ref={containerRef} />
          <div style={{marginTop:10}}>
            <small>
              Candles are stub data right now. Next step is wiring real market data + paper trading + risk rules.
            </small>
          </div>
        </div>

        <div className="card tradeAI">
          <h3 style={{marginTop:0}}>AI Panel (chat + trading explain)</h3>
          <div className="chatLog">
            {aiLog.length === 0 ? (
              <div className="muted"><small>Ask the AI what it sees: “Why BTC now?”, “What’s the risk?”, “What pattern?”</small></div>
            ) : aiLog.map((m, i) => (
              <div key={i} className={`chatMsg ${m.who}`}>
                <b>{m.who === 'you' ? 'You' : 'AI'}</b>
                <div>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="chatBox">
            <input value={aiMsg} onChange={e=>setAiMsg(e.target.value)} placeholder="Talk to the AI..." onKeyDown={(e)=>{ if(e.key==='Enter') sendAi(); }} />
            <button onClick={sendAi}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

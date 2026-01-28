import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function calcScore({ summary, checks }) {
  // Simple MVP score (0–100) based on checks + activity
  const list = checks?.checks || [];
  if (!list.length) return 60;

  let base = 80;
  for (const c of list) {
    if (c.status === 'danger') base -= 22;
    else if (c.status === 'warn') base -= 12;
    else if (c.status === 'ok') base += 2;
  }

  const notes = summary?.totals?.notifications ?? 0;
  const audit = summary?.totals?.auditEvents ?? 0;

  // Too many events/alerts drags score down a bit (MVP)
  base -= Math.min(18, Math.floor(notes / 5));
  base -= Math.min(12, Math.floor(audit / 30));

  return clamp(base, 0, 100);
}

export default function Individual({ user }) {
  const [notes, setNotes] = useState([]);
  const [project, setProject] = useState({
    title: '',
    issueType: 'phishing',
    details: ''
  });
  const [created, setCreated] = useState(null);

  // ✅ new posture data
  const [postureSummary, setPostureSummary] = useState(null);
  const [postureChecks, setPostureChecks] = useState(null);
  const [postureRecent, setPostureRecent] = useState(null);
  const [postureErr, setPostureErr] = useState('');

  const loadNotes = async () => setNotes(await api.meNotifications());

  const loadPosture = async () => {
    setPostureErr('');
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(30),
      ]);
      setPostureSummary(s);
      setPostureChecks(c);
      setPostureRecent(r);
    } catch (e) {
      setPostureErr(e?.message || 'Failed to load posture data');
    }
  };

  const loadAll = async () => {
    await Promise.all([
      loadNotes(),
      loadPosture(),
    ]);
  };

  useEffect(() => { loadAll().catch(e => alert(e.message)); }, []);

  const markRead = async (id) => {
    try {
      await api.markMyNotificationRead(id);
      await loadNotes();
    } catch (e) { alert(e.message); }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const p = await api.createProject({
        title: project.title,
        issue: { type: project.issueType, details: project.details }
      });
      setCreated(p);
      setProject({ title:'', issueType:'phishing', details:'' });
      await loadAll();
    } catch (e) { alert(e.message); }
  };

  const score = calcScore({ summary: postureSummary, checks: postureChecks });
  const meterPct = `${score}%`;

  // MVP “coverage” bars (fake signals for now — we’ll wire real ones later)
  const coverage = [
    { label: 'Threat', val: clamp(score - 10, 0, 100) },
    { label: 'Vuln', val: clamp(score - 18, 0, 100) },
    { label: 'Access', val: clamp(score - 6, 0, 100) },
    { label: 'Data', val: clamp(score - 14, 0, 100) },
  ];

  return (
    <div className="grid">

      {/* ✅ Posture dashboard (matches your picture vibe) */}
      <div className="card" style={{gridColumn:'1 / -1'}}>
        <div className="postureWrap">

          <div className="postureCard">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Security Posture</b>
                <small>
                  Scope: {postureSummary?.scope?.type || '—'} • Updated: {postureSummary?.time ? new Date(postureSummary.time).toLocaleString() : '—'}
                </small>
              </div>

              <div className="postureScore">
                <div className="scoreRing">{score}</div>
                <div className="scoreMeta">
                  <b>Overall Score</b>
                  <span>{score >= 80 ? 'Healthy' : (score >= 60 ? 'Watch' : 'At Risk')}</span>
                </div>
                <button onClick={loadPosture}>Refresh</button>
              </div>
            </div>

            {postureErr && <p className="error" style={{marginTop:10}}>{postureErr}</p>}

            <div className="meter" aria-hidden="true">
              <div style={{width: meterPct}} />
            </div>

            <div className="coverGrid">
              {coverage.map(x => (
                <div key={x.label}>
                  <div className="coverItemTop">
                    <b>{x.label} Coverage</b>
                    <small>{x.val}%</small>
                  </div>
                  <div className="coverBar" aria-hidden="true">
                    <div style={{width: `${x.val}%`}} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{height:14}} />

            <b style={{display:'block', marginBottom:8}}>Recommended checks</b>
            <div className="list">
              {(postureChecks?.checks || []).slice(0, 4).map(c => (
                <div className="card" key={c.id} style={{background:'rgba(0,0,0,.18)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', gap:10, alignItems:'center'}}>
                    <div>
                      <b>{c.title}</b>
                      <div><small>{c.message}</small></div>
                    </div>
                    <span className={`badge ${c.status === 'ok' ? 'ok' : (c.status === 'danger' ? 'danger' : 'warn')}`}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
              {(!postureChecks?.checks || postureChecks.checks.length === 0) && (
                <small className="muted">No checks yet.</small>
              )}
            </div>
          </div>

          <div className="postureCard radarBox">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Signal Radar</b>
                <small>MVP visual (we’ll connect real signals later)</small>
              </div>
            </div>

            <div className="radar" />

            <div style={{height:12}} />
            <b style={{display:'block', marginBottom:8}}>Recent activity</b>

            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Action/Title</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const a = (postureRecent?.audit || []).slice(0, 6).map(x => ({
                      t: x.at || x.time || x.createdAt,
                      type: 'audit',
                      label: x.action || 'event'
                    }));
                    const n = (postureRecent?.notifications || []).slice(0, 6).map(x => ({
                      t: x.createdAt || x.at || x.time,
                      type: 'note',
                      label: x.title || 'notification'
                    }));
                    const merged = [...a, ...n]
                      .filter(x => x.t)
                      .sort((p, q) => new Date(q.t) - new Date(p.t))
                      .slice(0, 8);

                    if (merged.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} className="muted">No recent activity yet.</td>
                        </tr>
                      );
                    }

                    return merged.map((x, idx) => (
                      <tr key={idx}>
                        <td><small>{new Date(x.t).toLocaleString()}</small></td>
                        <td><small>{x.type}</small></td>
                        <td><small>{x.label}</small></td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Existing cards (kept) */}
      <div className="card">
        <h2>Cybersecurity Dashboard</h2>
        <p><small>Report an issue and track AutoProtect actions.</small></p>
      </div>

      <div className="card">
        <h3>Report a security issue</h3>
        <form onSubmit={create} className="form">
          <label>Title</label>
          <input
            value={project.title}
            onChange={e=>setProject({...project,title:e.target.value})}
            placeholder="e.g., suspicious login attempt"
            required
          />

          <label>Type</label>
          <select
            value={project.issueType}
            onChange={e=>setProject({...project,issueType:e.target.value})}
          >
            <option value="phishing">Phishing</option>
            <option value="account_takeover">Account takeover</option>
            <option value="malware">Malware</option>
            <option value="fraud">Fraud</option>
            <option value="other">Other</option>
          </select>

          <label>Details</label>
          <textarea
            value={project.details}
            onChange={e=>setProject({...project,details:e.target.value})}
            placeholder="What happened? What did you notice?"
            rows={4}
          />
          <button type="submit">Create case</button>
        </form>

        {created && (
          <div style={{marginTop:12}}>
            <b>Created case:</b> <code>{created.id}</code>
            <div><small>Status: {created.status || 'Open'}</small></div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>

      <div className="card">
        <h3>How AutoProtect works (MVP)</h3>
        <p><small>
          Right now, AutoProtect creates an audit trail and notifications. Next step is wiring the always-on AI worker
          to monitor logins, requests, and trading activity and automatically trigger blocks/alerts.
        </small></p>
      </div>

    </div>
  );
}

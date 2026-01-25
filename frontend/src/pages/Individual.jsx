// frontend/src/pages/Individual.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

function badgeClass(level){
  const x = String(level || '').toLowerCase();
  if (x === 'low') return 'badge ok';
  if (x === 'medium') return 'badge warn';
  if (x === 'high' || x === 'critical') return 'badge danger';
  return 'badge';
}

export default function Individual({ user }) {
  const [notes, setNotes] = useState([]);
  const [project, setProject] = useState({
    title: '',
    issueType: 'phishing',
    details: ''
  });
  const [created, setCreated] = useState(null);

  const load = async () => setNotes(await api.meNotifications());

  useEffect(() => { load().catch(e => alert(e.message)); }, []);

  const markRead = async (id) => {
    try {
      await api.markMyNotificationRead(id);
      await load();
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
      await load();
    } catch (e) { alert(e.message); }
  };

  // ✅ UI-only “Security Posture” (demo now, wired to backend later)
  const posture = useMemo(() => {
    // Basic logic: if they’re getting a lot of unread notifications, posture worsens.
    const unread = (notes || []).filter(n => !n.readAt).length;

    // You can tweak these thresholds later.
    let risk = 'Low';
    if (unread >= 3) risk = 'Medium';
    if (unread >= 8) risk = 'High';

    const coverage = {
      mfa: true,
      passwordPolicy: true,
      deviceHygiene: unread < 8,     // demo: too many alerts means device hygiene needs help
      phishingProtection: true,
      monitoring: true,
      incidentResponse: true,
    };

    const score =
      (Object.values(coverage).filter(Boolean).length / Object.keys(coverage).length) * 100;

    const rec = [];
    if (unread >= 3) rec.push('Review unread alerts and mark false positives as read.');
    if (!coverage.deviceHygiene) rec.push('Run device scan + remove suspicious extensions/apps.');
    rec.push('Enable MFA everywhere (email + trading + admin).');
    rec.push('Use unique passwords (password manager recommended).');

    return {
      risk,
      unread,
      score: Math.round(score),
      lastScan: new Date().toLocaleString(),
      coverage,
      recommendations: rec
    };
  }, [notes]);

  return (
    <div className="grid">
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap'}}>
          <div>
            <h2 style={{margin:0}}>Cybersecurity Dashboard</h2>
            <p style={{margin:'6px 0 0 0'}}><small>Report an issue and track AutoProtect actions.</small></p>
          </div>

          <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
            <span className={badgeClass(posture.risk)}>
              Risk: {posture.risk}
            </span>
            <span className="badge">
              Unread alerts: {posture.unread}
            </span>
            <span className="badge ok">
              Coverage: {posture.score}%
            </span>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Security Posture “Room” card */}
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap'}}>
          <h3 style={{margin:0}}>Security Posture</h3>
          <small className="muted">Last scan: {posture.lastScan}</small>
        </div>

        <div style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10
        }}>
          <div className="kpiBox">
            <div className="kpiVal">{posture.risk}</div>
            <div className="kpiLbl">Risk Level</div>
          </div>
          <div className="kpiBox">
            <div className="kpiVal">{posture.unread}</div>
            <div className="kpiLbl">Unread Alerts</div>
          </div>
          <div className="kpiBox">
            <div className="kpiVal">{posture.score}%</div>
            <div className="kpiLbl">Coverage Score</div>
          </div>
        </div>

        <div style={{marginTop: 12}}>
          <b>Coverage Checklist</b>
          <div style={{marginTop: 8, display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap: 8}}>
            <div className="badge ok">MFA Enabled</div>
            <div className="badge ok">Password Policy</div>
            <div className={posture.coverage.deviceHygiene ? 'badge ok' : 'badge warn'}>
              Device Hygiene
            </div>
            <div className="badge ok">Phishing Protection</div>
            <div className="badge ok">Monitoring</div>
            <div className="badge ok">Incident Response</div>
          </div>
        </div>

        <div style={{marginTop: 14}}>
          <b>Recommended Actions</b>
          <div style={{marginTop: 8, lineHeight: 1.6}} className="muted">
            {posture.recommendations.map((x, i) => (
              <div key={i}>• {x}</div>
            ))}
          </div>
        </div>
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
          <select value={project.issueType} onChange={e=>setProject({...project,issueType:e.target.value})}>
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

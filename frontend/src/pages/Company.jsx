import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

export default function Company({ user }) {
  const [company,setCompany]=useState(null);
  const [notes,setNotes]=useState([]);
  const [memberId,setMemberId]=useState('');
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState('');

  const load=async()=>{
    setLoading(true);
    setErr('');
    try{
      const [c,n]=await Promise.all([api.companyMe(), api.companyNotifications()]);
      setCompany(c || null);
      setNotes(n || []);
    }catch(e){
      setErr(e?.message || 'Failed to load company room');
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); }, []);

  const add=async()=>{
    try{
      await api.companyAddMember(memberId);
      setMemberId('');
      await load();
      alert('Member added.');
    }catch(e){ alert(e.message); }
  };

  const remove=async(id)=>{
    try{
      await api.companyRemoveMember(id);
      await load();
    }catch(e){ alert(e.message); }
  };

  const markRead=async(id)=>{
    try{
      await api.companyMarkRead(id);
      await load();
    }catch(e){ alert(e.message); }
  };

  // MVP “company score” based on unread alerts + size tier
  const score = useMemo(() => {
    let s = 86;
    const unread = (notes || []).filter(n => !n.readAt).length;
    s -= Math.min(20, unread * 2);

    const tier = String(company?.sizeTier || '').toLowerCase();
    if (tier.includes('enterprise')) s += 2;
    if (tier.includes('starter')) s -= 2;

    return clamp(s, 0, 100);
  }, [notes, company]);

  const coverage = useMemo(() => ([
    { label: 'Threat',  val: clamp(score - 6, 0, 100) },
    { label: 'Vuln',   val: clamp(score - 10, 0, 100) },
    { label: 'Access', val: clamp(score - 4, 0, 100) },
    { label: 'Data',   val: clamp(score - 12, 0, 100) },
  ]), [score]);

  return (
    <div className="grid">

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Company Workspace</h2>
        <p style={{marginTop:6}}><small>Manage members + view company posture (MVP).</small></p>
        <div style={{height:10}} />
        <button onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        {err && <p className="error" style={{marginTop:10}}>{err}</p>}
      </div>

      {/* Posture dashboard */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="postureWrap">

          <div className="postureCard">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Company Posture</b>
                <small>{company?.name || '—'} • {company?.sizeTier || 'Tier —'}</small>
              </div>

              <div className="postureScore">
                <div className="scoreRing">{score}</div>
                <div className="scoreMeta">
                  <b>Security Score</b>
                  <span>{score >= 80 ? 'Healthy' : (score >= 60 ? 'Watch' : 'At Risk')}</span>
                </div>
              </div>
            </div>

            <div className="meter" aria-hidden="true">
              <div style={{ width: `${score}%` }} />
            </div>

            <div className="coverGrid">
              {coverage.map(x => (
                <div key={x.label}>
                  <div className="coverItemTop">
                    <b>{x.label} Coverage</b>
                    <small>{x.val}%</small>
                  </div>
                  <div className="coverBar" aria-hidden="true">
                    <div style={{ width: `${x.val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{height:14}} />

            <div className="kpi">
              <div><b>{(company?.members || []).length}</b><span>Members</span></div>
              <div><b>{(notes || []).filter(n => !n.readAt).length}</b><span>Unread alerts</span></div>
              <div><b>{(notes || []).length}</b><span>Total alerts</span></div>
              <div><b>{user?.subscriptionStatus || '—'}</b><span>Company Subscription</span></div>
            </div>

            <div style={{height:10}} />
            <p><small>Note: Company cannot force AutoProtect on members (by design for now).</small></p>
          </div>

          <div className="postureCard radarBox">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Signal Radar</b>
                <small>MVP visual (real scans later)</small>
              </div>
            </div>

            <div className="radar" />

            <div style={{height:12}} />
            <b style={{ display:'block', marginBottom:8 }}>Recent alerts</b>

            <NotificationList items={(notes || []).slice(0, 8)} onRead={markRead} />
          </div>

        </div>
      </div>

      {/* Members */}
      <div className="card">
        <h3>Members</h3>
        <small>Add/remove by userId (starter). Later becomes invite-by-email.</small>

        <div style={{height:10}} />
        <div className="row">
          <div className="col">
            <input
              placeholder="Member userId"
              value={memberId}
              onChange={e=>setMemberId(e.target.value)}
            />
          </div>
          <div className="col">
            <button onClick={add} disabled={!memberId.trim()}>Add member</button>
          </div>
        </div>

        <div style={{height:12}} />

        <div className="tableWrap">
          <table className="table">
            <thead><tr><th>UserId</th><th>Action</th></tr></thead>
            <tbody>
              {(company?.members || []).map(id=>(
                <tr key={id}>
                  <td><small>{id}</small></td>
                  <td><button onClick={()=>remove(id)}>Remove</button></td>
                </tr>
              ))}
              {(company?.members || []).length === 0 && (
                <tr><td colSpan={2} className="muted">No members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All notifications */}
      <div className="card">
        <h3>Company Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>

    </div>
  );
}

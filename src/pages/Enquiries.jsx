import { useState, useEffect, useCallback } from 'react';
import { getIdToken } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';

async function apiFetch(path) {
  const token = await getIdToken(auth.currentUser);
  const res   = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
  const data  = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data;
}

function fmtDate(val) {
  if (!val) return '—';
  try { return new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return val; }
}

function maskPhone(phone) {
  if (!phone) return '—';
  const s = String(phone);
  return s.length <= 4 ? s : `${'•'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

const OUTCOME_STYLES = {
  booked:          { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80', border: 'rgba(34,197,94,0.3)'  },
  no_availability: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  guest_declined:  { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)'},
  rejected:        { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  abandoned:       { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)'},
  timeout:         { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)'},
};

const OUTCOME_LABELS = {
  booked:          'Booked',
  no_availability: 'No Availability',
  guest_declined:  'Guest Declined',
  rejected:        'Rejected',
  abandoned:       'Abandoned',
  timeout:         'Timeout',
};

function OutcomePill({ outcome }) {
  const s = OUTCOME_STYLES[outcome] ?? OUTCOME_STYLES.abandoned;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {OUTCOME_LABELS[outcome] ?? outcome}
    </span>
  );
}

const page = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px 28px', gap: '20px', color: '#fff', fontFamily: 'inherit' };
const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' };

export default function Enquiries() {
  const { selectedProperty } = useAuthContext();
  const propertyId = selectedProperty?.supabase_property_id ?? null;

  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/enquiry-leads?propertyId=${propertyId}`);
      setLeads(data.leads ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? leads.filter(l => String(l.phone ?? '').includes(search) || (l.outcome ?? '').includes(search.toLowerCase()))
    : leads;

  const stats = {
    total:  leads.length,
    booked: leads.filter(l => l.outcome === 'booked').length,
    active: leads.filter(l => ['abandoned', 'no_availability'].includes(l.outcome)).length,
  };

  if (!propertyId) {
    return (
      <div style={{ ...page, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#8c8a9e', fontSize: '14px' }}>No property selected.</span>
      </div>
    );
  }

  return (
    <div style={page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>Enquiries</h1>
          {!loading && (
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: 'rgba(108,99,255,0.15)', color: '#a89dff', border: '1px solid rgba(108,99,255,0.3)' }}>
              {leads.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by phone or outcome…"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 14px', color: '#fff', fontSize: '13px', outline: 'none', width: '220px', fontFamily: 'inherit' }}
          />
          <button
            onClick={load}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 14px', color: '#8c8a9e', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
          >Refresh</button>
        </div>
      </div>

      {/* Stat chips */}
      {!loading && !error && (
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          {[
            { label: 'Total leads',   value: stats.total,  color: '#a89dff' },
            { label: 'Converted',     value: stats.booked, color: '#4ade80' },
            { label: 'Follow-up',     value: stats.active, color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 18px' }}>
              <div style={{ fontSize: '11px', color: '#8c8a9e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: s.color, marginTop: '2px' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ ...card, flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8c8a9e', fontSize: '14px' }}>Loading enquiries…</div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
            <span style={{ color: '#f87171', fontSize: '14px' }}>{error}</span>
            <button onClick={load} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8c8a9e', fontSize: '14px' }}>
            {search ? 'No enquiries match your search.' : 'No enquiry leads yet.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Date', 'Phone', 'Check-in', 'Check-out', 'Guests', 'Outcome', 'Source', 'Nudge'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#8c8a9e', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.02)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: '#8c8a9e', whiteSpace: 'nowrap' }}>{fmtDate(l.created_at)}</td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: '#8c8a9e', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{maskPhone(l.phone)}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#fff', whiteSpace: 'nowrap' }}>{fmtDate(l.check_in)}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#fff', whiteSpace: 'nowrap' }}>{fmtDate(l.check_out)}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#fff', textAlign: 'center' }}>{l.party_size ?? '—'}</td>
                  <td style={{ padding: '13px 16px' }}><OutcomePill outcome={l.outcome} /></td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: '#8c8a9e' }}>{l.attribution?.source ?? '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: '#8c8a9e', whiteSpace: 'nowrap' }}>{l.nudge_sent ? fmtDate(l.nudge_sent) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

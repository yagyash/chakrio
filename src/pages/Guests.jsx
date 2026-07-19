import { useState, useEffect, useCallback, useRef } from 'react';
import { getIdToken } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const token = await getIdToken(auth.currentUser);
  const res = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data;
}

function fmtCurrency(val) {
  const n = Number(val || 0);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function fmtDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return val;
  }
}

function maskPhone(phone) {
  if (!phone) return '—';
  const s = String(phone);
  if (s.length <= 4) return s;
  return `${'•'.repeat(s.length - 4)}${s.slice(-4)}`;
}

const FLAG_OPTIONS = ['VIP', 'DND', 'Problematic'];

const FLAG_COLORS = {
  VIP:         { bg: 'rgba(108,99,255,0.18)', color: '#a89dff', border: 'rgba(108,99,255,0.35)' },
  DND:         { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  Problematic: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)'  },
};

// ── Styles ────────────────────────────────────────────────────────────────────

const page = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  padding: '24px 28px',
  gap: '20px',
  color: '#fff',
  fontFamily: 'inherit',
};

const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  overflow: 'hidden',
};

// ── Flag pills ────────────────────────────────────────────────────────────────

function FlagPill({ label }) {
  const c = FLAG_COLORS[label] ?? { bg: 'rgba(255,255,255,0.1)', color: '#ccc', border: 'rgba(255,255,255,0.2)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      marginRight: '4px',
    }}>
      {label}
    </span>
  );
}

// ── Stat cell for drawer ──────────────────────────────────────────────────────

function StatBox({ label, value, accent }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <span style={{ fontSize: '11px', color: '#8c8a9e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: '20px', fontWeight: 700, color: accent ?? '#fff' }}>{value}</span>
    </div>
  );
}

// ── Guest drawer ──────────────────────────────────────────────────────────────

function GuestDrawer({ guest, propertyId, onClose, onSaved }) {
  const [notes,   setNotes]   = useState(guest.notes   ?? '');
  const [flags,   setFlags]   = useState(guest.flags   ?? []);
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const overlayRef = useRef(null);

  const name = guest.display_name || guest.guest_name || 'Guest';

  function toggleFlag(f) {
    setFlags(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  async function handleSave() {
    setSaving(true);
    setSaveErr('');
    try {
      await apiFetch(`/api/guests?propertyId=${propertyId}&phone=${encodeURIComponent(guest.guest_phone)}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes, flags }),
      });
      onSaved(guest.guest_phone, { notes, flags });
      onClose();
    } catch (e) {
      setSaveErr(e.message);
      setSaving(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  const stays      = guest.completed_stays ?? guest.total_stays ?? 0;
  const revenue    = guest.total_revenue   ?? 0;
  const latePmts   = guest.late_payment_count ?? 0;
  const properties = (guest.properties_stayed ?? []).join(', ') || '—';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div style={{
        width: '400px', maxWidth: '100vw',
        background: '#15131f', borderLeft: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.2s ease',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#8c8a9e' }}>{maskPhone(guest.guest_phone)}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px',
              color: '#8c8a9e', width: '32px', height: '32px', cursor: 'pointer',
              fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >×</button>
        </div>

        {/* Stats grid */}
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <StatBox label="Completed Stays" value={stays} accent="#6C63FF" />
          <StatBox label="Total Revenue"   value={fmtCurrency(revenue)} accent="#00D4FF" />
          <StatBox label="Late Payments"   value={latePmts} accent={latePmts > 0 ? '#f87171' : '#fff'} />
          <StatBox label="Last Visit"      value={fmtDate(guest.last_stay_date)} />
          {properties !== '—' && (
            <div style={{
              gridColumn: '1 / -1',
              background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: '11px', color: '#8c8a9e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Properties Visited</div>
              <div style={{ fontSize: '13px', color: '#fff' }}>{properties}</div>
            </div>
          )}
        </div>

        {/* Flags */}
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{ fontSize: '12px', color: '#8c8a9e', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flags</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {FLAG_OPTIONS.map(f => {
              const active = flags.includes(f);
              const c = FLAG_COLORS[f];
              return (
                <button
                  key={f}
                  onClick={() => toggleFlag(f)}
                  style={{
                    padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: active ? c.bg : 'rgba(255,255,255,0.05)',
                    color:      active ? c.color : '#8c8a9e',
                    border:     active ? `1px solid ${c.border}` : '1px solid rgba(255,255,255,0.1)',
                  }}
                >{f}</button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div style={{ padding: '0 24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '12px', color: '#8c8a9e', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Manager Notes</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this guest (preferences, requests, incidents)…"
            style={{
              flex: 1, minHeight: '120px', resize: 'vertical',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '12px 14px',
              color: '#fff', fontSize: '13px', lineHeight: '1.6',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        {/* Save */}
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {saveErr && (
            <div style={{ fontSize: '12px', color: '#f87171', textAlign: 'center' }}>{saveErr}</div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
              background: saving ? 'rgba(108,99,255,0.5)' : '#6C63FF',
              color: '#fff', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Guests() {
  const { selectedProperty } = useAuthContext();
  const propertyId = selectedProperty?.supabase_property_id ?? null;

  const [guests,   setGuests]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState('');
  const [pageNum,  setPageNum]  = useState(1);

  const PAGE_SIZE = 25;

  const loadGuests = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/guests?propertyId=${propertyId}`);
      setGuests(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { loadGuests(); }, [loadGuests]);

  function handleSaved(phone, patch) {
    setGuests(prev => prev.map(g =>
      g.guest_phone === phone ? { ...g, ...patch } : g
    ));
  }

  const filtered = search.trim()
    ? guests.filter(g => {
        const q = search.toLowerCase();
        const name = (g.display_name || g.guest_name || '').toLowerCase();
        return name.includes(q) || String(g.guest_phone).includes(q);
      })
    : guests;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);

  if (!propertyId) {
    return (
      <div style={{ ...page, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#8c8a9e', fontSize: '14px' }}>No property selected.</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .guest-row:hover { background: rgba(255,255,255,0.04) !important; cursor: pointer; }
        .guest-row:hover td:first-child { color: #a89dff !important; }
      `}</style>

      <div style={page}>
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>Guests</h1>
            {!loading && (
              <span style={{
                fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px',
                background: 'rgba(108,99,255,0.15)', color: '#a89dff', border: '1px solid rgba(108,99,255,0.3)',
              }}>{guests.length}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPageNum(1); }}
              placeholder="Search by name or phone…"
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '8px 14px', color: '#fff', fontSize: '13px',
                outline: 'none', width: '220px', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={loadGuests}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '8px 14px', color: '#8c8a9e', fontSize: '13px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Refresh</button>
          </div>
        </div>

        {/* Table card */}
        <div style={{ ...card, flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8c8a9e', fontSize: '14px' }}>
              Loading guests…
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
              <span style={{ color: '#f87171', fontSize: '14px' }}>{error}</span>
              <button onClick={loadGuests} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8c8a9e', fontSize: '14px' }}>
              {search ? 'No guests match your search.' : 'No completed bookings yet.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Guest', 'Phone', 'Stays', 'Revenue', 'Last Visit', 'Late Pmts', 'Flags', 'Notes'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 600, color: '#8c8a9e',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.02)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(g => {
                  const name     = g.display_name || g.guest_name || '—';
                  const stays    = g.completed_stays ?? g.total_stays ?? 0;
                  const latePmts = g.late_payment_count ?? 0;
                  const flags    = g.flags ?? [];
                  const notes    = g.notes ?? '';

                  return (
                    <tr
                      key={g.guest_phone}
                      className="guest-row"
                      onClick={() => setSelected(g)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.1s' }}
                    >
                      <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{name}</td>
                      <td style={{ padding: '13px 16px', fontSize: '12px', color: '#8c8a9e', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{maskPhone(g.guest_phone)}</td>
                      <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 700, color: '#a89dff', textAlign: 'center' }}>{stays}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: '#00D4FF', whiteSpace: 'nowrap' }}>{fmtCurrency(g.total_revenue)}</td>
                      <td style={{ padding: '13px 16px', fontSize: '12px', color: '#8c8a9e', whiteSpace: 'nowrap' }}>{fmtDate(g.last_stay_date)}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        {latePmts > 0 ? (
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f87171' }}>{latePmts}</span>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#8c8a9e' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        {flags.length > 0
                          ? flags.map(f => <FlagPill key={f} label={f} />)
                          : <span style={{ color: '#8c8a9e', fontSize: '12px' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '12px', color: '#8c8a9e', maxWidth: '180px' }}>
                        {notes
                          ? <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{notes}</span>
                          : <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Add note…</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: '12px', color: '#8c8a9e' }}>
                Showing {(pageNum - 1) * PAGE_SIZE + 1}–{Math.min(pageNum * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setPageNum(p => Math.max(1, p - 1))}
                  disabled={pageNum === 1}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: pageNum === 1 ? '#4a4860' : '#fff', cursor: pageNum === 1 ? 'not-allowed' : 'pointer',
                  }}
                >← Prev</button>
                <span style={{
                  padding: '6px 12px', fontSize: '12px', color: '#a89dff', fontWeight: 600,
                  background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)',
                  borderRadius: '6px',
                }}>
                  {pageNum} / {totalPages}
                </span>
                <button
                  onClick={() => setPageNum(p => Math.min(totalPages, p + 1))}
                  disabled={pageNum === totalPages}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: pageNum === totalPages ? '#4a4860' : '#fff', cursor: pageNum === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <GuestDrawer
          guest={selected}
          propertyId={propertyId}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

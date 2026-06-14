import { useState, useEffect, useCallback, useRef } from 'react';
import { getIdToken } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';

// ── Template definitions ──────────────────────────────────────────
const TEMPLATES = {
  festival_availability: {
    label: 'Festival Availability',
    description: 'Invite past guests to stay during an upcoming festival',
    fields: [
      { key: 'festival_name', label: 'Festival Name',  placeholder: 'e.g. Diwali, Holi, Navratri' },
      { key: 'festival_date', label: 'Festival Dates', placeholder: 'e.g. Oct 20–25' },
    ],
  },
  welcome_back_guest: {
    label: 'Welcome Back',
    description: 'Re-engage past guests with a warm personal invite',
    fields: [
      { key: 'location', label: 'Location', placeholder: 'e.g. Udaipur, Pushkar' },
    ],
  },
  seasonal_offer: {
    label: 'Seasonal Offer',
    description: 'Share a seasonal discount or special package',
    fields: [
      { key: 'season_label',  label: 'Season Name',    placeholder: 'e.g. Monsoon Special' },
      { key: 'offer_details', label: 'Offer Details',  placeholder: 'e.g. 20% off on weekdays' },
      { key: 'expiry_date',   label: 'Valid Until',    placeholder: 'e.g. July 31' },
    ],
  },
  we_miss_you: {
    label: 'We Miss You',
    description: 'Reach out to guests who haven\'t visited in a while',
    fields: [
      { key: 'location', label: 'Location', placeholder: 'e.g. Udaipur' },
    ],
  },
};

const STATUS_COLOR = {
  pending:   { bg: 'rgba(200,169,110,0.12)', color: '#c8a96e',  label: 'Pending'   },
  running:   { bg: 'rgba(108,99,255,0.15)',  color: '#a896f8',  label: 'Running'   },
  completed: { bg: 'rgba(72,199,142,0.12)',  color: '#48c78e',  label: 'Completed' },
  failed:    { bg: 'rgba(239,68,68,0.12)',   color: '#f87171',  label: 'Failed'    },
};

// ── Styles ────────────────────────────────────────────────────────
const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  padding: '20px 24px',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '13px',
  color: '#f0eee8',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'DM Sans, sans-serif',
};

const btnPrimary = {
  background: 'linear-gradient(135deg,#c8a96e,#e8c98a)',
  color: '#0f0e17',
  border: 'none',
  borderRadius: '8px',
  padding: '9px 20px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnGhost = {
  background: 'rgba(255,255,255,0.05)',
  color: '#8c8a9e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '9px 16px',
  fontSize: '13px',
  cursor: 'pointer',
};

// ── API helpers ───────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────
export default function Campaigns() {
  const { selectedProperty } = useAuthContext();
  const propertyId = selectedProperty?.supabase_property_id ?? null;

  const [campaigns,    setCampaigns]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(null); // campaign being polled
  const pollRef = useRef(null);

  // ── Load campaign list ─────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    if (!propertyId) return;
    try {
      const data = await apiFetch(`/api/campaigns?propertyId=${propertyId}`);
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // ── Poll running campaign ──────────────────────────────────────
  useEffect(() => {
    if (!activeCampaign) { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      try {
        const c = await apiFetch(`/api/campaigns?campaignId=${activeCampaign}`);
        setCampaigns(prev => prev.map(x => x.id === c.id ? c : x));
        if (c.status === 'completed' || c.status === 'failed') {
          setActiveCampaign(null);
        }
      } catch { /* silent — keep polling */ }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeCampaign]);

  // ── Handle new campaign launched from modal ────────────────────
  const handleLaunched = (campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
    setActiveCampaign(campaign.campaign_id ?? campaign.id);
    setShowModal(false);
  };

  if (!propertyId) {
    return (
      <div style={{ padding: '32px', color: '#8c8a9e', fontSize: '14px' }}>
        No property selected.
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '22px', color: '#f0eee8', margin: 0, letterSpacing: '-0.02em' }}>
            Campaigns
          </h1>
          <p style={{ color: '#56546a', fontSize: '13px', margin: '4px 0 0' }}>
            WhatsApp broadcast to past guests
          </p>
        </div>
        <button style={btnPrimary} onClick={() => setShowModal(true)}>
          + New Campaign
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ ...card, borderColor: 'rgba(239,68,68,0.3)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div style={{ color: '#56546a', fontSize: '13px' }}>Loading campaigns…</div>
      ) : campaigns.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📣</div>
          <p style={{ color: '#8c8a9e', fontSize: '14px', margin: 0 }}>
            No campaigns yet. Launch your first broadcast to re-engage past guests.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {campaigns.map(c => <CampaignRow key={c.id} campaign={c} />)}
        </div>
      )}

      {/* New Campaign Modal */}
      {showModal && (
        <NewCampaignModal
          propertyId={propertyId}
          onClose={() => setShowModal(false)}
          onLaunched={handleLaunched}
        />
      )}
    </div>
  );
}

// ── Campaign row ──────────────────────────────────────────────────
function CampaignRow({ campaign: c }) {
  const s     = STATUS_COLOR[c.status] ?? STATUS_COLOR.pending;
  const tpl   = TEMPLATES[c.template_name];
  const label = tpl?.label ?? c.template_name;
  const date  = c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const pct   = c.total_recipients > 0
    ? Math.round((c.sent_count / c.total_recipients) * 100)
    : 0;

  return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* Template badge */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
        background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
      }}>
        📣
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#f0eee8' }}>{label}</span>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: s.bg, color: s.color, fontWeight: 500 }}>
            {s.label}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#56546a' }}>
          {date} · {c.total_recipients} recipients
          {c.total_recipients > 0 && (
            <span> · <span style={{ color: '#48c78e' }}>{c.sent_count} sent</span>
              {c.failed_count > 0 && <span style={{ color: '#f87171' }}> · {c.failed_count} failed</span>}
              {c.opted_out_count > 0 && <span> · {c.opted_out_count} opted out</span>}
            </span>
          )}
        </div>
        {/* Progress bar — shown while running */}
        {c.status === 'running' && c.total_recipients > 0 && (
          <div style={{ marginTop: '8px', height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#c8a96e,#e8c98a)', borderRadius: '2px', transition: 'width 1s ease' }} />
          </div>
        )}
      </div>

      {/* Percentage complete */}
      {c.status !== 'pending' && c.total_recipients > 0 && (
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#c8a96e', flexShrink: 0 }}>
          {pct}%
        </div>
      )}
    </div>
  );
}

// ── New Campaign Modal ────────────────────────────────────────────
function NewCampaignModal({ propertyId, onClose, onLaunched }) {
  const [step,         setStep]         = useState('pick');   // 'pick' | 'fill'
  const [selected,     setSelected]     = useState(null);
  const [vars,         setVars]         = useState({});
  const [recipientCount, setRecipientCount] = useState(null);
  const [launching,    setLaunching]    = useState(false);
  const [error,        setError]        = useState('');

  // Load recipient count when template is selected
  useEffect(() => {
    if (!selected) return;
    setRecipientCount(null);
    apiFetch(`/api/campaigns?action=count&propertyId=${propertyId}`)
      .then(d => setRecipientCount(d.count ?? 0))
      .catch(() => setRecipientCount('—'));
  }, [selected, propertyId]);

  const tpl = TEMPLATES[selected];

  const allFilled = tpl?.fields.every(f => (vars[f.key] ?? '').trim());
  const hasRecipients = typeof recipientCount === 'number' && recipientCount > 0;

  const launch = async () => {
    setLaunching(true);
    setError('');
    try {
      const data = await apiFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ property_uuid: propertyId, template_name: selected, template_vars: vars }),
      });
      onLaunched(data);
    } catch (e) {
      setError(e.message);
      setLaunching(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#16151f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
        width: '100%', maxWidth: '520px', padding: '28px',
      }}>
        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '18px', color: '#f0eee8', margin: 0 }}>
            {step === 'pick' ? 'Choose a Template' : tpl?.label}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#56546a', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        {/* Step 1: Template picker */}
        {step === 'pick' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => { setSelected(key); setVars({}); setStep('fill'); }}
                style={{
                  background: selected === key ? 'rgba(200,169,110,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected === key ? 'rgba(200,169,110,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '10px', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', width: '100%',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#f0eee8', marginBottom: '3px' }}>{t.label}</div>
                <div style={{ fontSize: '12px', color: '#56546a' }}>{t.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Fill variables */}
        {step === 'fill' && tpl && (
          <>
            <p style={{ fontSize: '12px', color: '#56546a', marginBottom: '16px', marginTop: 0 }}>
              {tpl.description}. <em>Guest name and property name are filled automatically.</em>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {tpl.fields.map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8c8a9e', marginBottom: '6px', fontWeight: 500 }}>
                    {f.label}
                  </label>
                  <input
                    style={inputStyle}
                    placeholder={f.placeholder}
                    value={vars[f.key] ?? ''}
                    onChange={e => setVars(v => ({ ...v, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            {/* Recipient estimate */}
            <div style={{ ...card, padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#8c8a9e' }}>Estimated recipients</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#c8a96e' }}>
                {recipientCount === null ? '…' : recipientCount}
              </span>
            </div>

            {error && (
              <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '12px' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={btnGhost} onClick={() => setStep('pick')}>← Back</button>
              <button
                style={{ ...btnPrimary, flex: 1, opacity: (!allFilled || !hasRecipients || launching) ? 0.5 : 1 }}
                disabled={!allFilled || !hasRecipients || launching}
                onClick={launch}
              >
                {launching ? 'Launching…' : `Send to ${recipientCount ?? '…'} guests`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

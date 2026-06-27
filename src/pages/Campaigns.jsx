import { useState, useEffect, useCallback, useRef } from 'react';
import { getIdToken } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';
import { CAMPAIGN_COSTS } from '../config/campaignCosts';

// ── Template definitions ──────────────────────────────────────────
const TEMPLATES = {
  festival_availability: {
    label: 'Festival Availability',
    description: 'Invite past guests to stay during an upcoming festival',
    fields: [
      { key: 'festival_name', label: 'Festival Name',  placeholder: 'e.g. Christmas, New Year, Eid' },
      { key: 'festival_date', label: 'Festival Dates', placeholder: 'e.g. Dec 24–27' },
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
      { key: 'season_label',  label: 'Season Name',    placeholder: 'e.g. Summer Special' },
      { key: 'offer_details', label: 'Offer Details',  placeholder: 'e.g. 20% off on weekdays' },
      { key: 'expiry_date',   label: 'Valid Until',    placeholder: 'e.g. July 31' },
    ],
  },
  we_miss_you: {
    label: 'We Miss You',
    description: 'Reach out to guests who haven\'t visited in a while',
    fields: [
      { key: 'location', label: 'Location', placeholder: 'e.g. Udaipur, Manali' },
    ],
  },
};

const STATUS_COLOR = {
  pending:                    { bg: 'rgba(200,169,110,0.12)', color: '#c8a96e',  label: 'Pending'             },
  queued:                     { bg: 'rgba(200,169,110,0.12)', color: '#c8a96e',  label: 'Queued'              },
  running:                    { bg: 'rgba(108,99,255,0.15)',  color: '#a896f8',  label: 'Running'             },
  sending:                    { bg: 'rgba(108,99,255,0.15)',  color: '#a896f8',  label: 'Sending'             },
  completed:                  { bg: 'rgba(72,199,142,0.12)',  color: '#48c78e',  label: 'Completed'           },
  failed:                     { bg: 'rgba(239,68,68,0.12)',   color: '#f87171',  label: 'Failed'              },
  paused_by_user:             { bg: 'rgba(200,169,110,0.10)', color: '#8c8a9e',  label: 'Paused'              },
  paused_insufficient_funds:  { bg: 'rgba(239,68,68,0.10)',   color: '#f87171',  label: 'Paused (low funds)'  },
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
  const [wallet,       setWallet]       = useState(null);   // { balance, transactions }
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [showTopup,    setShowTopup]    = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const pollRef = useRef(null);

  // ── Load campaigns + wallet ────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!propertyId) return;
    try {
      const [campaignData, walletData] = await Promise.all([
        apiFetch(`/api/campaigns?propertyId=${propertyId}`),
        apiFetch(`/api/wallet?propertyId=${propertyId}`).catch(() => null),
      ]);
      setCampaigns(Array.isArray(campaignData) ? campaignData : []);
      if (walletData) setWallet(walletData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Poll active campaign ───────────────────────────────────────
  useEffect(() => {
    if (!activeCampaign) { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      try {
        const c = await apiFetch(`/api/campaigns?campaignId=${activeCampaign}`);
        setCampaigns(prev => prev.map(x => x.id === c.id ? c : x));
        if (['completed', 'failed', 'paused_by_user', 'paused_insufficient_funds'].includes(c.status)) {
          setActiveCampaign(null);
          loadData(); // refresh wallet balance after campaign activity
        }
      } catch { /* silent */ }
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [activeCampaign, loadData]);

  const handleLaunched = (campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
    setActiveCampaign(campaign.campaign_id ?? campaign.id);
    setShowModal(false);
    loadData();
  };

  const handlePause = async (campaignId) => {
    try {
      await apiFetch(`/api/campaigns?campaignId=${campaignId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'pause' }),
      });
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'paused_by_user' } : c));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleResume = async (campaignId) => {
    try {
      await apiFetch(`/api/campaigns?campaignId=${campaignId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'resume' }),
      });
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'sending' } : c));
      setActiveCampaign(campaignId);
    } catch (e) {
      setError(e.message);
    }
  };

  if (!propertyId) {
    return (
      <div style={{ padding: '32px', color: '#8c8a9e', fontSize: '14px' }}>
        No property selected.
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;

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

        {/* Wallet + New Campaign */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#56546a', marginBottom: '2px' }}>Marketing wallet</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: balance > 0 ? '#48c78e' : '#f87171' }}>
                ₹{balance.toFixed(2)}
              </span>
              <button
                style={{ ...btnGhost, padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setShowTopup(true)}
              >
                + Add funds
              </button>
            </div>
          </div>
          <button
            style={{ ...btnPrimary, opacity: balance <= 0 ? 0.5 : 1 }}
            disabled={balance <= 0}
            title={balance <= 0 ? 'Top up your wallet to launch campaigns' : undefined}
            onClick={() => setShowModal(true)}
          >
            + New Campaign
          </button>
        </div>
      </div>

      {/* Empty wallet notice */}
      {!loading && balance <= 0 && (
        <div style={{ ...card, borderColor: 'rgba(239,68,68,0.2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>💰</span>
          <div>
            <div style={{ fontSize: '13px', color: '#f0eee8', fontWeight: 500 }}>Top up your marketing wallet to launch campaigns</div>
            <div style={{ fontSize: '12px', color: '#56546a', marginTop: '2px' }}>
              ₹{CAMPAIGN_COSTS.totalPerMessage.toFixed(2)} per delivered message · ₹{CAMPAIGN_COSTS.metaFee.toFixed(2)} WhatsApp fee + ₹{CAMPAIGN_COSTS.chakrioFee.toFixed(2)} service fee
            </div>
          </div>
          <button style={{ ...btnPrimary, marginLeft: 'auto', whiteSpace: 'nowrap' }} onClick={() => setShowTopup(true)}>
            Add funds
          </button>
        </div>
      )}

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
          {campaigns.map(c => (
            <CampaignRow
              key={c.id}
              campaign={c}
              onPause={handlePause}
              onResume={handleResume}
            />
          ))}
        </div>
      )}

      {/* New Campaign Modal */}
      {showModal && (
        <NewCampaignModal
          propertyId={propertyId}
          walletBalance={balance}
          onClose={() => setShowModal(false)}
          onLaunched={handleLaunched}
        />
      )}

      {/* Topup Modal */}
      {showTopup && (
        <TopupModal
          propertyId={propertyId}
          onClose={() => setShowTopup(false)}
          onSuccess={(newBalance) => {
            setWallet(w => ({ ...w, balance: newBalance }));
            setShowTopup(false);
          }}
        />
      )}
    </div>
  );
}

// ── Campaign row ──────────────────────────────────────────────────
function CampaignRow({ campaign: c, onPause, onResume }) {
  const s     = STATUS_COLOR[c.status] ?? STATUS_COLOR.queued;
  const tpl   = TEMPLATES[c.template_name];
  const label = tpl?.label ?? c.template_name;
  const dt    = c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const total   = c.total_recipients || 0;
  const sent    = c.sent_count       || 0;
  const spent   = c.spent_amount     || 0;
  const budget  = c.budget_amount    || 0;
  const pct     = total > 0 ? Math.round((sent / total) * 100) : 0;
  const isActive = ['queued', 'sending'].includes(c.status);
  const isPaused = ['paused_by_user', 'paused_insufficient_funds'].includes(c.status);

  return (
    <div style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
        background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
      }}>
        📣
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#f0eee8' }}>{label}</span>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: s.bg, color: s.color, fontWeight: 500 }}>
            {s.label}
          </span>
        </div>

        <div style={{ fontSize: '12px', color: '#56546a', marginBottom: '6px' }}>
          {dt}
          {total > 0 && (
            <span>
              {' · '}<span style={{ color: '#f0eee8' }}>{sent}</span>/{total} sent
              {c.failed_count > 0 && <span style={{ color: '#f87171' }}> · {c.failed_count} failed</span>}
            </span>
          )}
          {budget > 0 && (
            <span> · ₹{spent.toFixed(2)} of ₹{budget.toFixed(2)} spent</span>
          )}
        </div>

        {/* Progress bar */}
        {(isActive || isPaused || c.status === 'sending') && total > 0 && (
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', marginBottom: '8px' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: isPaused ? 'rgba(200,169,110,0.4)' : 'linear-gradient(90deg,#c8a96e,#e8c98a)',
              borderRadius: '2px', transition: 'width 1s ease',
            }} />
          </div>
        )}

        {/* Pause / Resume controls */}
        {isActive && (
          <button
            style={{ ...btnGhost, fontSize: '11px', padding: '4px 12px' }}
            onClick={() => onPause(c.id)}
          >
            ⏸ Pause
          </button>
        )}
        {isPaused && (
          <button
            style={{ ...btnPrimary, fontSize: '11px', padding: '4px 12px' }}
            onClick={() => onResume(c.id)}
          >
            ▶ Resume
          </button>
        )}
      </div>

      {total > 0 && (
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#c8a96e', flexShrink: 0 }}>
          {pct}%
        </div>
      )}
    </div>
  );
}

// ── Topup Modal ───────────────────────────────────────────────────
function TopupModal({ propertyId, onClose, onSuccess }) {
  const [amount,    setAmount]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [payUrl,    setPayUrl]    = useState(null);

  const submit = async () => {
    const val = parseFloat(amount);
    if (!val || val < 10) { setError('Minimum topup is ₹10'); return; }
    if (val > 10000)       { setError('Maximum topup is ₹10,000'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/api/wallet', {
        method: 'POST',
        body: JSON.stringify({ property_uuid: propertyId, amount: val }),
      });
      setPayUrl(data.payment_url);
      window.open(data.payment_url, '_blank');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#16151f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
        width: '100%', maxWidth: '400px', padding: '28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '18px', color: '#f0eee8', margin: 0 }}>
            Add Funds
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#56546a', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        <p style={{ fontSize: '12px', color: '#56546a', margin: '0 0 16px' }}>
          ₹{CAMPAIGN_COSTS.totalPerMessage.toFixed(2)}/message ·{' '}
          ₹{CAMPAIGN_COSTS.metaFee.toFixed(2)} WhatsApp fee + ₹{CAMPAIGN_COSTS.chakrioFee.toFixed(2)} Chakrio fee
        </p>

        {!payUrl ? (
          <>
            <label style={{ display: 'block', fontSize: '12px', color: '#8c8a9e', marginBottom: '6px', fontWeight: 500 }}>
              Amount (₹)
            </label>
            <input
              style={{ ...inputStyle, marginBottom: '8px' }}
              type="number"
              min="10"
              max="10000"
              placeholder="e.g. 500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            {amount && parseFloat(amount) >= 10 && (
              <div style={{ fontSize: '12px', color: '#56546a', marginBottom: '12px' }}>
                ≈ {Math.floor(parseFloat(amount) / CAMPAIGN_COSTS.totalPerMessage)} messages
              </div>
            )}
            {error && <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={btnGhost} onClick={onClose}>Cancel</button>
              <button
                style={{ ...btnPrimary, flex: 1, opacity: loading ? 0.5 : 1 }}
                disabled={loading}
                onClick={submit}
              >
                {loading ? 'Creating link…' : 'Pay via Razorpay'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔗</div>
            <p style={{ fontSize: '13px', color: '#f0eee8', marginBottom: '8px' }}>
              Payment link opened in a new tab.
            </p>
            <p style={{ fontSize: '12px', color: '#56546a', marginBottom: '20px' }}>
              Complete the payment to top up your wallet. Balance updates automatically.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button style={btnGhost} onClick={() => window.open(payUrl, '_blank')}>
                Reopen link
              </button>
              <button style={btnPrimary} onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── New Campaign Modal ────────────────────────────────────────────
function NewCampaignModal({ propertyId, walletBalance, onClose, onLaunched }) {
  const [step,           setStep]           = useState('pick');
  const [selected,       setSelected]       = useState(null);
  const [vars,           setVars]           = useState({});
  const [budget,         setBudget]         = useState('');
  const [recipientCount, setRecipientCount] = useState(null);
  const [launching,      setLaunching]      = useState(false);
  const [error,          setError]          = useState('');

  useEffect(() => {
    if (!selected) return;
    setRecipientCount(null);
    apiFetch(`/api/campaigns?action=count&propertyId=${propertyId}`)
      .then(d => setRecipientCount(d.count ?? 0))
      .catch(() => setRecipientCount('—'));
  }, [selected, propertyId]);

  const tpl = TEMPLATES[selected];

  const budgetVal       = parseFloat(budget) || 0;
  const maxFromBudget   = budgetVal > 0 ? Math.floor(budgetVal / CAMPAIGN_COSTS.totalPerMessage) : 0;
  const effectiveMax    = Math.min(maxFromBudget, typeof recipientCount === 'number' ? recipientCount : maxFromBudget);
  const estimatedDays   = effectiveMax > 0 ? Math.ceil(effectiveMax / 250) : 0;
  const budgetExceeds   = budgetVal > walletBalance;
  const allFilled       = tpl?.fields.every(f => (vars[f.key] ?? '').trim());
  const canLaunch       = allFilled && budgetVal >= CAMPAIGN_COSTS.totalPerMessage && !budgetExceeds && !launching;

  const launch = async () => {
    setLaunching(true);
    setError('');
    try {
      const data = await apiFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          property_uuid:  propertyId,
          template_name:  selected,
          template_vars:  vars,
          budget_amount:  budgetVal,
        }),
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
        width: '100%', maxWidth: '520px', padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
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
                onClick={() => { setSelected(key); setVars({}); setBudget(''); setStep('fill'); }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '10px', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', width: '100%',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#f0eee8', marginBottom: '3px' }}>{t.label}</div>
                <div style={{ fontSize: '12px', color: '#56546a' }}>{t.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Fill variables + budget */}
        {step === 'fill' && tpl && (
          <>
            <p style={{ fontSize: '12px', color: '#56546a', marginBottom: '16px', marginTop: 0 }}>
              {tpl.description}. <em>Guest name and property name are filled automatically.</em>
            </p>

            {/* Template fields */}
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

            {/* Budget section */}
            <div style={{ ...card, padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#8c8a9e', fontWeight: 500 }}>Campaign Budget</span>
                <span style={{ fontSize: '12px', color: '#56546a' }}>
                  Wallet: <span style={{ color: walletBalance > 0 ? '#48c78e' : '#f87171', fontWeight: 600 }}>₹{walletBalance.toFixed(2)}</span>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#8c8a9e' }}>₹</span>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  type="number"
                  min={CAMPAIGN_COSTS.totalPerMessage}
                  max={walletBalance}
                  placeholder="e.g. 200"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                />
              </div>

              {budgetExceeds && (
                <div style={{ fontSize: '11px', color: '#f87171', marginBottom: '6px' }}>
                  ⚠️ Budget exceeds wallet balance (₹{walletBalance.toFixed(2)})
                </div>
              )}

              {budgetVal >= CAMPAIGN_COSTS.totalPerMessage && !budgetExceeds && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#c8a96e' }}>{effectiveMax}</div>
                    <div style={{ fontSize: '10px', color: '#56546a' }}>guests</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#f0eee8' }}>₹{budgetVal.toFixed(0)}</div>
                    <div style={{ fontSize: '10px', color: '#56546a' }}>max spend</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#a896f8' }}>~{estimatedDays}d</div>
                    <div style={{ fontSize: '10px', color: '#56546a' }}>estimate</div>
                  </div>
                </div>
              )}

              {/* Cost tooltip */}
              <div style={{ fontSize: '10px', color: '#56546a', marginTop: '8px', lineHeight: 1.5 }}>
                ₹{CAMPAIGN_COSTS.totalPerMessage.toFixed(2)}/message = ₹{CAMPAIGN_COSTS.metaFee.toFixed(2)} WhatsApp delivery + ₹{CAMPAIGN_COSTS.chakrioFee.toFixed(2)} service fee.
                Wallet is charged only on delivery, not on send.
              </div>
            </div>

            {/* Recipient estimate card */}
            <div style={{ ...card, padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#8c8a9e' }}>
                {budgetVal >= CAMPAIGN_COSTS.totalPerMessage ? 'Top guests selected (by repeat stays)' : 'Total eligible guests'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#c8a96e' }}>
                {recipientCount === null ? '…' : recipientCount}
              </span>
            </div>

            {error && (
              <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '12px' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={btnGhost} onClick={() => setStep('pick')}>← Back</button>
              <button
                style={{ ...btnPrimary, flex: 1, opacity: !canLaunch ? 0.5 : 1 }}
                disabled={!canLaunch}
                onClick={launch}
              >
                {launching ? 'Queuing…' : effectiveMax > 0 ? `Queue for ${effectiveMax} guests` : 'Set a budget to continue'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

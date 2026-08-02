import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PLAN_COLORS = {
  starter: { bg: 'rgba(255,255,255,0.06)', text: '#8c8a9e' },
  lite:    { bg: 'rgba(0,212,255,0.12)',   text: '#00D4FF' },
  growth:  { bg: 'rgba(72,199,142,0.15)',  text: '#48c78e' },
  pro:     { bg: 'rgba(108,99,255,0.18)',  text: '#a89ef5' },
  advance: { bg: 'rgba(201,162,75,0.15)',  text: '#C9A24B' },
};
const CHANNEL_LABEL = { telegram: '📱 Telegram', whatsapp: '💬 WhatsApp' };
const PLANS = ['starter', 'lite', 'growth', 'pro', 'advance'];
const PLAN_LABELS = {
  starter: 'Starter — ≤4 rooms',
  lite:    'Lite — ≤8 rooms',
  growth:  'Growth — ≤15 rooms',
  pro:     'Pro — ≤30 rooms',
  advance: 'Advance — 30+ rooms',
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PlanBadge({ plan }) {
  const c = PLAN_COLORS[plan] || PLAN_COLORS.starter;
  return <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, textTransform: 'capitalize' }}>{plan || 'starter'}</span>;
}

function StatusDot({ active }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: active ? '#4CAF50' : '#56546a', marginRight: 6, flexShrink: 0 }} />;
}

function SubscriptionBadge({ status, dueDate }) {
  if (!status || status === 'trial') return <span style={{ background: 'rgba(0,212,255,0.12)', color: '#00D4FF', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>Trial</span>;
  if (status === 'expired') return <span style={{ background: 'rgba(224,112,112,0.15)', color: '#e07070', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>Overdue</span>;
  if (status === 'active' && dueDate) {
    const daysLeft = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
    if (daysLeft <= 7) return <span style={{ background: 'rgba(255,193,7,0.15)', color: '#FFC107', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>Expiring {fmtDate(dueDate)}</span>;
    return <span style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>Active · {fmtDate(dueDate)}</span>;
  }
  return <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8c8a9e', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{status}</span>;
}

function HealthBadge({ usage }) {
  if (!usage) return null;
  const last = usage.last_inbound_at;
  const daysSince = last ? Math.floor((Date.now() - new Date(last)) / 86400000) : null;
  if (daysSince === null || daysSince >= 7) {
    return <span style={{ background: 'rgba(255,107,107,0.12)', color: '#ff6b6b', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3 }}>⚠️ Silent {daysSince === null ? '' : `${daysSince}d`}</span>;
  }
  return <span style={{ background: 'rgba(76,175,80,0.1)', color: '#4CAF50', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3 }}>● Active</span>;
}

function ActionBtn({ children, onClick, danger, small, primary }) {
  const base = {
    background: danger ? 'rgba(224,112,112,0.1)' : primary ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${danger ? 'rgba(224,112,112,0.3)' : primary ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
    color: danger ? '#e07070' : primary ? '#a89ef5' : '#8c8a9e',
    borderRadius: 6, padding: small ? '4px 10px' : '5px 12px', fontSize: 12, cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif', fontWeight: 500, transition: 'opacity 0.15s',
  };
  return <button style={base} onClick={onClick} onMouseEnter={e => e.currentTarget.style.opacity='0.75'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>{children}</button>;
}

function PaymentForm({ propertyId, onSubmit, onCancel }) {
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount]   = useState('');
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px', color: '#f0eee8', fontSize: 12, outline: 'none', width: '100%' };
  return (
    <div style={{ marginTop: 10, background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: '#a89ef5', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mark Payment Received</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ fontSize: 11, color: '#56546a', marginBottom: 4 }}>Next due date</div>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1, minWidth: 110 }}>
          <div style={{ fontSize: 11, color: '#56546a', marginBottom: 4 }}>Amount (₹)</div>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1500" style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionBtn onClick={() => { if (dueDate) onSubmit(propertyId, 'payment', { dueDate, amount }); }}>Save</ActionBtn>
          <ActionBtn onClick={onCancel}>Cancel</ActionBtn>
        </div>
      </div>
    </div>
  );
}

function PlanChangeForm({ clientId, currentPlan, onSubmit, onCancel }) {
  const [plan, setPlan] = useState(currentPlan || 'starter');
  const selectStyle = { background: '#1e1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px', color: '#f0eee8', fontSize: 12, outline: 'none' };
  return (
    <div style={{ marginTop: 10, background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: '#00D4FF', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Plan</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select value={plan} onChange={e => setPlan(e.target.value)} style={selectStyle}>
          {PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
        </select>
        <ActionBtn primary onClick={() => onSubmit(null, 'change_plan', { clientId, plan })}>Save</ActionBtn>
        <ActionBtn onClick={onCancel}>Cancel</ActionBtn>
      </div>
    </div>
  );
}

function SendMessageModal({ propertyId, propertyName, onSubmit, onClose }) {
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    await onSubmit(propertyId, 'send_message', { message: msg });
    setSending(false);
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#16151f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', marginBottom: 4 }}>Send Message</div>
        <div style={{ fontSize: 12, color: '#56546a', marginBottom: 16 }}>→ {propertyName} manager</div>
        <textarea
          value={msg} onChange={e => setMsg(e.target.value)} rows={5} placeholder="Type your message..."
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#f0eee8', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'DM Sans, sans-serif' }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
          <ActionBtn onClick={onClose}>Cancel</ActionBtn>
          <ActionBtn primary onClick={handleSend}>{sending ? 'Sending...' : 'Send'}</ActionBtn>
        </div>
      </div>
    </div>
  );
}

function TokenChart({ data }) {
  if (!data || data.length === 0) return <div style={{ fontSize: 12, color: '#56546a', marginTop: 8 }}>No token data yet.</div>;
  const reversed = [...data].reverse();
  return (
    <div style={{ marginTop: 10, height: 100 }}>
      <div style={{ fontSize: 11, color: '#56546a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Token Usage (monthly)</div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={reversed} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="month_label" tick={{ fill: '#56546a', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#1e1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }}
            labelStyle={{ color: '#8c8a9e' }}
            itemStyle={{ color: '#6C63FF' }}
            formatter={v => [Number(v).toLocaleString(), 'Tokens']}
          />
          <Bar dataKey="tokens" fill="#6C63FF" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PaymentHistory({ rows }) {
  if (!rows || rows.length === 0) return <div style={{ fontSize: 12, color: '#56546a' }}>No payment history.</div>;
  return (
    <div>
      {rows.map(r => (
        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8c8a9e', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span>{fmtDate(r.created_at)}</span>
          <span style={{ color: '#4CAF50' }}>{r.amount ? `₹${Number(r.amount).toLocaleString('en-IN')}` : '—'}</span>
          <span>Due: {r.due_date ? fmtDate(r.due_date + 'T00:00:00') : '—'}</span>
        </div>
      ))}
    </div>
  );
}

const CAMPAIGN_TEMPLATE_LABELS = {
  festival_availability: 'Festival Availability',
  welcome_back_guest:    'Welcome Back',
  seasonal_offer:        'Seasonal Offer',
  we_miss_you:           'We Miss You',
};

const CAMPAIGN_STATUS_COLOR = {
  queued:                     '#00D4FF',
  sending:                    '#a89ef5',
  completed:                  '#4CAF50',
  failed:                     '#ff6b6b',
  paused_by_user:             '#8c8a9e',
  paused_insufficient_funds:  '#ff6b6b',
};

function CampaignSummary({ rows }) {
  if (!rows || rows.length === 0) return <div style={{ fontSize: 12, color: '#56546a' }}>No campaigns yet.</div>;

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const autoSentThisMonth = rows
    .filter(r => r.source === 'auto' && new Date(r.created_at) >= monthStart)
    .reduce((s, r) => s + (r.sent_count || 0), 0);

  return (
    <div>
      <div style={{ fontSize: 12, color: '#8c8a9e', marginBottom: 8 }}>
        <span style={{ color: '#a89ef5', fontWeight: 600 }}>{autoSentThisMonth}</span> auto-marketing message{autoSentThisMonth === 1 ? '' : 's'} sent this month
      </div>
      {rows.map(r => (
        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#8c8a9e', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {r.source === 'auto' && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#a89ef5', background: 'rgba(108,99,255,0.12)', borderRadius: 3, padding: '1px 5px' }}>AUTO</span>
            )}
            {CAMPAIGN_TEMPLATE_LABELS[r.template_name] ?? r.template_name}
          </span>
          <span style={{ color: CAMPAIGN_STATUS_COLOR[r.status] ?? '#8c8a9e', fontWeight: 600 }}>{r.status}</span>
          <span>{r.sent_count || 0}/{r.total_recipients || 0} sent{r.failed_count > 0 ? ` · ${r.failed_count} failed` : ''}</span>
          <span>{fmtDate(r.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

function OnboardChecklist({ status }) {
  if (!status) return null;
  const items = [
    { label: 'Property created',       done: true },
    { label: 'Firebase account',       done: true },
    { label: 'First message received', done: status.has_message },
    { label: 'First booking recorded', done: status.has_booking },
  ];
  return (
    <div style={{ marginTop: 8 }}>
      {items.map(({ label, done }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: done ? '#4CAF50' : '#56546a', marginBottom: 3 }}>
          <span>{done ? '✅' : '⬜'}</span> {label}
        </div>
      ))}
    </div>
  );
}

export default function ClientTable({ clients, onPropertyAction, fetchPropertyData }) {
  const [search, setSearch]             = useState('');
  const [planFilter, setPlanFilter]     = useState('all');
  const [expanded, setExpanded]         = useState(null);
  const [sortKey, setSortKey]           = useState('created_at');
  const [sortAsc, setSortAsc]           = useState(false);
  const [paymentOpen, setPaymentOpen]   = useState(null);
  const [planOpen, setPlanOpen]         = useState(null);
  const [sendMsgProp, setSendMsgProp]   = useState(null);

  // Per-property lazy data: { [propertyId]: { tokenHistory, paymentHistory, checklist, loading } }
  const [propData, setPropData] = useState({});

  const loadPropertyData = useCallback(async (propertyId) => {
    if (!fetchPropertyData || propData[propertyId]) return;
    setPropData(prev => ({ ...prev, [propertyId]: { loading: true } }));
    const [tokenHistory, paymentHistory, checklist, campaigns] = await Promise.all([
      fetchPropertyData(propertyId, 'token-history'),
      fetchPropertyData(propertyId, 'payment-history'),
      fetchPropertyData(propertyId, 'checklist'),
      fetchPropertyData(propertyId, 'campaigns'),
    ]);
    setPropData(prev => ({ ...prev, [propertyId]: { tokenHistory, paymentHistory, checklist, campaigns, loading: false } }));
  }, [fetchPropertyData, propData]);

  function toggleSort(key) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = clients
    .filter(c => {
      const q = search.toLowerCase();
      if (q && !c.name?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q)) return false;
      if (planFilter !== 'all' && c.plan !== planFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return av < bv ? (sortAsc ? -1 : 1) : av > bv ? (sortAsc ? 1 : -1) : 0;
    });

  const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#56546a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '11px 14px', fontSize: 13, color: '#8c8a9e', verticalAlign: 'middle' };

  function SortIcon({ k }) {
    if (sortKey !== k) return null;
    return sortAsc ? <ChevronUp size={12} style={{ marginLeft: 3 }} /> : <ChevronDown size={12} style={{ marginLeft: 3 }} />;
  }

  const handleAction = async (propertyId, action, extra = {}) => {
    if (action === 'delete' && !window.confirm('Permanently delete this property? This cannot be undone.')) return;
    setPaymentOpen(null); setPlanOpen(null);
    await onPropertyAction(propertyId, action, extra);
    // Bust cached property data on state-changing actions
    if (['payment', 'activate', 'deactivate', 'delete', 'change_plan'].includes(action)) {
      setPropData(prev => { const n = { ...prev }; delete n[propertyId]; return n; });
    }
  };

  const handleExpand = (clientId, properties) => {
    const newExpanded = expanded === clientId ? null : clientId;
    setExpanded(newExpanded);
    if (newExpanded) properties?.forEach(p => loadPropertyData(p.id));
  };

  return (
    <div>
      {/* Send message modal */}
      {sendMsgProp && (
        <SendMessageModal
          propertyId={sendMsgProp.id}
          propertyName={sendMsgProp.property_name}
          onSubmit={handleAction}
          onClose={() => setSendMsgProp(null)}
        />
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
          style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#f0eee8', fontSize: 13, outline: 'none' }} />
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          style={{ background: '#1e1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#f0eee8', fontSize: 13, outline: 'none' }}>
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="lite">Lite</option>
          <option value="growth">Growth</option>
          <option value="pro">Pro</option>
          <option value="advance">Advance</option>
        </select>
      </div>

      <div style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
            <tr>
              <th style={thStyle} onClick={() => toggleSort('name')}>Client <SortIcon k="name" /></th>
              <th style={thStyle} onClick={() => toggleSort('plan')}>Plan <SortIcon k="plan" /></th>
              <th style={thStyle}>Properties</th>
              <th style={thStyle} onClick={() => toggleSort('created_at')}>Joined <SortIcon k="created_at" /></th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: 32, color: '#56546a' }}>No clients match this filter</td></tr>
            )}
            {filtered.map(client => (
              <>
                <tr key={client.id}
                  onClick={() => handleExpand(client.id, client.properties)}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...tdStyle, color: '#f0eee8', fontWeight: 500 }}>
                    <div>{client.name}</div>
                    {client.properties?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {client.properties.map(p => (
                          <span key={p.id} style={{ fontSize: 11, fontWeight: 600, color: '#6C63FF', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 4, padding: '1px 7px' }}>{p.property_name}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#56546a', marginTop: 3 }}>{client.email}</div>
                  </td>
                  <td style={tdStyle}><PlanBadge plan={client.plan} /></td>
                  <td style={tdStyle}>{client.properties?.length ?? 0}</td>
                  <td style={tdStyle}>{fmtDate(client.created_at)}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <StatusDot active={client.is_active} />
                      <span style={{ fontSize: 12 }}>{client.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                </tr>

                {expanded === client.id && (
                  <tr key={`${client.id}-exp`} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td colSpan={5} style={{ padding: '0 14px 20px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ paddingTop: 14 }}>
                        {/* Plan change */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                          <span style={{ fontSize: 12, color: '#56546a' }}>Plan:</span>
                          <PlanBadge plan={client.plan} />
                          <ActionBtn small onClick={(e) => { e.stopPropagation(); setPlanOpen(planOpen === client.id ? null : client.id); }}>
                            Change Plan
                          </ActionBtn>
                        </div>
                        {planOpen === client.id && (
                          <PlanChangeForm clientId={client.id} currentPlan={client.plan} onSubmit={handleAction} onCancel={() => setPlanOpen(null)} />
                        )}

                        {/* Properties */}
                        <div style={{ fontSize: 11, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, fontWeight: 600 }}>
                          Properties ({client.properties?.length ?? 0})
                        </div>
                        {(!client.properties || client.properties.length === 0) && (
                          <div style={{ fontSize: 13, color: '#56546a' }}>No properties linked yet</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {client.properties?.map(p => {
                            const pd = propData[p.id];
                            return (
                              <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '14px 14px' }}>

                                {/* Property header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ color: '#f0eee8', fontWeight: 500 }}>{p.property_name}</span>
                                    <span style={{ fontSize: 11, color: '#56546a' }}>{p.property_type}</span>
                                    <span style={{ fontSize: 11, color: '#56546a' }}>{CHANNEL_LABEL[p.notification_channel] ?? p.notification_channel}</span>
                                    <HealthBadge usage={p.usage} />
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <SubscriptionBadge status={p.subscription_status} dueDate={p.subscription_due_date} />
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <StatusDot active={p.is_active} />
                                      <span style={{ fontSize: 11, color: '#56546a' }}>{p.is_active ? 'Active' : 'Inactive'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Meta */}
                                <div style={{ marginTop: 6, fontSize: 11, color: '#56546a', fontFamily: 'monospace' }}>UUID: {p.id}</div>
                                <div style={{ marginTop: 2, fontSize: 11, color: '#56546a' }}>
                                  Slug: <code style={{ color: '#8c8a9e' }}>{p.property_id}</code>
                                  <span style={{ marginLeft: 12 }}>Joined: {fmtDate(p.created_at)}</span>
                                  {p.subscription_due_date && <span style={{ marginLeft: 12 }}>Due: {fmtDate(p.subscription_due_date)}</span>}
                                </div>

                                {/* Usage stats */}
                                {p.usage ? (
                                  <div style={{ marginTop: 6, fontSize: 11, color: '#56546a', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <span>Recv: <span style={{ color: '#8c8a9e' }}>{p.usage.inbound_total} total · {p.usage.inbound_30d} this month</span></span>
                                    <span>Sent: <span style={{ color: '#8c8a9e' }}>{p.usage.outbound_total} total · {p.usage.outbound_30d} this month</span></span>
                                    <span>Tokens: <span style={{ color: '#8c8a9e' }}>{Number(p.usage.tokens_30d ?? p.usage.tokens_total).toLocaleString()} this month · {Number(p.usage.tokens_total).toLocaleString()} total</span></span>
                                  </div>
                                ) : (
                                  <div style={{ marginTop: 6, fontSize: 11, color: '#56546a' }}>No usage data yet</div>
                                )}

                                {/* Token chart (item 1) */}
                                {pd?.loading ? (
                                  <div style={{ fontSize: 11, color: '#56546a', marginTop: 8 }}>Loading...</div>
                                ) : (
                                  <TokenChart data={pd?.tokenHistory} />
                                )}

                                {/* Onboarding checklist (item 10) */}
                                {!pd?.loading && pd?.checklist && (
                                  <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                                    <div style={{ fontSize: 11, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6 }}>Onboarding</div>
                                    <OnboardChecklist status={pd.checklist} />
                                  </div>
                                )}

                                {/* Action buttons */}
                                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {p.is_active ? (
                                    <ActionBtn onClick={() => handleAction(p.id, 'deactivate')}>Deactivate</ActionBtn>
                                  ) : (
                                    <ActionBtn onClick={() => handleAction(p.id, 'activate')}>Activate</ActionBtn>
                                  )}
                                  <ActionBtn onClick={() => setPaymentOpen(paymentOpen === p.id ? null : p.id)}>
                                    {paymentOpen === p.id ? 'Cancel Payment' : 'Mark Payment'}
                                  </ActionBtn>
                                  <ActionBtn primary onClick={() => setSendMsgProp(p)}>Send Msg</ActionBtn>
                                  <ActionBtn danger onClick={() => handleAction(p.id, 'delete')}>Delete</ActionBtn>
                                </div>

                                {/* Payment form */}
                                {paymentOpen === p.id && (
                                  <PaymentForm propertyId={p.id} onSubmit={handleAction} onCancel={() => setPaymentOpen(null)} />
                                )}

                                {/* Payment history (item 4) */}
                                {!pd?.loading && pd?.paymentHistory !== undefined && (
                                  <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                                    <div style={{ fontSize: 11, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6 }}>Payment History</div>
                                    <PaymentHistory rows={pd.paymentHistory} />
                                  </div>
                                )}

                                {/* Campaigns — manual + auto-marketing send counts */}
                                {!pd?.loading && pd?.campaigns !== undefined && (
                                  <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                                    <div style={{ fontSize: 11, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6 }}>Campaigns</div>
                                    <CampaignSummary rows={pd.campaigns} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {client.phone && (
                          <div style={{ marginTop: 10, fontSize: 12, color: '#56546a' }}>Phone: {client.phone}</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#56546a' }}>
        {filtered.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

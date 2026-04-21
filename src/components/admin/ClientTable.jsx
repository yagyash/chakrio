import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const PLAN_COLORS = {
  free:    { bg: 'rgba(255,255,255,0.06)', text: '#8c8a9e' },
  starter: { bg: 'rgba(0,212,255,0.12)',   text: '#00D4FF' },
  pro:     { bg: 'rgba(108,99,255,0.18)',  text: '#a89ef5' },
};

const CHANNEL_LABEL = { telegram: '📱 Telegram', whatsapp: '💬 WhatsApp' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PlanBadge({ plan }) {
  const c = PLAN_COLORS[plan] || PLAN_COLORS.free;
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, textTransform: 'capitalize' }}>
      {plan || 'free'}
    </span>
  );
}

function StatusDot({ active }) {
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: active ? '#4CAF50' : '#56546a', marginRight: 6, flexShrink: 0 }} />
  );
}

function SubscriptionBadge({ status, dueDate }) {
  if (!status || status === 'trial') {
    return <span style={{ background: 'rgba(0,212,255,0.12)', color: '#00D4FF', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>Trial</span>;
  }
  if (status === 'expired') {
    return <span style={{ background: 'rgba(224,112,112,0.15)', color: '#e07070', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>Overdue</span>;
  }
  if (status === 'active' && dueDate) {
    const daysLeft = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
    if (daysLeft <= 7) {
      return <span style={{ background: 'rgba(255,193,7,0.15)', color: '#FFC107', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>Expiring {formatDate(dueDate)}</span>;
    }
    return <span style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>Active · {formatDate(dueDate)}</span>;
  }
  return <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8c8a9e', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{status}</span>;
}

function ActionBtn({ children, onClick, danger, small }) {
  const base = {
    background: danger ? 'rgba(224,112,112,0.1)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${danger ? 'rgba(224,112,112,0.3)' : 'rgba(255,255,255,0.1)'}`,
    color: danger ? '#e07070' : '#8c8a9e',
    borderRadius: 6,
    padding: small ? '4px 10px' : '5px 12px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 500,
    transition: 'opacity 0.15s',
  };
  return <button style={base} onClick={onClick} onMouseEnter={e => e.currentTarget.style.opacity = '0.75'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>{children}</button>;
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

export default function ClientTable({ clients, onPropertyAction }) {
  const [search, setSearch]         = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [expanded, setExpanded]     = useState(null);
  const [sortKey, setSortKey]       = useState('created_at');
  const [sortAsc, setSortAsc]       = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(null);   // propertyId

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
    setPaymentOpen(null);
    await onPropertyAction(propertyId, action, extra);
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#f0eee8', fontSize: 13, outline: 'none' }}
        />
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          style={{ background: '#1e1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#f0eee8', fontSize: 13, outline: 'none' }}>
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
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
                <tr
                  key={client.id}
                  onClick={() => setExpanded(expanded === client.id ? null : client.id)}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, color: '#f0eee8', fontWeight: 500 }}>
                    <div>{client.name}</div>
                    <div style={{ fontSize: 12, color: '#56546a', marginTop: 2 }}>{client.email}</div>
                  </td>
                  <td style={tdStyle}><PlanBadge plan={client.plan} /></td>
                  <td style={tdStyle}>{client.properties?.length ?? 0}</td>
                  <td style={tdStyle}>{formatDate(client.created_at)}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <StatusDot active={client.is_active} />
                      <span style={{ fontSize: 12 }}>{client.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                </tr>

                {/* Expanded row */}
                {expanded === client.id && (
                  <tr key={`${client.id}-exp`} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td colSpan={5} style={{ padding: '0 14px 16px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ paddingTop: 14 }}>
                        <div style={{ fontSize: 11, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, fontWeight: 600 }}>
                          Properties ({client.properties?.length ?? 0})
                        </div>
                        {(!client.properties || client.properties.length === 0) && (
                          <div style={{ fontSize: 13, color: '#56546a' }}>No properties linked yet</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {client.properties?.map(p => (
                            <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px', fontSize: 13 }}>

                              {/* Property header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                                <div>
                                  <span style={{ color: '#f0eee8', fontWeight: 500 }}>{p.property_name}</span>
                                  <span style={{ marginLeft: 8, fontSize: 11, color: '#56546a' }}>{p.property_type}</span>
                                  <span style={{ marginLeft: 8, fontSize: 11, color: '#56546a' }}>{CHANNEL_LABEL[p.notification_channel] ?? p.notification_channel}</span>
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
                                <span style={{ marginLeft: 12 }}>Joined: {formatDate(p.created_at)}</span>
                                {p.subscription_due_date && (
                                  <span style={{ marginLeft: 12 }}>Due: {formatDate(p.subscription_due_date)}</span>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {p.is_active ? (
                                  <ActionBtn onClick={() => handleAction(p.id, 'deactivate')}>Deactivate</ActionBtn>
                                ) : (
                                  <ActionBtn onClick={() => handleAction(p.id, 'activate')} >Activate</ActionBtn>
                                )}
                                <ActionBtn onClick={() => setPaymentOpen(paymentOpen === p.id ? null : p.id)}>
                                  {paymentOpen === p.id ? 'Cancel Payment' : 'Mark Payment'}
                                </ActionBtn>
                                <ActionBtn danger onClick={() => handleAction(p.id, 'delete')}>Delete</ActionBtn>
                              </div>

                              {/* Payment form */}
                              {paymentOpen === p.id && (
                                <PaymentForm
                                  propertyId={p.id}
                                  onSubmit={handleAction}
                                  onCancel={() => setPaymentOpen(null)}
                                />
                              )}
                            </div>
                          ))}
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

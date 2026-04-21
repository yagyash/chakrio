import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

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
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: active ? '#4CAF50' : '#56546a', marginRight: 6 }} />
  );
}

export default function ClientTable({ clients }) {
  const [search, setSearch]         = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [expanded, setExpanded]     = useState(null);
  const [sortKey, setSortKey]       = useState('created_at');
  const [sortAsc, setSortAsc]       = useState(false);

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
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#56546a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '11px 14px', fontSize: 13, color: '#8c8a9e', verticalAlign: 'middle' };

  function SortIcon({ k }) {
    if (sortKey !== k) return null;
    return sortAsc ? <ChevronUp size={12} style={{ marginLeft: 3 }} /> : <ChevronDown size={12} style={{ marginLeft: 3 }} />;
  }

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

      {/* Table */}
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
              <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '32px', color: '#56546a' }}>No clients match this filter</td></tr>
            )}
            {filtered.map(client => (
              <>
                <tr
                  key={client.id}
                  onClick={() => setExpanded(expanded === client.id ? null : client.id)}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.1s' }}
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
                    <StatusDot active={client.is_active} />
                    <span style={{ fontSize: 12 }}>{client.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                </tr>

                {/* Expanded row — property details */}
                {expanded === client.id && (
                  <tr key={`${client.id}-exp`} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td colSpan={5} style={{ padding: '0 14px 14px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ paddingTop: 12 }}>
                        <div style={{ fontSize: 11, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, fontWeight: 600 }}>
                          Properties ({client.properties?.length ?? 0})
                        </div>
                        {(!client.properties || client.properties.length === 0) && (
                          <div style={{ fontSize: 13, color: '#56546a' }}>No properties linked yet</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {client.properties?.map(p => (
                            <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <div>
                                  <span style={{ color: '#f0eee8', fontWeight: 500 }}>{p.property_name}</span>
                                  <span style={{ marginLeft: 8, fontSize: 11, color: '#56546a' }}>{p.property_type}</span>
                                  <span style={{ marginLeft: 8, fontSize: 11, color: '#56546a' }}>{CHANNEL_LABEL[p.notification_channel] ?? p.notification_channel}</span>
                                </div>
                                <StatusDot active={p.is_active} />
                              </div>
                              <div style={{ marginTop: 4, fontSize: 11, color: '#56546a', fontFamily: 'monospace' }}>
                                UUID: {p.id}
                              </div>
                              <div style={{ marginTop: 2, fontSize: 11, color: '#56546a' }}>
                                Slug: <code style={{ color: '#8c8a9e' }}>{p.property_id}</code>
                                <span style={{ marginLeft: 12 }}>Joined: {formatDate(p.created_at)}</span>
                              </div>
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

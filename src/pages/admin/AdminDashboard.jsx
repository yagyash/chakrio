import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIdToken } from 'firebase/auth';
import { ChevronLeft, Download } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import ClientTable from '../../components/admin/ClientTable';

function downloadCSV(clients) {
  const rows = [['Client', 'Email', 'Plan', 'Property', 'Type', 'Status', 'Sub Status', 'Due Date', 'Joined']];
  clients.forEach(c => {
    if (!c.properties?.length) {
      rows.push([c.name, c.email, c.plan, '', '', c.is_active ? 'Active' : 'Inactive', '', '', c.created_at?.slice(0,10) ?? '']);
    } else {
      c.properties.forEach(p => {
        rows.push([c.name, c.email, c.plan, p.property_name, p.property_type,
          p.is_active ? 'Active' : 'Inactive', p.subscription_status ?? '',
          p.subscription_due_date?.slice(0,10) ?? '', c.created_at?.slice(0,10) ?? '']);
      });
    }
  });
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `chakrio-clients-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

const EVENT_ICONS = { booking: '📅', onboarded: '✅', payment: '💳' };

export default function AdminDashboard() {
  const { firebaseUser } = useAuthContext();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin]     = useState(null);
  const [clients, setClients]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [activity, setActivity]   = useState([]);
  const [collectedThisMonth, setCollectedThisMonth] = useState(null);

  useEffect(() => {
    if (!firebaseUser) return;
    getIdToken(firebaseUser)
      .then(t => fetch('/api/is-admin', { headers: { Authorization: `Bearer ${t}` } }))
      .then(r => r.json())
      .then(({ isAdmin: a }) => setIsAdmin(!!a))
      .catch(() => setIsAdmin(false));
  }, [firebaseUser]);

  const loadClients = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true); setError('');
    try {
      const token = await getIdToken(firebaseUser);
      const [clientRes, activityRes, statsRes] = await Promise.all([
        fetch('/api/admin-clients',                    { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin-clients?action=activity',    { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin-clients?action=stats',       { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!clientRes.ok) throw new Error('Failed to load clients');
      setClients(await clientRes.json());
      if (activityRes.ok) setActivity(await activityRes.json());
      if (statsRes.ok) { const s = await statsRes.json(); setCollectedThisMonth(s.collected_this_month ?? 0); }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (isAdmin === true) loadClients();
    else if (isAdmin === false) setLoading(false);
  }, [isAdmin, loadClients]);

  const handlePropertyAction = useCallback(async (propertyId, action, extra = {}) => {
    if (!firebaseUser) return;
    setActionMsg('');
    try {
      const token = await getIdToken(firebaseUser);
      const method = action === 'delete' ? 'DELETE' : action === 'send_message' ? 'POST' : 'PATCH';
      const r = await fetch('/api/admin-property', {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, action, ...extra }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Action failed'); }
      const labels = {
        delete: 'Property deleted.', activate: 'Property activated.', deactivate: 'Property deactivated.',
        payment: 'Payment recorded. Property activated.', change_plan: 'Plan updated.',
        send_message: 'Message sent to manager.',
      };
      setActionMsg(labels[action] ?? 'Done.');
      if (action !== 'send_message') await loadClients();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  }, [firebaseUser, loadClients]);

  const fetchPropertyData = useCallback(async (propertyId, dataType) => {
    if (!firebaseUser) return null;
    const token = await getIdToken(firebaseUser);
    const r = await fetch(`/api/admin-clients?action=${dataType}&propertyId=${propertyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.ok ? r.json() : null;
  }, [firebaseUser]);

  // ── States ──────────────────────────────────────────────────────────
  if (!firebaseUser || isAdmin === null) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: '#56546a', fontSize: 14 }}>Checking access...</div>;
  }
  if (isAdmin === false) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#56546a' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 16, color: '#f0eee8', marginBottom: 8 }}>Access Restricted</div>
        <div style={{ fontSize: 13 }}>You don't have admin access.</div>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 18px', color: '#f0eee8', cursor: 'pointer', fontSize: 13 }}>Go to Dashboard</button>
      </div>
    );
  }
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: '#56546a', fontSize: 14 }}>Loading client data...</div>;
  if (error) return <div style={{ padding: 24 }}><div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '14px 18px', color: '#ff6b6b', fontSize: 13 }}>{error}</div></div>;

  // ── Computed stats ──────────────────────────────────────────────────
  const allProperties = clients.flatMap(c => (c.properties ?? []).map(p => ({ ...p, clientName: c.name })));
  const totalProperties = allProperties.length;
  const pendingActivation = allProperties.filter(p => !p.is_active).length;
  const activePlans = { free: 0, starter: 0, pro: 0 };
  clients.forEach(c => { if (activePlans[c.plan] !== undefined) activePlans[c.plan]++; });

  const mrr = allProperties.reduce((s, p) =>
    p.subscription_status === 'active' && p.subscription_amount ? s + Number(p.subscription_amount) : s, 0);
  const overdueCount = allProperties.filter(p => p.subscription_status === 'expired').length;

  const now = new Date();
  const expiringSoon = allProperties
    .filter(p => {
      if (!p.subscription_due_date) return false;
      const days = Math.ceil((new Date(p.subscription_due_date) - now) / 86400000);
      return days >= 0 && days <= 30 && p.subscription_status !== 'expired';
    })
    .sort((a, b) => new Date(a.subscription_due_date) - new Date(b.subscription_due_date));

  const cardStyle = { background: '#16151f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '16px 18px' };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d14', color: '#f0eee8' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16, background: '#0d0d14', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#56546a', cursor: 'pointer', fontSize: 13 }}>
          <ChevronLeft size={15} /> Dashboard
        </button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#6C63FF', letterSpacing: '-0.02em' }}>chakrio</span>
        <span style={{ fontSize: 13, color: '#56546a' }}>/ Admin</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => downloadCSV(clients)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '6px 12px', color: '#8c8a9e', cursor: 'pointer', fontSize: 12 }}>
            <Download size={13} /> Export CSV
          </button>
          <span style={{ fontSize: 12, color: '#56546a' }}>{firebaseUser.email}</span>
        </div>
      </div>

      <div style={{ padding: '28px 28px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0eee8', margin: 0 }}>All Clients</h1>
          <p style={{ fontSize: 13, color: '#56546a', marginTop: 4 }}>All onboarded clients and their properties</p>
        </div>

        {/* Action feedback */}
        {actionMsg && (
          <div style={{ marginBottom: 16, padding: '11px 16px', borderRadius: 8, fontSize: 13,
            background: actionMsg.startsWith('Error') ? 'rgba(255,107,107,0.1)' : 'rgba(76,175,80,0.1)',
            border: `1px solid ${actionMsg.startsWith('Error') ? 'rgba(255,107,107,0.3)' : 'rgba(76,175,80,0.3)'}`,
            color: actionMsg.startsWith('Error') ? '#ff6b6b' : '#4CAF50' }}>
            {actionMsg}
            <button onClick={() => setActionMsg('')} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
        )}

        {/* Revenue Summary Cards (item 3) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
          <div style={{ ...cardStyle, border: '1px solid rgba(108,99,255,0.25)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#6C63FF' }}>₹{mrr.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>MRR (active properties)</div>
          </div>
          {collectedThisMonth !== null && (
            <div style={{ ...cardStyle, border: '1px solid rgba(0,212,255,0.2)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#00D4FF' }}>₹{Number(collectedThisMonth).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>Collected this month</div>
            </div>
          )}
          <div style={{ ...cardStyle, border: overdueCount > 0 ? '1px solid rgba(255,107,107,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: overdueCount > 0 ? '#ff6b6b' : '#56546a' }}>{overdueCount}</div>
            <div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>Overdue</div>
          </div>
          <div style={cardStyle}><div style={{ fontSize: 22, fontWeight: 700, color: '#6C63FF' }}>{clients.length}</div><div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>Total Clients</div></div>
          <div style={cardStyle}><div style={{ fontSize: 22, fontWeight: 700, color: '#6C63FF' }}>{totalProperties}</div><div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>Total Properties</div></div>
          <div style={{ ...cardStyle, border: pendingActivation > 0 ? '1px solid rgba(255,193,7,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: pendingActivation > 0 ? '#FFC107' : '#56546a' }}>{pendingActivation}</div>
            <div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>Pending Activation</div>
          </div>
          <div style={cardStyle}><div style={{ fontSize: 22, fontWeight: 700, color: '#56546a' }}>{activePlans.free}</div><div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>Free</div></div>
          <div style={cardStyle}><div style={{ fontSize: 22, fontWeight: 700, color: '#00D4FF' }}>{activePlans.starter}</div><div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>Starter</div></div>
          <div style={cardStyle}><div style={{ fontSize: 22, fontWeight: 700, color: '#6C63FF' }}>{activePlans.pro}</div><div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>Pro</div></div>
        </div>

        {/* Expiry Dashboard (item 2) */}
        {expiringSoon.length > 0 && (
          <div style={{ marginBottom: 24, background: '#16151f', border: '1px solid rgba(255,193,7,0.2)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFC107', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠️ Expiring Soon — {expiringSoon.length} propert{expiringSoon.length === 1 ? 'y' : 'ies'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {expiringSoon.map(p => {
                const days = Math.ceil((new Date(p.subscription_due_date) - now) / 86400000);
                const urgency = days <= 7 ? '#ff6b6b' : days <= 14 ? '#FFC107' : '#8c8a9e';
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#f0eee8' }}>{p.property_name}</span>
                    <span style={{ color: '#56546a', fontSize: 12 }}>{p.clientName}</span>
                    <span style={{ color: urgency, fontWeight: 600, fontSize: 12 }}>
                      {days === 0 ? 'Today' : `${days}d`} · {new Date(p.subscription_due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <ClientTable clients={clients} onPropertyAction={handlePropertyAction} fetchPropertyData={fetchPropertyData} />

        {/* Activity Log (item 9) */}
        {activity.length > 0 && (
          <div style={{ marginTop: 28, background: '#16151f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f0eee8', marginBottom: 14 }}>Recent Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activity.map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < activity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', fontSize: 13 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{EVENT_ICONS[ev.event_type] ?? '📌'}</span>
                  <span style={{ color: '#f0eee8', flex: 1 }}>{ev.description}</span>
                  <span style={{ color: '#56546a', fontSize: 11, flexShrink: 0 }}>{ev.property_name}</span>
                  <span style={{ color: '#56546a', fontSize: 11, flexShrink: 0 }}>
                    {new Date(ev.occurred_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

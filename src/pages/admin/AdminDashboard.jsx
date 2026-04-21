import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIdToken } from 'firebase/auth';
import { ChevronLeft } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import ClientTable from '../../components/admin/ClientTable';

export default function AdminDashboard() {
  const { firebaseUser } = useAuthContext();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin]   = useState(null);   // null = checking
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // ── Check admin status ─────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser) return;
    getIdToken(firebaseUser)
      .then(token =>
        fetch('/api/is-admin', { headers: { Authorization: `Bearer ${token}` } })
      )
      .then(r => r.json())
      .then(({ isAdmin: a }) => setIsAdmin(!!a))
      .catch(() => setIsAdmin(false));
  }, [firebaseUser]);

  // ── Load clients (called on mount + after each action) ─────────
  const loadClients = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError('');
    try {
      const token = await getIdToken(firebaseUser);
      const res   = await fetch('/api/admin-clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load clients');
      setClients(await res.json());
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

  // ── Property actions ───────────────────────────────────────────
  const handlePropertyAction = useCallback(async (propertyId, action, extra = {}) => {
    if (!firebaseUser) return;
    setActionMsg('');
    try {
      const token = await getIdToken(firebaseUser);
      const method = action === 'delete' ? 'DELETE' : 'PATCH';
      const res = await fetch('/api/admin-property', {
        method,
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId, action, ...extra }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Action failed');
      }
      setActionMsg(
        action === 'delete'     ? 'Property deleted.' :
        action === 'activate'   ? 'Property activated.' :
        action === 'deactivate' ? 'Property deactivated.' :
        action === 'payment'    ? 'Payment recorded. Property activated.' : 'Done.'
      );
      await loadClients();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  }, [firebaseUser, loadClients]);

  // ── States ─────────────────────────────────────────────────────
  if (!firebaseUser || isAdmin === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: '#56546a', fontSize: 14 }}>
        Checking access...
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#56546a' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 16, color: '#f0eee8', marginBottom: 8 }}>Access Restricted</div>
        <div style={{ fontSize: 13 }}>You don't have admin access.</div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 18px', color: '#f0eee8', cursor: 'pointer', fontSize: 13 }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: '#56546a', fontSize: 14 }}>
        Loading client data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '14px 18px', color: '#ff6b6b', fontSize: 13 }}>
          {error}
        </div>
      </div>
    );
  }

  const totalProperties = clients.reduce((n, c) => n + (c.properties?.length ?? 0), 0);
  const activePlans = { free: 0, starter: 0, pro: 0 };
  clients.forEach(c => { if (activePlans[c.plan] !== undefined) activePlans[c.plan]++; });
  const pendingActivation = clients.reduce(
    (n, c) => n + (c.properties?.filter(p => !p.is_active).length ?? 0), 0
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d14', color: '#f0eee8' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16, background: '#0d0d14', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#56546a', cursor: 'pointer', fontSize: 13 }}>
          <ChevronLeft size={15} /> Dashboard
        </button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#6C63FF', letterSpacing: '-0.02em' }}>chakrio</span>
        <span style={{ fontSize: 13, color: '#56546a' }}>/ Admin</span>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#56546a' }}>{firebaseUser.email}</div>
      </div>

      <div style={{ padding: '28px 28px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0eee8', margin: 0 }}>All Clients</h1>
          <p style={{ fontSize: 13, color: '#56546a', marginTop: 4 }}>All onboarded clients and their properties</p>
        </div>

        {/* Action feedback */}
        {actionMsg && (
          <div style={{
            marginBottom: 16, padding: '11px 16px', borderRadius: 8, fontSize: 13,
            background: actionMsg.startsWith('Error') ? 'rgba(255,107,107,0.1)' : 'rgba(76,175,80,0.1)',
            border: `1px solid ${actionMsg.startsWith('Error') ? 'rgba(255,107,107,0.3)' : 'rgba(76,175,80,0.3)'}`,
            color: actionMsg.startsWith('Error') ? '#ff6b6b' : '#4CAF50',
          }}>
            {actionMsg}
            <button onClick={() => setActionMsg('')} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Clients',       value: clients.length },
            { label: 'Total Properties',    value: totalProperties },
            { label: 'Pending Activation',  value: pendingActivation, highlight: pendingActivation > 0 },
            { label: 'Free',                value: activePlans.free },
            { label: 'Starter',             value: activePlans.starter },
            { label: 'Pro',                 value: activePlans.pro },
          ].map(({ label, value, highlight }) => (
            <div key={label} style={{ background: '#16151f', border: `1px solid ${highlight ? 'rgba(255,193,7,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: highlight ? '#FFC107' : '#6C63FF' }}>{value}</div>
              <div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        <ClientTable clients={clients} onPropertyAction={handlePropertyAction} />
      </div>
    </div>
  );
}

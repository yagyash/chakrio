import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIdToken } from 'firebase/auth';
import { ChevronLeft } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import ClientTable from '../../components/admin/ClientTable';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export default function AdminDashboard() {
  const { firebaseUser } = useAuthContext();
  const navigate = useNavigate();
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const isAdmin = firebaseUser?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!firebaseUser) return;
    if (!isAdmin) return;

    async function load() {
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
    }

    load();
  }, [firebaseUser, isAdmin]);

  // ── Not admin ─────────────────────────────────────────────────
  if (!isAdmin) {
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

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: '#56546a', fontSize: 14 }}>
        Loading client data...
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '14px 18px', color: '#ff6b6b', fontSize: 13 }}>
          {error}
        </div>
      </div>
    );
  }

  // ── Stats ──────────────────────────────────────────────────────
  const totalProperties = clients.reduce((n, c) => n + (c.properties?.length ?? 0), 0);
  const activePlans     = { free: 0, starter: 0, pro: 0 };
  clients.forEach(c => { if (activePlans[c.plan] !== undefined) activePlans[c.plan]++; });

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
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#56546a' }}>{ADMIN_EMAIL}</div>
      </div>

    <div style={{ padding: '28px 28px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0eee8', margin: 0 }}>All Clients</h1>
        <p style={{ fontSize: 13, color: '#56546a', marginTop: 4 }}>All onboarded clients and their properties</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Clients',     value: clients.length },
          { label: 'Total Properties',  value: totalProperties },
          { label: 'Free',              value: activePlans.free },
          { label: 'Starter',           value: activePlans.starter },
          { label: 'Pro',               value: activePlans.pro },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#16151f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#6C63FF' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#56546a', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Client table */}
      <ClientTable clients={clients} />
    </div>
    </div>
  );
}

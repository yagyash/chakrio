import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import businessTemplates from '../../config/businessTemplates';

export default function Sidebar() {
  const { userProfile, logout, selectedProperty, selectProperty, properties } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const businessType = userProfile?.business_type ?? 'homestay';
  const template = businessTemplates[businessType] ?? businessTemplates.homestay;
  const nav = template.nav;

  const propertyName = selectedProperty?.property_name ?? 'My Property';
  const ownerName = userProfile?.owner_name ?? '';
  const hasMultipleProperties = properties.length > 1;

  const initials = ownerName
    ? ownerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const NavContent = () => (
    <div className="flex flex-col h-full sidebar-glow">

      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 1 }}>
        <div className="flex items-center gap-3">
          {/* Logomark SVG with gradient strokes */}
          <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '12px', background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
              <defs>
                <linearGradient id="chakLogoSidebar" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#c8a96e" />
                  <stop offset="100%" stopColor="#7c6af5" />
                </linearGradient>
              </defs>
              <circle cx="26" cy="26" r="24" stroke="url(#chakLogoSidebar)" strokeWidth="2.5" fill="none" opacity="0.9"/>
              <circle cx="26" cy="26" r="16" stroke="url(#chakLogoSidebar)" strokeWidth="1.5" fill="none" opacity="0.4"/>
              <circle cx="26" cy="26" r="8" fill="url(#chakLogoSidebar)" opacity="0.9"/>
              <line x1="26" y1="2"  x2="26" y2="10" stroke="url(#chakLogoSidebar)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="26" y1="42" x2="26" y2="50" stroke="url(#chakLogoSidebar)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="2"  y1="26" x2="10" y2="26" stroke="url(#chakLogoSidebar)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="42" y1="26" x2="50" y2="26" stroke="url(#chakLogoSidebar)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="7.5"  y1="7.5"  x2="13.2" y2="13.2" stroke="url(#chakLogoSidebar)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="38.8" y1="38.8" x2="44.5" y2="44.5" stroke="url(#chakLogoSidebar)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="44.5" y1="7.5"  x2="38.8" y2="13.2" stroke="url(#chakLogoSidebar)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="13.2" y1="38.8" x2="7.5"  y2="44.5" stroke="url(#chakLogoSidebar)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </div>

          {/* Wordmark */}
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              <span style={{ color: '#fff' }}>Chak</span>
              <span style={{ background: 'linear-gradient(135deg,#c8a96e,#e8c98a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>rio</span>
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#56546a', marginTop: '2px' }}>
              {(userProfile?.business_type ?? 'business').toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative', zIndex: 1 }}>
        {nav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(200,169,110,0.18), rgba(200,169,110,0.06))',
              color: '#c8a96e',
              border: '1px solid rgba(200,169,110,0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
            } : {
              color: '#8c8a9e',
              border: '1px solid transparent',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              fontSize: '14px',
              fontWeight: 400,
              textDecoration: 'none',
            }}
            className={({ isActive }) => !isActive ? 'sidebar-nav-item' : ''}
          >
            <NavIcon label={item.label} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Property pill */}
      <div className="px-3 pb-2" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          background: '#1e1c2a',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div className="animate-teal-pulse" style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#4ecdc4', flexShrink: 0,
          }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#f0eee8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {propertyName}
            </p>
          </div>
        </div>
        {hasMultipleProperties && (
          <button
            onClick={() => { selectProperty(null); setMobileOpen(false); }}
            className="mt-2 flex items-center gap-1.5 text-xs transition-colors duration-100 focus-visible:outline-none focus-visible:underline"
            style={{ color: '#c8a96e' }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Switch property
          </button>
        )}
      </div>

      {/* User card */}
      <div className="px-3 pb-3" style={{ position: 'relative', zIndex: 1 }}>
        <div className="sidebar-user-card" style={{
          background: '#1e1c2a',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg,#7c6af5,#a896f8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{initials}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#f0eee8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {ownerName || 'User'}
            </p>
            <p style={{ fontSize: '11px', color: '#56546a', margin: 0 }}>Owner</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4" style={{ position: 'relative', zIndex: 1 }}>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
            hover:bg-red-500/10 hover:text-red-400
            transition-colors duration-100
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          style={{ color: '#56546a' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-[110] p-2 rounded-lg text-white
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
        style={{ background: '#16151f', border: '1px solid rgba(255,255,255,0.07)' }}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full z-40
          transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:h-auto`}
        style={{ width: '220px', background: '#16151f' }}
      >
        <NavContent />
      </aside>
    </>
  );
}

/** Small icon per nav item */
function NavIcon({ label }) {
  const icons = {
    Dashboard: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
    Bookings: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    Expenses: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
    Reports: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    Sales: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  };

  return icons[label] ?? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

import { useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

/** Derive a readable page title from the current pathname */
function getPageTitle(pathname) {
  const map = {
    '/dashboard': 'Dashboard',
    '/bookings': 'Bookings',
    '/financials': 'Financials',
    '/expenses': 'Expenses',
    '/reports': 'Reports',
    '/sales': 'Sales',
  };
  return map[pathname] ?? 'Dashboard';
}

export default function TopBar({ onRefresh, refreshing }) {
  const { userProfile, firebaseUser } = useAuthContext();
  const location = useLocation();

  const pageTitle = getPageTitle(location.pathname);
  const propertyName = userProfile?.property_name ?? '';
  const initials = (userProfile?.owner_name ?? firebaseUser?.email ?? 'U')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="no-print"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(15,14,23,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      {/* Left: page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {/* Spacer for mobile hamburger */}
        <div className="w-8 lg:hidden" />
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontWeight: 400,
          fontSize: '28px',
          letterSpacing: '-0.5px',
          color: '#f0eee8',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {pageTitle}
        </h1>
        {propertyName && (
          <span
            className="hidden sm:inline-flex"
            style={{
              alignItems: 'center',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 500,
              background: 'rgba(200,169,110,0.12)',
              color: '#c8a96e',
              border: '1px solid rgba(200,169,110,0.2)',
              flexShrink: 0,
              letterSpacing: '0.3px',
            }}
          >
            {propertyName}
          </span>
        )}
      </div>

      {/* Right: refresh + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh data"
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#56546a',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.5 : 1,
              transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(200,169,110,0.1)';
              e.currentTarget.style.color = '#c8a96e';
              e.currentTarget.style.borderColor = 'rgba(200,169,110,0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#56546a';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <svg
              className={refreshing ? 'animate-spin' : ''}
              width="16" height="16"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        {/* User avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg,#7c6af5,#a896f8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}

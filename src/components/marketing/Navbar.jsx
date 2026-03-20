import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-sidebar border-b border-surface3">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo — matches login page */}
        <Link to="/" className="flex items-center gap-2.5">
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(200,169,110,0.1)',
            border: '1px solid rgba(200,169,110,0.2)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 52 52" fill="none" aria-label="Chakrio logo" role="img">
              <defs>
                <linearGradient id="chakLogoNav" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#c8a96e" />
                  <stop offset="100%" stopColor="#7c6af5" />
                </linearGradient>
              </defs>
              <circle cx="26" cy="26" r="24" stroke="url(#chakLogoNav)" strokeWidth="2.5" fill="none" opacity="0.9"/>
              <circle cx="26" cy="26" r="16" stroke="url(#chakLogoNav)" strokeWidth="1.5" fill="none" opacity="0.4"/>
              <circle cx="26" cy="26" r="8" fill="url(#chakLogoNav)" opacity="0.9"/>
              <line x1="26" y1="2"  x2="26" y2="10" stroke="url(#chakLogoNav)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="26" y1="42" x2="26" y2="50" stroke="url(#chakLogoNav)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="2"  y1="26" x2="10" y2="26" stroke="url(#chakLogoNav)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="42" y1="26" x2="50" y2="26" stroke="url(#chakLogoNav)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="7.5"  y1="7.5"  x2="13.2" y2="13.2" stroke="url(#chakLogoNav)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="38.8" y1="38.8" x2="44.5" y2="44.5" stroke="url(#chakLogoNav)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="44.5" y1="7.5"  x2="38.8" y2="13.2" stroke="url(#chakLogoNav)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="13.2" y1="38.8" x2="7.5"  y2="44.5" stroke="url(#chakLogoNav)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#f0eee8' }}>Chak</span>
            <span style={{ background: 'linear-gradient(135deg,#c8a96e,#e8c98a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>rio</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          <Link
            to="/#tools"
            className="text-sm text-text-2 hover:text-text-1 transition-colors"
          >
            Free Tools
          </Link>
          <Link
            to="/login"
            style={{
              fontSize: '14px', fontWeight: 600, padding: '8px 18px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #c8a96e, #b8934a)',
              color: '#0f0e17', textDecoration: 'none',
            }}
          >
            Login →
          </Link>
        </div>
      </div>
    </nav>
  );
}

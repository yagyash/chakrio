import { useAuthContext } from '../../context/AuthContext';

export default function PropertyPicker() {
  const { properties, selectProperty, userProfile, logout } = useAuthContext();

  const ownerName = userProfile?.owner_name ?? '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg,#0d0d14 0%,#0d0d14 60%,#1a1030 100%)' }}>
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)', boxShadow: '0 8px 28px -4px rgba(200,169,110,0.3)' }}>
          <svg width="34" height="34" viewBox="0 0 52 52" fill="none">
            <defs>
              <linearGradient id="chakLogoPicker" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#c8a96e" />
                <stop offset="100%" stopColor="#7c6af5" />
              </linearGradient>
            </defs>
            <circle cx="26" cy="26" r="24" stroke="url(#chakLogoPicker)" strokeWidth="2.5" fill="none" opacity="0.9"/>
            <circle cx="26" cy="26" r="16" stroke="url(#chakLogoPicker)" strokeWidth="1.5" fill="none" opacity="0.4"/>
            <circle cx="26" cy="26" r="8" fill="url(#chakLogoPicker)" opacity="0.9"/>
            <line x1="26" y1="2"  x2="26" y2="10" stroke="url(#chakLogoPicker)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="26" y1="42" x2="26" y2="50" stroke="url(#chakLogoPicker)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="2"  y1="26" x2="10" y2="26" stroke="url(#chakLogoPicker)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="42" y1="26" x2="50" y2="26" stroke="url(#chakLogoPicker)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="7.5"  y1="7.5"  x2="13.2" y2="13.2" stroke="url(#chakLogoPicker)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            <line x1="38.8" y1="38.8" x2="44.5" y2="44.5" stroke="url(#chakLogoPicker)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            <line x1="44.5" y1="7.5"  x2="38.8" y2="13.2" stroke="url(#chakLogoPicker)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            <line x1="13.2" y1="38.8" x2="7.5"  y2="44.5" stroke="url(#chakLogoPicker)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          </svg>
        </div>
        <h1 className="text-3xl text-white" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Chak<span style={{ background: 'linear-gradient(135deg,#c8a96e,#e8c98a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>rio</span>
        </h1>
        {ownerName && (
          <p className="text-slate-400 mt-1 text-sm">
            Welcome back, <span className="font-medium" style={{ color: '#c8a96e' }}>{ownerName}</span>
          </p>
        )}
        <p className="text-slate-500 mt-3 text-sm">Select a property to manage</p>
      </div>

      {/* Property cards */}
      {properties.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-10 text-center max-w-sm">
          <p className="text-slate-400 text-sm">No properties linked to your account yet.</p>
          <p className="text-slate-500 text-xs mt-2">Contact your administrator to add properties.</p>
        </div>
      ) : (
        <div className={`grid gap-4 w-full max-w-3xl ${
          properties.length === 1 ? 'grid-cols-1 max-w-sm' :
          properties.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {properties.map((prop, i) => (
            <button
              key={prop.id}
              onClick={() => selectProperty(prop)}
              style={{ animationDelay: `${i * 80 + 120}ms` }}
              className="group bg-white/5 hover:bg-white/10 active:bg-white/15
                border border-white/10
                rounded-2xl p-6 text-left
                animate-scale-in
                transition-all duration-200
                hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20
                active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a96e]"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              {/* Property icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-150"
                style={{ background: 'rgba(200,169,110,0.12)' }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#c8a96e' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>

              {/* Property name */}
              <h3 className="text-white font-semibold text-base leading-tight mb-1 transition-colors group-hover:text-[#c8a96e]">
                {prop.property_name}
              </h3>

              {/* Sheet connection status */}
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${prop.sheet_id ? 'bg-[#00D4FF]' : 'bg-slate-600'}`} />
                {prop.sheet_id ? 'Live data connected' : 'Demo mode'}
              </p>

              {/* Arrow */}
              <div className="mt-4 flex items-center gap-1 text-xs text-slate-500 transition-colors group-hover:text-[#c8a96e]">
                Open dashboard
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={logout}
        className="mt-10 text-xs text-slate-600 hover:text-slate-400 transition-colors
          focus-visible:outline-none focus-visible:underline"
      >
        Sign out
      </button>
    </div>
  );
}

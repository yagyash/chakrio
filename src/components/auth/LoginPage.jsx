import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../../services/firebase';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Prevent search engines from indexing the login page
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate('/dashboard', { replace: true });
    });
    return unsubscribe;
  }, [navigate]);

  // Handle the result after Google redirect returns to this page.
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          setLoading(true);
        }
      })
      .catch((err) => {
        setError(friendlyError(err.code));
      });
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      setError(friendlyError(err.code));
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address first, then click Forgot Password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo('Password reset email sent. Check your inbox.');
      setError('');
    } catch (err) {
      setError(friendlyError(err.code));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
      background: '#0f0e17',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '60%', height: '50%',
          background: 'radial-gradient(ellipse at 75% 15%, rgba(124,106,245,0.12) 0%, transparent 55%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '60%', height: '50%',
          background: 'radial-gradient(ellipse at 20% 85%, rgba(200,169,110,0.08) 0%, transparent 50%)',
        }} />
      </div>

      <div className="w-full" style={{ maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Logo / Brand */}
        <div className="text-center animate-fade-in-up" style={{ marginBottom: '28px' }}>
          {/* Icon container */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '12px',
            background: 'rgba(200,169,110,0.1)',
            border: '1px solid rgba(200,169,110,0.2)',
            boxShadow: '0 0 32px rgba(200,169,110,0.12)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <svg width="40" height="40" viewBox="0 0 52 52" fill="none">
              <defs>
                <linearGradient id="chakLogoLogin" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#c8a96e" />
                  <stop offset="100%" stopColor="#7c6af5" />
                </linearGradient>
              </defs>
              <circle cx="26" cy="26" r="24" stroke="url(#chakLogoLogin)" strokeWidth="2.5" fill="none" opacity="0.9"/>
              <circle cx="26" cy="26" r="16" stroke="url(#chakLogoLogin)" strokeWidth="1.5" fill="none" opacity="0.4"/>
              <circle cx="26" cy="26" r="8" fill="url(#chakLogoLogin)" opacity="0.9"/>
              <line x1="26" y1="2"  x2="26" y2="10" stroke="url(#chakLogoLogin)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="26" y1="42" x2="26" y2="50" stroke="url(#chakLogoLogin)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="2"  y1="26" x2="10" y2="26" stroke="url(#chakLogoLogin)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="42" y1="26" x2="50" y2="26" stroke="url(#chakLogoLogin)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="7.5"  y1="7.5"  x2="13.2" y2="13.2" stroke="url(#chakLogoLogin)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="38.8" y1="38.8" x2="44.5" y2="44.5" stroke="url(#chakLogoLogin)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="44.5" y1="7.5"  x2="38.8" y2="13.2" stroke="url(#chakLogoLogin)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <line x1="13.2" y1="38.8" x2="7.5"  y2="44.5" stroke="url(#chakLogoLogin)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </div>

          {/* Wordmark */}
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
            <span style={{ color: '#f0eee8' }}>Chak</span>
            <span style={{ background: 'linear-gradient(135deg,#c8a96e,#e8c98a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>rio</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#56546a', letterSpacing: '0.3px', margin: 0 }}>
            Run your business by message
          </p>
        </div>

        {/* Card */}
        <div className="animate-scale-in stagger-2" style={{
          background: '#16151f',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding: '36px 40px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
          <h2 style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: '22px',
            color: '#f0eee8',
            marginBottom: '24px',
            marginTop: 0,
            fontWeight: 400,
          }}>
            Sign in to your account
          </h2>

          {error && (
            <div style={{
              marginBottom: '16px', padding: '12px 14px',
              background: 'rgba(224,112,112,0.1)', border: '1px solid rgba(224,112,112,0.2)',
              color: '#e07070', borderRadius: '10px', fontSize: '13px',
            }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{
              marginBottom: '16px', padding: '12px 14px',
              background: 'rgba(124,106,245,0.1)', border: '1px solid rgba(124,106,245,0.2)',
              color: '#a896f8', borderRadius: '10px', fontSize: '13px',
            }}>
              {info}
            </div>
          )}

          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#8c8a9e', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="login-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#8c8a9e', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  fontSize: '13px', color: '#c8a96e', background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, fontFamily: 'DM Sans, sans-serif',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#d4b87a'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#c8a96e'}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #c8a96e, #b8934a)',
                color: '#0f0e17',
                border: 'none',
                borderRadius: '10px',
                padding: '13px',
                width: '100%',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'linear-gradient(135deg, #d4b87a, #c8a96e)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,169,110,0.25)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #c8a96e, #b8934a)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {loading ? <LoadingSpinner size="sm" color="dark" /> : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: '12px', color: '#56546a', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              background: '#1e1c2a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px',
              padding: '12px',
              width: '100%',
              fontSize: '14px',
              color: '#8c8a9e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#f0eee8'; e.currentTarget.style.background = '#252336'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#8c8a9e'; e.currentTarget.style.background = '#1e1c2a'; }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#56546a' }}>
            New user?{' '}
            <span style={{ color: '#8c8a9e', fontWeight: 500 }}>
              Contact your administrator for access.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const messages = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  };
  return messages[code] ?? 'Something went wrong. Please try again.';
}

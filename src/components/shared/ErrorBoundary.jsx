import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // main.jsx already beacons window.onerror/unhandledrejection to /api/log-error in
    // production; log here too since React swallows the error before it reaches those.
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0E0B14', padding: '24px',
      }}>
        <div style={{
          maxWidth: '420px', width: '100%', textAlign: 'center',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '32px 28px',
        }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#f0eee8' }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#8c8a9e', lineHeight: 1.6 }}>
            This page hit an unexpected error. Refreshing usually fixes it — if it keeps
            happening, let us know.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              background: '#6C63FF', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '13px',
  color: '#f0eee8',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  resize: 'vertical',
  fontFamily: 'DM Sans, sans-serif',
  lineHeight: '1.6',
};

export default function PropertySettings() {
  const { selectedProperty } = useAuthContext();
  const propertyId = selectedProperty?.id || 'default';

  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [status, setStatus]   = useState(null); // 'saved' | 'error' | null

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    getDoc(doc(db, 'property_settings', propertyId))
      .then(snap => {
        if (snap.exists()) {
          setText((snap.data() || {}).local_recommendations || '');
        }
      })
      .catch(err => console.error('PropertySettings load error:', err))
      .finally(() => setLoading(false));
  }, [propertyId]);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await setDoc(
        doc(db, 'property_settings', propertyId),
        { local_recommendations: text },
        { merge: true }
      );
      setStatus('saved');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error('PropertySettings save error:', err);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: '#0f0e17', padding: '28px 32px' }}
    >
      <h1 style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: '22px',
        color: '#f0eee8',
        marginBottom: '24px',
        letterSpacing: '-0.02em',
      }}>
        Property Settings
      </h1>

      {/* Local Recommendations Card */}
      <div style={{
        background: '#16151f',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '680px',
      }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '15px',
          color: '#f0eee8',
          marginBottom: '6px',
        }}>
          Local Recommendations
        </h2>
        <p style={{ fontSize: '12px', color: '#8c8a9e', marginBottom: '16px' }}>
          Local places, restaurants, and activities near your property. Guests can request this via the WhatsApp bot.
        </p>

        {loading ? (
          <div style={{ color: '#56546a', fontSize: '13px', padding: '12px 0' }}>Loading…</div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={1000}
              rows={10}
              placeholder={
                "e.g.\n🍽️ Restaurants:\n- Café Sunrise — 5 min walk, great breakfast\n- Spice Garden — local cuisine, 10 min\n\n🏞️ Activities:\n- Sunrise hike (2 km, 45 min)\n- Village market every Saturday morning"
              }
              style={inputStyle}
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '10px',
            }}>
              <span style={{ fontSize: '11px', color: '#56546a' }}>
                {text.length}/1000
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {status === 'saved' && (
                  <span style={{ fontSize: '12px', color: '#5cb88a', fontWeight: 500 }}>
                    Recommendations saved ✓
                  </span>
                )}
                {status === 'error' && (
                  <span style={{ fontSize: '12px', color: '#e07070', fontWeight: 500 }}>
                    Failed to save. Try again.
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: saving ? 'rgba(200,169,110,0.4)' : '#c8a96e',
                    color: '#0f0e17',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#d4b87a'; }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#c8a96e'; }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';

async function apiFetch(path, options = {}) {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  return fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
}

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

const OTA_OPTIONS = ['airbnb', 'booking.com', 'makemytrip', 'goibibo', 'agoda', 'other'];

export default function PropertySettings() {
  const { selectedProperty } = useAuthContext();
  const propertyId   = selectedProperty?.id || 'default';
  const supabaseId   = selectedProperty?.supabase_property_id || null;

  const [text, setText]                 = useState('');
  const [reviewUrl, setReviewUrl]       = useState('');
  const [placeId, setPlaceId]           = useState('');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [savingPlace, setSavingPlace]   = useState(false);
  const [status, setStatus]             = useState(null);
  const [reviewStatus, setReviewStatus] = useState(null);
  const [placeStatus, setPlaceStatus]   = useState(null);

  // iCal state
  const [feeds, setFeeds]               = useState([]);
  const [outboundUrl, setOutboundUrl]   = useState('');
  const [icalLoading, setIcalLoading]   = useState(false);
  const [copied, setCopied]             = useState(false);
  const [newOta, setNewOta]             = useState('airbnb');
  const [newUrl, setNewUrl]             = useState('');
  const [addingFeed, setAddingFeed]     = useState(false);
  const [addError, setAddError]         = useState('');
  const [removingId, setRemovingId]     = useState(null);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    getDoc(doc(db, 'property_settings', propertyId))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data() || {};
          setText(data.local_recommendations || '');
          setReviewUrl(data.google_review_link || '');
          setPlaceId(data.google_place_id || '');
        }
      })
      .catch(err => console.error('PropertySettings load error:', err))
      .finally(() => setLoading(false));
  }, [propertyId]);

  const loadIcalFeeds = async () => {
    if (!supabaseId) return;
    setIcalLoading(true);
    try {
      const res  = await apiFetch(`/api/ical-feeds?propertyId=${supabaseId}`);
      const data = await res.json();
      if (data.ok) {
        setFeeds(data.feeds || []);
        setOutboundUrl(data.outbound_url || '');
      }
    } catch { /* silent */ }
    finally { setIcalLoading(false); }
  };

  useEffect(() => { loadIcalFeeds(); }, [supabaseId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outboundUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddFeed = async () => {
    setAddError('');
    if (!newUrl.trim()) return setAddError('Paste the iCal URL from the OTA dashboard.');
    setAddingFeed(true);
    try {
      const res  = await apiFetch(`/api/ical-feeds?propertyId=${supabaseId}`, {
        method: 'POST',
        body: JSON.stringify({ ota_name: newOta, ical_url: newUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || 'Failed to add feed.'); return; }
      setNewUrl('');
      await loadIcalFeeds();
    } catch { setAddError('Network error. Try again.'); }
    finally { setAddingFeed(false); }
  };

  const handleRemoveFeed = async (feedId) => {
    setRemovingId(feedId);
    try {
      await apiFetch(`/api/ical-feeds?propertyId=${supabaseId}&feedId=${feedId}`, { method: 'DELETE' });
      await loadIcalFeeds();
    } catch { /* silent */ }
    finally { setRemovingId(null); }
  };

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

  const handleSaveReviewUrl = async () => {
    setSavingReview(true);
    setReviewStatus(null);
    try {
      await setDoc(
        doc(db, 'property_settings', propertyId),
        { google_review_link: reviewUrl.trim() },
        { merge: true }
      );
      setReviewStatus('saved');
      setTimeout(() => setReviewStatus(null), 3000);
    } catch (err) {
      console.error('PropertySettings review URL save error:', err);
      setReviewStatus('error');
    } finally {
      setSavingReview(false);
    }
  };

  const handleSavePlaceId = async () => {
    setSavingPlace(true);
    setPlaceStatus(null);
    try {
      await setDoc(
        doc(db, 'property_settings', propertyId),
        { google_place_id: placeId.trim() },
        { merge: true }
      );
      setPlaceStatus('saved');
      setTimeout(() => setPlaceStatus(null), 3000);
    } catch (err) {
      console.error('PropertySettings place ID save error:', err);
      setPlaceStatus('error');
    } finally {
      setSavingPlace(false);
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
      {/* Google Review Link Card */}
      <div style={{
        background: '#16151f',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '680px',
        marginTop: '20px',
      }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '15px',
          color: '#f0eee8',
          marginBottom: '6px',
        }}>
          Google Review Link
        </h2>
        <p style={{ fontSize: '12px', color: '#8c8a9e', marginBottom: '16px' }}>
          Guests who rate 4–5 stars will receive this link after checkout to share their review on Google.
        </p>

        {loading ? (
          <div style={{ color: '#56546a', fontSize: '13px', padding: '12px 0' }}>Loading…</div>
        ) : (
          <>
            <input
              type="url"
              value={reviewUrl}
              onChange={e => setReviewUrl(e.target.value)}
              placeholder="https://g.page/r/your-property-review-link"
              style={{ ...inputStyle, resize: 'none' }}
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '10px',
            }}>
              {reviewStatus === 'saved' && (
                <span style={{ fontSize: '12px', color: '#5cb88a', fontWeight: 500 }}>
                  Review link saved ✓
                </span>
              )}
              {reviewStatus === 'error' && (
                <span style={{ fontSize: '12px', color: '#e07070', fontWeight: 500 }}>
                  Failed to save. Try again.
                </span>
              )}
              <button
                onClick={handleSaveReviewUrl}
                disabled={savingReview}
                style={{
                  background: savingReview ? 'rgba(200,169,110,0.4)' : '#c8a96e',
                  color: '#0f0e17',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: savingReview ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!savingReview) e.currentTarget.style.background = '#d4b87a'; }}
                onMouseLeave={e => { if (!savingReview) e.currentTarget.style.background = '#c8a96e'; }}
              >
                {savingReview ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
      {/* Google Place ID Card */}
      <div style={{
        background: '#16151f',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '680px',
        marginTop: '20px',
      }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '15px',
          color: '#f0eee8',
          marginBottom: '6px',
        }}>
          Google Place ID
        </h2>
        <p style={{ fontSize: '12px', color: '#8c8a9e', marginBottom: '16px' }}>
          Used for the post-checkout review button (Template C). Find it at{' '}
          <a
            href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#c8a96e' }}
          >
            Place ID Finder
          </a>. Looks like: <span style={{ color: '#6c6a80', fontFamily: 'monospace' }}>ChIJx0RVVd...</span>
        </p>

        {loading ? (
          <div style={{ color: '#56546a', fontSize: '13px', padding: '12px 0' }}>Loading…</div>
        ) : (
          <>
            <input
              type="text"
              value={placeId}
              onChange={e => setPlaceId(e.target.value)}
              placeholder="ChIJx0RVVdYNczkRP9oTugegcc4"
              style={{ ...inputStyle, resize: 'none', fontFamily: 'monospace' }}
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '10px',
            }}>
              {placeStatus === 'saved' && (
                <span style={{ fontSize: '12px', color: '#5cb88a', fontWeight: 500 }}>
                  Place ID saved ✓
                </span>
              )}
              {placeStatus === 'error' && (
                <span style={{ fontSize: '12px', color: '#e07070', fontWeight: 500 }}>
                  Failed to save. Try again.
                </span>
              )}
              <button
                onClick={handleSavePlaceId}
                disabled={savingPlace}
                style={{
                  background: savingPlace ? 'rgba(200,169,110,0.4)' : '#c8a96e',
                  color: '#0f0e17',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: savingPlace ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!savingPlace) e.currentTarget.style.background = '#d4b87a'; }}
                onMouseLeave={e => { if (!savingPlace) e.currentTarget.style.background = '#c8a96e'; }}
              >
                {savingPlace ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
      {/* OTA Channel Sync Card */}
      <div style={{
        background: '#16151f',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '680px',
        marginTop: '20px',
      }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '15px',
          color: '#f0eee8',
          marginBottom: '4px',
        }}>
          OTA Channel Sync
        </h2>
        <p style={{ fontSize: '12px', color: '#8c8a9e', marginBottom: '20px' }}>
          Two-way iCal sync. Subscribe OTAs to your outbound feed so they auto-block direct bookings.
          Add inbound feeds to pull OTA bookings into Chakrio every 30 minutes.
        </p>

        {/* Outbound feed URL */}
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#8c8a9e', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Your Outbound Feed (share with OTAs)
        </p>
        {icalLoading ? (
          <div style={{ color: '#56546a', fontSize: '13px', marginBottom: '20px' }}>Loading…</div>
        ) : outboundUrl ? (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input
              readOnly
              value={outboundUrl}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '12px',
                color: '#8c8a9e',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                background: copied ? '#3a7d5c' : 'rgba(108,99,255,0.15)',
                border: '1px solid rgba(108,99,255,0.3)',
                color: copied ? '#5cb88a' : '#6C63FF',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {copied ? 'Copied ✓' : 'Copy URL'}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#56546a', marginBottom: '20px' }}>
            Feed URL not available — contact support.
          </div>
        )}

        {/* Active inbound feeds */}
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#8c8a9e', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Inbound Feeds (OTA → Chakrio)
        </p>
        {icalLoading ? (
          <div style={{ color: '#56546a', fontSize: '13px', marginBottom: '16px' }}>Loading…</div>
        ) : feeds.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#56546a', marginBottom: '16px' }}>No feeds added yet.</div>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            {feeds.map(f => (
              <div key={f.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                marginBottom: '8px',
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#6C63FF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  minWidth: '90px',
                }}>
                  {f.ota_name}
                </span>
                <span style={{ flex: 1, fontSize: '11px', color: '#56546a', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.ical_url}
                </span>
                {f.last_synced_at && (
                  <span style={{ fontSize: '10px', color: '#56546a', whiteSpace: 'nowrap' }}>
                    Synced {new Date(f.last_synced_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                <button
                  onClick={() => handleRemoveFeed(f.id)}
                  disabled={removingId === f.id}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: removingId === f.id ? '#56546a' : '#e07070',
                    cursor: removingId === f.id ? 'not-allowed' : 'pointer',
                    fontSize: '18px',
                    lineHeight: 1,
                    padding: '0 4px',
                  }}
                  title="Remove feed"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add feed form */}
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#8c8a9e', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Add Inbound Feed
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={newOta}
            onChange={e => setNewOta(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '13px',
              color: '#f0eee8',
              outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
            }}
          >
            {OTA_OPTIONS.map(o => (
              <option key={o} value={o} style={{ background: '#16151f' }}>{o}</option>
            ))}
          </select>
          <input
            type="url"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="Paste iCal URL from OTA dashboard…"
            style={{
              flex: 1,
              minWidth: '200px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '13px',
              color: '#f0eee8',
              outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
          <button
            onClick={handleAddFeed}
            disabled={addingFeed}
            style={{
              background: addingFeed ? 'rgba(200,169,110,0.4)' : '#c8a96e',
              color: '#0f0e17',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: addingFeed ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {addingFeed ? 'Adding…' : 'Add Feed'}
          </button>
        </div>
        {addError && (
          <p style={{ fontSize: '12px', color: '#e07070', marginTop: '8px' }}>{addError}</p>
        )}
      </div>
    </div>
  );
}

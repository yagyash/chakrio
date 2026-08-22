import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';

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

// Google's "make a copy" link for Chakrio's guest-ID-upload template form --
// opening this (signed into any Google account) copies the whole form,
// file-upload question included, into the visitor's own Drive with them as
// owner. Lets a non-technical manager get a working form in two clicks
// instead of building one, while uploads still land in the manager's own
// Drive, never Chakrio's.
const ID_UPLOAD_TEMPLATE_LINK = 'https://docs.google.com/forms/d/1_baG3PNb68gIFEhpWEsD8KrMROvA2INEN6vRjjRJc88/copy';

const PLAN_RANK = { starter: 0, lite: 1, growth: 2, pro: 3, advance: 4 };
const atLeast = (plan, required) => (PLAN_RANK[plan] ?? 0) >= (PLAN_RANK[required] ?? 1);

function UpgradePrompt({ required }) {
  return (
    <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '12px', padding: '16px 20px', marginTop: '20px', maxWidth: '680px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <span style={{ fontSize: '20px' }}>🔒</span>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#a09bff' }}>
          Available from {required.charAt(0).toUpperCase() + required.slice(1)} plan
        </div>
        <div style={{ fontSize: '12px', color: '#56546a', marginTop: '2px' }}>
          Upgrade your plan to unlock this feature. Contact us on WhatsApp to upgrade.
        </div>
      </div>
    </div>
  );
}

export default function PropertySettings() {
  const { selectedProperty, plan } = useAuthContext();
  const propertyId   = selectedProperty?.id || 'default';
  const supabaseId   = selectedProperty?.supabase_property_id || null;

  const [text, setText]                 = useState('');
  const [placeId, setPlaceId]           = useState('');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [savingPlace, setSavingPlace]   = useState(false);
  const [status, setStatus]             = useState(null);
  const [placeStatus, setPlaceStatus]   = useState(null);

  // Booking link state
  const [bookingLink, setBookingLink]   = useState(null);
  const [linkCopied, setLinkCopied]     = useState(false);
  const qrCanvasRef                     = useRef(null);

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

  // UPI ID state
  const [upiId, setUpiId]               = useState('');
  const [upiStatus, setUpiStatus]       = useState(null);

  useEffect(() => {
    if (!supabaseId) return;
    apiFetch(`/api/guests?propertyId=${supabaseId}&action=upi-id`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.upi_id != null) setUpiId(d.upi_id); })
      .catch(() => {});
  }, [supabaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveUpi = async () => {
    setUpiStatus('saving');
    try {
      const r = await apiFetch(`/api/guests?propertyId=${supabaseId}&action=upi-id`, {
        method: 'PATCH',
        body: JSON.stringify({ upiId }),
      });
      setUpiStatus(r.ok ? 'saved' : 'error');
    } catch {
      setUpiStatus('error');
    }
    setTimeout(() => setUpiStatus(null), 2500);
  };

  // Guest ID upload form URL state
  const [idUploadFormUrl, setIdUploadFormUrl] = useState('');
  const [idUploadStatus, setIdUploadStatus]   = useState(null);

  useEffect(() => {
    if (!supabaseId) return;
    apiFetch(`/api/guests?propertyId=${supabaseId}&action=id-upload-form-url`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id_upload_form_url != null) setIdUploadFormUrl(d.id_upload_form_url); })
      .catch(() => {});
  }, [supabaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveIdForm = async () => {
    setIdUploadStatus('saving');
    try {
      const r = await apiFetch(`/api/guests?propertyId=${supabaseId}&action=id-upload-form-url`, {
        method: 'PATCH',
        body: JSON.stringify({ idUploadFormUrl }),
      });
      setIdUploadStatus(r.ok ? 'saved' : 'error');
    } catch {
      setIdUploadStatus('error');
    }
    setTimeout(() => setIdUploadStatus(null), 2500);
  };

  // Photos & Video state
  const [mediaItems, setMediaItems]     = useState([]);
  const [mediaError, setMediaError]     = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    getDoc(doc(db, 'property_settings', propertyId))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data() || {};
          setText(data.local_recommendations || '');
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

  const loadMedia = async () => {
    if (!supabaseId) return;
    try {
      const r = await apiFetch(`/api/guests?propertyId=${supabaseId}&resource=media`);
      if (r.ok) setMediaItems(await r.json());
    } catch { /* best-effort */ }
  };
  useEffect(() => { loadMedia(); }, [supabaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !supabaseId) return;
    if (mediaItems.length + files.length > 10) {
      setMediaError('Maximum 10 media items allowed. Remove some before uploading.');
      return;
    }
    setMediaError('');
    setUploadingMedia(true);
    try {
      for (const file of files) {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        // Step 1: get signed URL
        const params = new URLSearchParams({
          propertyId: supabaseId,
          action: 'signed-upload',
          filename: file.name,
          contentType: file.type,
        });
        const signRes = await apiFetch(`/api/guests?${params}`);
        if (!signRes.ok) throw new Error('Could not get upload URL');
        const { signed_url, storage_path } = await signRes.json();
        // Step 2: PUT directly to Supabase Storage
        const putRes = await fetch(signed_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!putRes.ok) throw new Error('Upload failed');
        // Step 3: record in DB
        const recordRes = await apiFetch(`/api/guests?propertyId=${supabaseId}&resource=media`, {
          method: 'POST',
          body: JSON.stringify({ storage_path, media_type: mediaType }),
        });
        if (!recordRes.ok) throw new Error('Could not save media record');
      }
      await loadMedia();
    } catch (err) {
      setMediaError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleMediaDelete = async (mediaId) => {
    try {
      await apiFetch(`/api/guests?propertyId=${supabaseId}&resource=media&mediaId=${mediaId}`, { method: 'DELETE' });
      setMediaItems(prev => prev.filter(m => m.id !== mediaId));
    } catch {
      setMediaError('Could not delete item. Please try again.');
    }
  };

  useEffect(() => {
    if (!supabaseId) return;
    apiFetch(`/api/guests?propertyId=${supabaseId}&action=booking-link`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.wa_link) setBookingLink(d); })
      .catch(() => {});
  }, [supabaseId]);

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
      {/* Upgrade prompt for Starter plan */}
      {!atLeast(plan, 'lite') && <UpgradePrompt required="lite" />}

      {/* Google Place ID Card */}
      {atLeast(plan, 'lite') && <div style={{
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
      </div>}
      {/* OTA Channel Sync Card */}
      {atLeast(plan, 'lite') && <div style={{
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
      </div>}

      {/* WhatsApp Booking Link Card */}
      {atLeast(plan, 'lite') && bookingLink && (
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
            WhatsApp Booking Link
          </h2>
          <p style={{ fontSize: '12px', color: '#8c8a9e', marginBottom: '20px' }}>
            Share this link or QR code with guests. They'll land straight in your WhatsApp bot — no property picker needed.
          </p>

          {/* URL row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <input
              readOnly
              value={bookingLink.wa_link}
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
              onClick={() => {
                navigator.clipboard.writeText(bookingLink.wa_link).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                });
              }}
              style={{
                background: linkCopied ? '#3a7d5c' : 'rgba(37,211,102,0.12)',
                border: '1px solid rgba(37,211,102,0.3)',
                color: linkCopied ? '#5cb88a' : '#25d366',
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
              {linkCopied ? 'Copied ✓' : 'Copy Link'}
            </button>
          </div>

          {/* QR Code — inside booking link card */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '12px',
              display: 'inline-block',
            }}>
              <QRCodeCanvas
                ref={qrCanvasRef}
                value={bookingLink.wa_link}
                size={160}
                level="M"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <p style={{ fontSize: '12px', color: '#8c8a9e', margin: 0 }}>
                Print this QR code and place it at your check-in desk, in your listing photos, or on your business card.
              </p>
              <button
                onClick={() => {
                  const canvas = qrCanvasRef.current;
                  if (!canvas) return;
                  const url = canvas.toDataURL('image/png');
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `chakrio-booking-qr-${bookingLink.slug}.png`;
                  a.click();
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#f0eee8',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  alignSelf: 'flex-start',
                }}
              >
                Download QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── UPI Payment ID ───────────────────────────────────── */}
      {atLeast(plan, 'lite') && supabaseId && (
        <div style={{ background: '#16151f', borderRadius: '16px', padding: '28px', border: '1px solid rgba(255,255,255,0.06)', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#f0eee8' }}>Advance Payment</h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#8c8a9e', lineHeight: '1.5' }}>
            Your UPI ID is sent to guests when they book via WhatsApp and an advance is required.
            Leave blank to skip the payment prompt.
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="e.g. yourname@upi or yourname@ybl"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '14px',
                color: '#f0eee8',
                fontFamily: 'DM Sans, sans-serif',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSaveUpi}
              disabled={upiStatus === 'saving'}
              style={{
                background: upiStatus === 'saved' ? 'rgba(37,211,102,0.15)' : upiStatus === 'error' ? 'rgba(255,80,80,0.15)' : 'rgba(108,99,255,0.2)',
                border: `1px solid ${upiStatus === 'saved' ? 'rgba(37,211,102,0.4)' : upiStatus === 'error' ? 'rgba(255,80,80,0.4)' : 'rgba(108,99,255,0.4)'}`,
                color: upiStatus === 'saved' ? '#25d366' : upiStatus === 'error' ? '#ff5050' : '#a09bff',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: upiStatus === 'saving' ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              {upiStatus === 'saving' ? 'Saving…' : upiStatus === 'saved' ? 'Saved ✓' : upiStatus === 'error' ? 'Error' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* ── Guest ID Upload ──────────────────────────────────── */}
      {atLeast(plan, 'lite') && supabaseId && (
        <div style={{ background: '#16151f', borderRadius: '16px', padding: '28px', border: '1px solid rgba(255,255,255,0.06)', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#f0eee8' }}>Guest ID Upload</h3>
          <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#8c8a9e', lineHeight: '1.5' }}>
            Guests booking direct can optionally upload their ID before arrival — it goes straight into
            your own Google Drive, never through Chakrio. Don't have a form yet, three steps:
          </p>
          <ol style={{ margin: '0 0 16px', paddingLeft: '20px', fontSize: '13px', color: '#8c8a9e', lineHeight: '1.7' }}>
            <li>
              <a
                href={ID_UPLOAD_TEMPLATE_LINK}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#a09bff', textDecoration: 'underline' }}
              >
                Open our template
              </a>{' '}
              → click "Make a copy" — it's now in your Drive.
            </li>
            <li>
              Click <strong style={{ color: '#c9c7d9' }}>Publish</strong> (top right of the form editor) —
              Google forms don't accept responses until you do this, even though the questions are
              already there.
            </li>
            <li>
              Use the "Send" button to get your form's link (not the edit link — guests only need view
              access) and paste it below.
            </li>
          </ol>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#8c8a9e', lineHeight: '1.5' }}>
            Leave blank to skip.
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="e.g. https://forms.gle/…"
              value={idUploadFormUrl}
              onChange={e => setIdUploadFormUrl(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '14px',
                color: '#f0eee8',
                fontFamily: 'DM Sans, sans-serif',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSaveIdForm}
              disabled={idUploadStatus === 'saving'}
              style={{
                background: idUploadStatus === 'saved' ? 'rgba(37,211,102,0.15)' : idUploadStatus === 'error' ? 'rgba(255,80,80,0.15)' : 'rgba(108,99,255,0.2)',
                border: `1px solid ${idUploadStatus === 'saved' ? 'rgba(37,211,102,0.4)' : idUploadStatus === 'error' ? 'rgba(255,80,80,0.4)' : 'rgba(108,99,255,0.4)'}`,
                color: idUploadStatus === 'saved' ? '#25d366' : idUploadStatus === 'error' ? '#ff5050' : '#a09bff',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: idUploadStatus === 'saving' ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              {idUploadStatus === 'saving' ? 'Saving…' : idUploadStatus === 'saved' ? 'Saved ✓' : idUploadStatus === 'error' ? 'Error' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* ── Photos & Video ─────────────────────────────────── */}
      {atLeast(plan, 'lite') && <div style={{ background: '#16151f', borderRadius: '16px', padding: '28px', border: '1px solid rgba(255,255,255,0.06)', marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#f0eee8' }}>Photos &amp; Video</h3>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#8c8a9e', lineHeight: '1.5' }}>
          Upload photos and a video walkthrough. Guests see these in WhatsApp when they enquire.
          Max 10 items total.
        </p>

        {!supabaseId ? (
          <p style={{ fontSize: '13px', color: '#8c8a9e' }}>Property not yet linked to Supabase — contact support to enable media uploads.</p>
        ) : (
          <>
            {mediaError && (
              <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#ff6b6b' }}>{mediaError}</p>
            )}

            {/* Thumbnail grid */}
            {mediaItems.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {mediaItems.map(m => (
                  <div key={m.id} style={{ position: 'relative', width: '96px', height: '96px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {m.media_type === 'image' ? (
                      <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🎬</div>
                    )}
                    <button
                      onClick={() => handleMediaDelete(m.id)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                      title="Remove"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {mediaItems.length < 10 && (
              <label style={{ display: 'inline-block', cursor: uploadingMedia ? 'not-allowed' : 'pointer' }}>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleMediaUpload}
                  disabled={uploadingMedia}
                />
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: uploadingMedia ? 'rgba(200,169,110,0.4)' : '#c8a96e',
                  color: '#0d0d14', borderRadius: '8px', padding: '9px 18px',
                  fontSize: '13px', fontWeight: 700, pointerEvents: uploadingMedia ? 'none' : 'auto',
                }}>
                  {uploadingMedia ? 'Uploading…' : '+ Add photos / video'}
                </span>
              </label>
            )}
            <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#6c6a7e' }}>
              Images up to 5 MB · Videos up to 16 MB · Sent inside WhatsApp enquiry session (free)
            </p>
          </>
        )}
      </div>}
    </div>
  );
}

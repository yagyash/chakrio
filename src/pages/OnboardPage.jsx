import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, ChevronLeft, Upload, X, Download } from 'lucide-react';

const STEPS = ['Business', 'Property', 'Rooms', 'Review'];

const PROPERTY_TYPES = ['homestay', 'villa', 'hotel', 'resort', 'dharamshala'];
const PLANS          = ['starter', 'lite', 'growth', 'pro', 'advance'];
const PLAN_LABELS    = {
  starter: 'Starter — ≤4 rooms · ₹499/mo',
  lite:    'Lite — ≤8 rooms · ₹999/mo',
  growth:  'Growth — ≤15 rooms · ₹2,199/mo',
  pro:     'Pro — ≤30 rooms · ₹3,999/mo',
  advance: 'Advance — 30+ rooms · from ₹4,999/mo',
};
const ROOM_TYPES     = ['standard', 'vip', 'family', 'group', 'dorm'];
const HOTEL_TYPES    = new Set(['hotel', 'resort', 'dharamshala']);
const OTA_NAMES      = ['airbnb', 'booking.com', 'makemytrip', 'goibibo', 'agoda', 'other'];

const CSV_TEMPLATE = 'room_no,room_type,beds\n101,standard,2\n102,vip,1\n103,family,3\n';

// ── styles ────────────────────────────────────────────────────────

const S = {
  page:   { minHeight: '100vh', background: '#0d0d14', color: '#f0eee8', fontFamily: 'DM Sans, sans-serif', padding: '40px 20px' },
  card:   { maxWidth: 640, margin: '0 auto', background: '#16151f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '32px 36px' },
  label:  { display: 'block', fontSize: 13, fontWeight: 500, color: '#8c8a9e', marginBottom: 6 },
  input:  { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#f0eee8', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', background: '#1e1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#f0eee8', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  row:    { marginBottom: 18 },
  err:    { fontSize: 12, color: '#ff6b6b', marginTop: 4 },
  hint:   { fontSize: 12, color: '#56546a', marginTop: 4 },
  btn:    { background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnOut: { background: 'transparent', color: '#8c8a9e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '12px 24px', fontSize: 14, cursor: 'pointer' },
};

// ── helpers ───────────────────────────────────────────────────────

function slugify(s) {
  return s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 30);
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const roomNoIdx  = headers.indexOf('room_no');
  const roomTyIdx  = headers.indexOf('room_type');
  const bedsIdx    = headers.indexOf('beds');
  if (roomNoIdx === -1) return null; // invalid CSV
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    return {
      room_no:   cols[roomNoIdx]   || '',
      room_type: roomTyIdx !== -1  ? (cols[roomTyIdx] || '') : '',
      beds:      bedsIdx   !== -1  ? (parseInt(cols[bedsIdx]) || null) : null,
    };
  }).filter(r => r.room_no);
}

function downloadCSVTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'chakrio_rooms_template.csv';
  a.click();
}

// ── Step progress indicator ───────────────────────────────────────

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 0 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i < current ? '#6C63FF' : i === current ? '#6C63FF' : 'rgba(255,255,255,0.06)',
            color: i <= current ? '#fff' : '#56546a',
            transition: 'background 0.2s',
          }}>
            {i < current ? <CheckCircle size={14} /> : i + 1}
          </div>
          <span style={{ fontSize: 12, color: i === current ? '#f0eee8' : '#56546a', marginLeft: 6, marginRight: i < STEPS.length - 1 ? 4 : 0 }}>
            {s}
          </span>
          {i < STEPS.length - 1 && (
            <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.1)', marginLeft: 6, marginRight: 6 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1 — Business ─────────────────────────────────────────────

function Step1({ data, onChange, errors }) {
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Business Details</h2>
      <p style={{ fontSize: 13, color: '#56546a', marginBottom: 24 }}>Tell us about your business</p>

      <div style={S.row}>
        <label style={S.label}>Owner / Business Name *</label>
        <input style={S.input} value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="e.g. Raj Sharma / Lakeside Homestays" />
        {errors.name && <div style={S.err}>{errors.name}</div>}
      </div>

      <div style={S.row}>
        <label style={S.label}>Email (used for dashboard login) *</label>
        <input style={S.input} type="email" value={data.email} onChange={e => onChange('email', e.target.value)} placeholder="owner@example.com" />
        {errors.email && <div style={S.err}>{errors.email}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.row}>
          <label style={S.label}>Plan</label>
          <select style={S.select} value={data.plan} onChange={e => onChange('plan', e.target.value)}>
            {PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
          </select>
        </div>
        <div style={S.row}>
          <label style={S.label}>Phone (optional)</label>
          <input style={S.input} value={data.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+91 98765 43210" />
        </div>
      </div>
    </>
  );
}

// ── Step 2 — Property ─────────────────────────────────────────────

function Step2({ data, onChange, errors }) {
  const [showOwner, setShowOwner] = useState(false);

  // True when either routing is set to reach the owner
  const needsOwner = data.subscription_notify !== 'manager' || data.monthly_report_notify !== 'manager';
  // Owner section stays open when routing requires it, or user manually opened it
  const isOwnerOpen = showOwner || needsOwner;

  function handleNameChange(val) {
    onChange('property_name', val);
    if (!data._slugEdited) onChange('property_id', slugify(val));
    if (!data._shortEdited) onChange('short_name', val.split(' ')[0]);
  }

  // Auto-open owner section when routing is changed to include owner
  function handleNotifyChange(key, val) {
    onChange(key, val);
    if (val !== 'manager') setShowOwner(true);
  }

  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Property Details</h2>
      <p style={{ fontSize: 13, color: '#56546a', marginBottom: 24 }}>Your property information</p>

      <div style={S.row}>
        <label style={S.label}>Property Name *</label>
        <input style={S.input} value={data.property_name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Niva The Rooted Heaven" />
        {errors.property_name && <div style={S.err}>{errors.property_name}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.row}>
          <label style={S.label}>Property Slug *</label>
          <input style={S.input} value={data.property_id}
            onChange={e => { onChange('property_id', e.target.value); onChange('_slugEdited', true); }}
            placeholder="niva" />
          <div style={S.hint}>Lowercase, no spaces (auto-filled)</div>
          {errors.property_id && <div style={S.err}>{errors.property_id}</div>}
        </div>
        <div style={S.row}>
          <label style={S.label}>Short Name *</label>
          <input style={S.input} value={data.short_name}
            onChange={e => { onChange('short_name', e.target.value); onChange('_shortEdited', true); }}
            placeholder="Niva" />
          <div style={S.hint}>Used in bot replies</div>
          {errors.short_name && <div style={S.err}>{errors.short_name}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.row}>
          <label style={S.label}>Property Type *</label>
          <select style={S.select} value={data.property_type} onChange={e => onChange('property_type', e.target.value)}>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div style={S.row}>
          <label style={S.label}>Notification Channel *</label>
          <select style={S.select} value={data.notification_channel} onChange={e => onChange('notification_channel', e.target.value)}>
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Primary channel — required */}
      {data.notification_channel === 'telegram' ? (
        <div style={S.row}>
          <label style={S.label}>Telegram Chat ID *</label>
          <input style={S.input} value={data.telegram_chat_id} onChange={e => onChange('telegram_chat_id', e.target.value)} placeholder="5953587554" />
          <div style={S.hint}>Send /start to @ChakrioPropertyBot — it will reply with your Chat ID</div>
          {errors.telegram_chat_id && <div style={S.err}>{errors.telegram_chat_id}</div>}
        </div>
      ) : (
        <div style={S.row}>
          <label style={S.label}>Manager WhatsApp Number *</label>
          <input style={S.input} value={data.manager_whatsapp} onChange={e => onChange('manager_whatsapp', e.target.value)} placeholder="919876543210" />
          <div style={S.hint}>Include country code (e.g. 91 for India). Must be on WhatsApp.</div>
          {errors.manager_whatsapp && <div style={S.err}>{errors.manager_whatsapp}</div>}
        </div>
      )}

      {/* Secondary channel — optional, manager gets alerts on both when set */}
      {data.notification_channel === 'telegram' ? (
        <div style={S.row}>
          <label style={S.label}>Also notify via WhatsApp <span style={{ color: '#56546a', fontWeight: 400 }}>(optional)</span></label>
          <input style={S.input} value={data.manager_phone} onChange={e => onChange('manager_phone', e.target.value)} placeholder="919876543210" />
          <div style={S.hint}>If set, manager gets guest alerts on both Telegram AND WhatsApp.</div>
        </div>
      ) : (
        <div style={S.row}>
          <label style={S.label}>Also notify via Telegram <span style={{ color: '#56546a', fontWeight: 400 }}>(optional)</span></label>
          <input style={S.input} value={data.telegram_chat_id} onChange={e => onChange('telegram_chat_id', e.target.value)} placeholder="5953587554" />
          <div style={S.hint}>If set, manager gets guest alerts on both WhatsApp AND Telegram.</div>
        </div>
      )}

      {/* ── Notification routing — always visible, decided during onboarding ── */}
      <div style={{ marginBottom: 18, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Notification Routing</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={S.row}>
            <label style={S.label}>Subscription payment links</label>
            <select style={S.select} value={data.subscription_notify} onChange={e => handleNotifyChange('subscription_notify', e.target.value)}>
              <option value="manager">→ Manager only</option>
              <option value="owner">→ Owner only</option>
              <option value="both">→ Both</option>
            </select>
          </div>
          <div style={S.row}>
            <label style={S.label}>Monthly P&amp;L reports</label>
            <select style={S.select} value={data.monthly_report_notify} onChange={e => handleNotifyChange('monthly_report_notify', e.target.value)}>
              <option value="manager">→ Manager only</option>
              <option value="owner">→ Owner only</option>
              <option value="both">→ Both</option>
            </select>
          </div>
        </div>
        {needsOwner && !data.owner_phone && !data.owner_telegram_chat_id && (
          <div style={{ fontSize: 12, color: '#c8a96e', marginTop: 4 }}>
            ↓ Add owner contact below so we know where to send these.
          </div>
        )}
      </div>

      {/* ── Owner contact — collapsible; auto-opens when owner routing is selected ── */}
      <div style={{ marginTop: 4, marginBottom: 18 }}>
        <button
          type="button"
          onClick={() => setShowOwner(v => !v)}
          style={{ background: 'none', border: `1px solid ${needsOwner ? 'rgba(200,169,110,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: '#8c8a9e', fontSize: 13, cursor: 'pointer', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 11 }}>{isOwnerOpen ? '▲' : '▼'}</span>
          Owner Contact
          {needsOwner
            ? <span style={{ fontSize: 11, color: '#c8a96e' }}>(required for owner routing)</span>
            : <span style={{ fontSize: 11, color: '#56546a' }}>(optional)</span>}
        </button>

        {isOwnerOpen && (
          <div style={{ marginTop: 12, padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
            <div style={S.row}>
              <label style={S.label}>Owner Name(s)</label>
              <input style={S.input} value={data.owner_names_raw} onChange={e => onChange('owner_names_raw', e.target.value)} placeholder="Acharya Ji, Koustubh" />
              <div style={S.hint}>Comma-separated if multiple owners</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={S.row}>
                <label style={S.label}>Owner WhatsApp</label>
                <input style={S.input} value={data.owner_phone} onChange={e => onChange('owner_phone', e.target.value)} placeholder="9660013325" />
              </div>
              <div style={S.row}>
                <label style={S.label}>Owner Telegram Chat ID</label>
                <input style={S.input} value={data.owner_telegram_chat_id} onChange={e => onChange('owner_telegram_chat_id', e.target.value)} placeholder="5953587554" />
              </div>
            </div>
            {errors.owner_contact && <div style={{ ...S.err, marginTop: 4 }}>{errors.owner_contact}</div>}
          </div>
        )}
        {errors.owner_contact && !isOwnerOpen && (
          <div style={{ ...S.err, marginTop: 8 }}>{errors.owner_contact}</div>
        )}
      </div>

      <div style={S.row}>
        <label style={S.label}>Address (optional)</label>
        <input style={S.input} value={data.address} onChange={e => onChange('address', e.target.value)} placeholder="Village Gola, Lansdowne, Uttarakhand" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {data.notification_channel === 'whatsapp' && (
          <div style={S.row}>
            <label style={S.label}>Manager Phone (optional)</label>
            <input style={S.input} value={data.manager_phone} onChange={e => onChange('manager_phone', e.target.value)} placeholder="+91 98765 43210" />
            <div style={S.hint}>Contact number shown to guests (if different from WhatsApp above)</div>
          </div>
        )}
        <div style={S.row}>
          <label style={S.label}>Google Review Link (optional)</label>
          <input style={S.input} value={data.google_review_link} onChange={e => onChange('google_review_link', e.target.value)} placeholder="https://g.page/r/..." />
        </div>
      </div>

      <div style={S.row}>
        <label style={S.label}>UPI ID *</label>
        <input style={S.input} value={data.upi_id} onChange={e => onChange('upi_id', e.target.value)} placeholder="e.g. yourname@upi or yourname@ybl" />
        <div style={S.hint}>Sent to guests for direct advance payments after booking via WhatsApp</div>
        {errors.upi_id && <div style={S.err}>{errors.upi_id}</div>}
      </div>
    </>
  );
}

// ── Step 3 — Rooms ────────────────────────────────────────────────

function Step3({ propData, rooms, setRooms, hasRoomsOverride, setHasRoomsOverride, otaFeeds, setOtaFeeds }) {
  const fileRef = useRef();
  const [csvError, setCsvError]   = useState('');
  const [showOTA, setShowOTA]     = useState(false);
  const isHotelType = HOTEL_TYPES.has(propData.property_type);
  const showRooms   = isHotelType || hasRoomsOverride;

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCSV(ev.target.result);
      if (parsed === null) {
        setCsvError('Invalid CSV — must have a room_no column.');
        return;
      }
      const invalid = parsed.find(r => r.room_type && !ROOM_TYPES.includes(r.room_type));
      if (invalid) {
        setCsvError(`Invalid room_type "${invalid.room_type}" — must be: ${ROOM_TYPES.join(', ')}`);
        return;
      }
      setCsvError('');
      setRooms(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function removeRoom(i) {
    setRooms(prev => prev.filter((_, idx) => idx !== i));
  }

  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Rooms</h2>
      <p style={{ fontSize: 13, color: '#56546a', marginBottom: 24 }}>
        {isHotelType ? 'Upload your room list (required for hotels/resorts/dharamshalas)' : 'Does your property have individual rooms?'}
      </p>

      {!isHotelType && (
        <div style={{ ...S.row, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={hasRoomsOverride} onChange={e => { setHasRoomsOverride(e.target.checked); if (!e.target.checked) setRooms([]); }}
              style={{ width: 16, height: 16, accentColor: '#6C63FF' }} />
            <span style={{ fontSize: 14, color: '#f0eee8' }}>Yes, this property has individual rooms</span>
          </label>
        </div>
      )}

      {showRooms && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button type="button" onClick={downloadCSVTemplate}
              style={{ ...S.btnOut, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}>
              <Download size={14} /> Download Template
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}>
              <Upload size={14} /> Upload CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleCSV} style={{ display: 'none' }} />
          </div>

          {csvError && <div style={{ ...S.err, marginBottom: 12 }}>{csvError}</div>}

          {rooms.length > 0 ? (
            <div style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {['Room No', 'Room Type', 'Beds', ''].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#56546a', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 12px', color: '#f0eee8' }}>{r.room_no}</td>
                      <td style={{ padding: '8px 12px', color: '#8c8a9e' }}>{r.room_type || '—'}</td>
                      <td style={{ padding: '8px 12px', color: '#8c8a9e' }}>{r.beds ?? '—'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <button type="button" onClick={() => removeRoom(i)}
                          style={{ background: 'none', border: 'none', color: '#56546a', cursor: 'pointer', padding: 2 }}>
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '8px 12px', fontSize: 12, color: '#56546a', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {rooms.length} room{rooms.length !== 1 ? 's' : ''} loaded
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#56546a', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
              Upload a CSV to preview rooms here
            </div>
          )}
        </>
      )}

      {!showRooms && !isHotelType && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#56546a', fontSize: 13 }}>
          No rooms — click Next to continue
        </div>
      )}

      {/* OTA iCal feeds */}
      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={() => setShowOTA(v => !v)}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8c8a9e', fontSize: 13, cursor: 'pointer', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 11 }}>{showOTA ? '▲' : '▼'}</span>
          OTA Calendar Links
          <span style={{ fontSize: 11, color: '#56546a' }}>(optional — Airbnb, Booking.com, etc.)</span>
          {otaFeeds.length > 0 && (
            <span style={{ background: '#6C63FF', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 7px', marginLeft: 4 }}>{otaFeeds.length}</span>
          )}
        </button>

        {showOTA && (
          <div style={{ marginTop: 12, padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: '#56546a', margin: '0 0 14px' }}>
              Paste iCal export URLs from your OTAs. Chakrio will sync these calendars every 6 hours so OTA bookings block out dates automatically.
            </p>

            {otaFeeds.map((feed, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                <select
                  value={feed.ota_name}
                  onChange={e => setOtaFeeds(prev => prev.map((f, idx) => idx === i ? { ...f, ota_name: e.target.value } : f))}
                  style={{ ...S.select, width: 150, flexShrink: 0 }}
                >
                  {OTA_NAMES.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                </select>
                <input
                  value={feed.ical_url}
                  onChange={e => setOtaFeeds(prev => prev.map((f, idx) => idx === i ? { ...f, ical_url: e.target.value } : f))}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  style={{ ...S.input, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setOtaFeeds(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', color: '#56546a', cursor: 'pointer', padding: '10px 4px', flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setOtaFeeds(prev => [...prev, { ota_name: 'airbnb', ical_url: '' }])}
              style={{ ...S.btnOut, fontSize: 12, padding: '7px 14px', marginTop: 4 }}
            >
              + Add OTA
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Step 4 — Review ───────────────────────────────────────────────

function Step4({ client, property, rooms, otaFeeds }) {
  const validOta = (otaFeeds || []).filter(f => f.ical_url.trim());
  const rows = [
    ['Owner Name',    client.name],
    ['Email',         client.email],
    ['Plan',          client.plan],
    client.phone ? ['Phone', client.phone] : null,
    ['Property Name', property.property_name],
    ['Slug',          property.property_id],
    ['Type',          property.property_type],
    ['Short Name',    property.short_name],
    ['Channel',       property.notification_channel],
    property.notification_channel === 'telegram' ? ['Telegram Chat ID', property.telegram_chat_id] : ['WhatsApp', property.manager_whatsapp],
    property.notification_channel === 'telegram' && property.manager_phone ? ['Also via WhatsApp', property.manager_phone] : null,
    property.notification_channel === 'whatsapp' && property.telegram_chat_id ? ['Also via Telegram', property.telegram_chat_id] : null,
    property.address ? ['Address', property.address] : null,
    property.manager_phone ? ['Manager Phone', property.manager_phone] : null,
    property.google_review_link ? ['Google Review', property.google_review_link] : null,
    ['UPI ID', property.upi_id],
    property.owner_names_raw ? ['Owner Name(s)', property.owner_names_raw] : null,
    property.owner_phone ? ['Owner WhatsApp', property.owner_phone] : null,
    property.owner_telegram_chat_id ? ['Owner Telegram ID', property.owner_telegram_chat_id] : null,
    ['Subscription links →', property.subscription_notify],
    ['Monthly reports →', property.monthly_report_notify],
    ['Rooms', rooms.length > 0 ? `${rooms.length} rooms` : 'None'],
    validOta.length > 0 ? ['OTA feeds', validOta.map(f => f.ota_name).join(', ')] : null,
  ].filter(Boolean);

  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Review & Submit</h2>
      <p style={{ fontSize: 13, color: '#56546a', marginBottom: 24 }}>Check everything before submitting</p>

      <div style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        {rows.map(([label, value], i) => (
          <div key={i} style={{ display: 'flex', padding: '10px 16px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: 12, color: '#56546a', width: 140, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, color: '#f0eee8', wordBreak: 'break-all' }}>{value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Success screen ────────────────────────────────────────────────

function Success({ email, channel }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <CheckCircle size={32} color="#6C63FF" />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You're all set!</h2>
      <p style={{ fontSize: 14, color: '#8c8a9e', marginBottom: 24, lineHeight: 1.6 }}>
        Your property has been onboarded. Here's what happens next:
      </p>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '16px 20px', textAlign: 'left', fontSize: 13, color: '#8c8a9e', lineHeight: 1.8 }}>
        <div>📧 <strong style={{ color: '#f0eee8' }}>Check {email}</strong> — you'll receive a login link for the Chakrio dashboard</div>
        <div style={{ marginTop: 8 }}>
          {channel === 'telegram'
            ? '💬 Check Telegram — your bot has sent you a welcome message with setup instructions'
            : "💬 Check WhatsApp — you'll receive a welcome message with setup instructions"}
        </div>
        <div style={{ marginTop: 8 }}>📊 Once logged in, you can view bookings, expenses, and reports</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function OnboardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);

  const [client, setClient] = useState({ name: '', plan: 'starter', email: '', phone: '' });
  const [property, setProperty] = useState({
    property_name: '', property_id: '', short_name: '', property_type: 'homestay',
    notification_channel: 'telegram', telegram_chat_id: '', manager_whatsapp: '',
    address: '', manager_phone: '', google_review_link: '', upi_id: '',
    owner_names_raw: '', owner_phone: '', owner_telegram_chat_id: '',
    subscription_notify: 'manager', monthly_report_notify: 'manager',
    _slugEdited: false, _shortEdited: false,
  });
  const [rooms, setRooms]           = useState([]);
  const [hasRoomsOverride, setHasRoomsOverride] = useState(false);
  const [otaFeeds, setOtaFeeds]     = useState([]);
  const [errors, setErrors]         = useState({});

  function updateClient(k, v)   { setClient(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); }
  function updateProperty(k, v) {
    setProperty(p => ({ ...p, [k]: v }));
    // Also clear owner_contact error when any related field is updated
    const clearExtra = (k === 'owner_phone' || k === 'owner_telegram_chat_id') ? { owner_contact: '' } : {};
    setErrors(e => ({ ...e, [k]: '', ...clearExtra }));
  }

  function validateStep(s) {
    const errs = {};
    if (s === 0) {
      if (!client.name.trim())  errs.name  = 'Required';
      if (!client.email.trim()) errs.email = 'Required';
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(client.email)) errs.email = 'Invalid email';
    }
    if (s === 1) {
      if (!property.property_name.trim()) errs.property_name = 'Required';
      if (!property.property_id.trim())   errs.property_id   = 'Required';
      else if (!/^[a-z0-9_]{1,30}$/.test(property.property_id)) errs.property_id = 'Lowercase letters/numbers/underscores only, max 30 chars';
      if (!property.short_name.trim())    errs.short_name    = 'Required';
      if (property.notification_channel === 'telegram' && !property.telegram_chat_id.trim())
        errs.telegram_chat_id = 'Required for Telegram';
      if (property.notification_channel === 'whatsapp' && !property.manager_whatsapp.trim())
        errs.manager_whatsapp = 'Required for WhatsApp';
      if ((property.subscription_notify !== 'manager' || property.monthly_report_notify !== 'manager')
          && !property.owner_phone.trim() && !property.owner_telegram_chat_id.trim())
        errs.owner_contact = 'Owner phone or Telegram ID required when routing to owner';
      if (!property.upi_id.trim())
        errs.upi_id = 'Required — guests cannot pay advances without a UPI ID';
    }
    return errs;
  }

  function next() {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  }

  function back() { setStep(s => s - 1); setErrors({}); }

  async function submit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        client: { name: client.name, plan: client.plan, email: client.email, phone: client.phone },
        property: {
          property_id:            property.property_id,
          property_name:          property.property_name,
          property_type:          property.property_type,
          short_name:             property.short_name,
          notification_channel:   property.notification_channel,
          telegram_chat_id:       property.telegram_chat_id,
          manager_whatsapp:       property.manager_whatsapp,
          address:                property.address,
          manager_phone:          property.manager_phone,
          google_review_link:     property.google_review_link,
          upi_id:                 property.upi_id,
          has_rooms:              HOTEL_TYPES.has(property.property_type) || hasRoomsOverride,
          is_hotel_type:          HOTEL_TYPES.has(property.property_type) || hasRoomsOverride,
          owner_names:            property.owner_names_raw
                                    ? property.owner_names_raw.split(',').map(n => n.trim()).filter(Boolean)
                                    : [],
          owner_phone:            property.owner_phone,
          owner_telegram_chat_id: property.owner_telegram_chat_id,
          subscription_notify:    property.subscription_notify,
          monthly_report_notify:  property.monthly_report_notify,
        },
        rooms,
        ota_feeds: otaFeeds.filter(f => f.ical_url.trim()),
      };
      const res = await fetch('/api/onboard', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onboarding failed.');
      if (window.fbq) window.fbq('track', 'Lead');
      setDone(true);
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={S.page}>
      {/* Logo / branding */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#6C63FF', letterSpacing: '-0.03em', margin: 0 }}>chakrio</h1>
        <div style={{ fontSize: 13, color: '#56546a', marginTop: 4 }}>Property Management Dashboard</div>
      </div>

      <div style={S.card}>
        {done ? (
          <Success email={client.email} channel={property.notification_channel} />
        ) : (
          <>
            <StepBar current={step} />

            {step === 0 && <Step1 data={client}   onChange={updateClient}   errors={errors} />}
            {step === 1 && <Step2 data={property} onChange={updateProperty} errors={errors} />}
            {step === 2 && (
              <Step3
                propData={property}
                rooms={rooms} setRooms={setRooms}
                hasRoomsOverride={hasRoomsOverride} setHasRoomsOverride={setHasRoomsOverride}
                otaFeeds={otaFeeds} setOtaFeeds={setOtaFeeds}
              />
            )}
            {step === 3 && <Step4 client={client} property={property} rooms={rooms} otaFeeds={otaFeeds} />}

            {submitError && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, fontSize: 13, color: '#ff6b6b' }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
              {step > 0
                ? <button type="button" style={{ ...S.btnOut, display: 'flex', alignItems: 'center', gap: 6 }} onClick={back}><ChevronLeft size={16} /> Back</button>
                : <button type="button" style={{ ...S.btnOut, fontSize: 13 }} onClick={() => navigate('/login')}>Already have an account?</button>
              }
              {step < 3
                ? <button type="button" style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: 6 }} onClick={next}>Next <ChevronRight size={16} /></button>
                : <button type="button" style={{ ...S.btn, opacity: submitting ? 0.6 : 1 }} disabled={submitting} onClick={submit}>
                    {submitting ? 'Setting up...' : 'Submit & Go Live'}
                  </button>
              }
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#56546a' }}>
        For help, contact your Chakrio administrator
      </div>
    </div>
  );
}

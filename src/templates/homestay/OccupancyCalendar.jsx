import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSheetData } from '../../hooks/useSheetData';
import { useTabNames } from '../../hooks/useTabNames';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import DemoBanner from '../../components/shared/DemoBanner';
import { formatDate, isDateCol } from '../../utils/formatDate';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const STATUS_COLORS = {
  confirmed: { bg: 'rgba(108,99,255,0.85)', text: '#fff' },
  completed:  { bg: 'rgba(34,197,94,0.75)',  text: '#fff' },
  cancelled:  { bg: 'rgba(239,68,68,0.75)',  text: '#fff' },
  pending:    { bg: 'rgba(234,179,8,0.85)',  text: '#111' },
  'no-show':  { bg: 'rgba(168,85,247,0.75)', text: '#fff' },
};

function statusColor(status) {
  return STATUS_COLORS[(status || '').toLowerCase()] ?? { bg: 'rgba(140,138,158,0.5)', text: '#fff' };
}

function normalise(s) {
  return String(s).toLowerCase().replace(/[\s_\-]/g, '');
}

function findDateCols(data) {
  if (!data?.length) return { checkIn: null, checkOut: null };
  const keys = Object.keys(data[0]);
  const checkIn  = keys.find(k => ['checkin','checkindate','arrival','arrivaldate'].includes(normalise(k)));
  const checkOut = keys.find(k => ['checkout','checkoutdate','departure','departuredate'].includes(normalise(k)));
  return { checkIn, checkOut };
}

function findGuestCol(data) {
  if (!data?.length) return null;
  const keys = Object.keys(data[0]);
  return (
    keys.find(k => normalise(k).startsWith('guest')) ||
    keys.find(k => normalise(k) === 'name') ||
    keys[0]
  );
}

function findStatusCol(data) {
  if (!data?.length) return null;
  return Object.keys(data[0]).find(k => normalise(k).includes('status')) ?? null;
}

function findPhoneCol(data) {
  if (!data?.length) return null;
  return Object.keys(data[0]).find(k =>
    normalise(k).includes('phone') || normalise(k).includes('mobile') || normalise(k) === 'contact'
  ) ?? null;
}

function findRoomCol(data) {
  if (!data?.length) return null;
  return Object.keys(data[0]).find(k =>
    ['roomno','roomnumber','room'].includes(normalise(k))
  ) ?? null;
}

function findBalanceCol(data) {
  if (!data?.length) return null;
  return Object.keys(data[0]).find(k =>
    ['balance','balanceamount','due','balancedue'].includes(normalise(k))
  ) ?? null;
}

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  if (!isNaN(d)) { d.setHours(0, 0, 0, 0); return d; }
  return null;
}

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OccupancyCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected,  setSelected]  = useState(null);
  const [dayDetail, setDayDetail] = useState(null); // { dateKey, bookings[] }

  const { bookingsTab } = useTabNames();
  const { data, loading, error, refetch } = useSheetData(bookingsTab);

  function getPhone(bk) {
    return cols.phoneCol ? bk[cols.phoneCol] : '';
  }

  // Build a map: 'YYYY-MM-DD' → [booking rows]
  const { byDay, cols } = useMemo(() => {
    if (!data?.length) return { byDay: {}, cols: {} };

    const { checkIn, checkOut } = findDateCols(data);
    const guestCol   = findGuestCol(data);
    const statusCol  = findStatusCol(data);
    const phoneCol   = findPhoneCol(data);
    const roomCol    = findRoomCol(data);
    const balanceCol = findBalanceCol(data);

    if (!checkIn || !checkOut) return { byDay: {}, cols: { guestCol, statusCol, phoneCol, roomCol, balanceCol } };

    const map = {};
    data.forEach((row, idx) => {
      const ci = parseDate(row[checkIn]);
      const co = parseDate(row[checkOut]);
      if (!ci || !co || co <= ci) return;

      const cur = new Date(ci);
      while (cur < co) {
        const key = toKey(cur);
        (map[key] = map[key] || []).push({ ...row, _idx: idx, _ci: ci, _co: co });
        cur.setDate(cur.getDate() + 1);
      }
    });

    return { byDay: map, cols: { checkIn, checkOut, guestCol, statusCol, phoneCol, roomCol, balanceCol } };
  }, [data]);

  // Month-level stats
  const monthBookings = useMemo(() => {
    if (!data?.length || !cols.checkIn || !cols.checkOut) return 0;
    const start = new Date(viewYear, viewMonth, 1);
    const end   = new Date(viewYear, viewMonth + 1, 0);
    end.setHours(23, 59, 59);
    return data.filter(row => {
      const ci = parseDate(row[cols.checkIn]);
      const co = parseDate(row[cols.checkOut]);
      return ci && co && ci <= end && co >= start;
    }).length;
  }, [data, cols, viewYear, viewMonth]);

  // Navigation
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();

  function openSelected(bk) {
    setDayDetail(null);
    setSelected(bk);
  }

  function closeSelected() {
    setSelected(null);
  }

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  );

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-sm" style={{ color: '#56546a' }}>
      <p>Failed to load bookings.</p>
      <button
        onClick={refetch}
        style={{ background: 'linear-gradient(135deg,#7c6af5,#a896f8)', color: '#fff', padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
      >
        Retry
      </button>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DemoBanner />
      <div className="flex-1 overflow-auto p-6">

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f0eee8', letterSpacing: '-0.02em', margin: 0 }}>
              Occupancy Calendar
            </h2>
            <p style={{ fontSize: '13px', color: '#56546a', marginTop: '4px' }}>
              Click a booking chip or date to see all bookings for that day
            </p>
          </div>

          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={prevMonth} style={navBtn}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f0eee8', minWidth: '168px', textAlign: 'center' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} style={navBtn}><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_COLORS).map(([status, col]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: col.bg, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#8c8a9e', textTransform: 'capitalize' }}>{status}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ background: '#16151f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>

          {/* Day-of-week header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {DAY_LABELS.map(d => (
              <div key={d} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#56546a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {/* Leading empty cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e${i}`} style={emptyCell} />
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day      = i + 1;
              const dateKey  = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const bookings = byDay[dateKey] || [];
              const isToday  = toKey(today) === dateKey;

              return (
                <div
                  key={day}
                  style={{
                    minHeight: '88px',
                    padding: '8px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: isToday ? 'rgba(108,99,255,0.07)' : 'transparent',
                    verticalAlign: 'top',
                  }}
                >
                  {/* Day number — clickable when bookings exist */}
                  <span
                    onClick={() => bookings.length && setDayDetail({ dateKey, bookings })}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '24px', height: '24px', borderRadius: '50%', fontSize: '13px',
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? '#fff' : (bookings.length ? '#c4c2d4' : '#56546a'),
                      background: isToday ? '#6C63FF' : 'transparent',
                      cursor: bookings.length ? 'pointer' : 'default',
                    }}
                  >
                    {day}
                  </span>

                  {/* Booking chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                    {bookings.slice(0, 3).map((bk, bi) => {
                      const status = cols.statusCol ? bk[cols.statusCol] : '';
                      const guest  = cols.guestCol  ? bk[cols.guestCol]  : 'Guest';
                      const room   = cols.roomCol   ? bk[cols.roomCol]   : '';
                      const phone  = getPhone(bk);
                      const { bg, text } = statusColor(status);
                      const label  = room ? `Rm ${room} · ${guest}` : guest;
                      return (
                        <div
                          key={bi}
                          onClick={() => openSelected(bk)}
                          title={phone ? `${label} · ${phone}` : label}
                          style={{
                            background: bg, color: text,
                            fontSize: '11px', fontWeight: 500,
                            padding: '2px 6px', borderRadius: '3px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            lineHeight: '1.4', transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                          {phone && (
                            <div style={{ fontSize: '10px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {phone}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {bookings.length > 3 && (
                      <span
                        onClick={() => setDayDetail({ dateKey, bookings })}
                        style={{ fontSize: '10px', color: '#7c6af5', paddingLeft: '4px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        +{bookings.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '20px' }}>
          {[
            { label: 'Total Bookings', value: data.length },
            { label: `${MONTH_NAMES[viewMonth].slice(0,3)} Bookings`, value: monthBookings },
            { label: 'Confirmed', value: data.filter(r => (r[cols.statusCol] || '').toLowerCase() === 'confirmed').length },
            { label: 'Completed', value: data.filter(r => (r[cols.statusCol] || '').toLowerCase() === 'completed').length },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#16151f', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f0eee8' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#56546a', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Day Detail Modal — all bookings for a clicked day                   */}
      {/* ------------------------------------------------------------------- */}
      {dayDetail && (
        <div
          onClick={() => setDayDetail(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#16151f', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '720px', padding: '24px', position: 'relative', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}
          >
            <button
              onClick={() => setDayDetail(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#8c8a9e', display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0eee8', marginBottom: '2px' }}>
              {dayDetail.dateKey}
            </h3>
            <p style={{ fontSize: '12px', color: '#56546a', marginBottom: '16px' }}>
              {dayDetail.bookings.length} booking{dayDetail.bookings.length !== 1 ? 's' : ''} · click a row to see full details
            </p>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#16151f', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {cols.roomCol    && <th style={thStyle}>Room</th>}
                    <th style={thStyle}>Guest</th>
                    {cols.phoneCol   && <th style={thStyle}>Phone</th>}
                    <th style={thStyle}>Check-in</th>
                    <th style={thStyle}>Check-out</th>
                    <th style={thStyle}>Status</th>
                    {cols.balanceCol && <th style={thStyle}>Balance</th>}
                  </tr>
                </thead>
                <tbody>
                  {dayDetail.bookings.map((bk, i) => {
                    const status = cols.statusCol ? bk[cols.statusCol] : '';
                    const phone  = getPhone(bk);
                    const { bg, text } = statusColor(status);
                    return (
                      <tr
                        key={i}
                        onClick={() => openSelected(bk)}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {cols.roomCol && (
                          <td style={{ ...tdStyle, fontWeight: 600, color: '#c4c2d4' }}>
                            {bk[cols.roomCol] || '—'}
                          </td>
                        )}
                        <td style={{ ...tdStyle, color: '#f0eee8', fontWeight: 500 }}>
                          {cols.guestCol ? bk[cols.guestCol] : '—'}
                        </td>
                        {cols.phoneCol && (
                          <td style={tdStyle}>
                            {phone || <span style={{ color: '#56546a' }}>—</span>}
                          </td>
                        )}
                        <td style={tdStyle}>{cols.checkIn  ? formatDate(bk[cols.checkIn])  : '—'}</td>
                        <td style={tdStyle}>{cols.checkOut ? formatDate(bk[cols.checkOut]) : '—'}</td>
                        <td style={tdStyle}>
                          <span style={{ background: bg, color: text, fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                            {status || '—'}
                          </span>
                        </td>
                        {cols.balanceCol && (
                          <td style={{ ...tdStyle, color: '#f0eee8' }}>
                            ₹{bk[cols.balanceCol] || 0}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Booking detail modal                                                 */}
      {/* ------------------------------------------------------------------- */}
      {selected && (
        <div
          onClick={closeSelected}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#16151f', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '440px', padding: '24px', position: 'relative', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <button
              onClick={closeSelected}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#8c8a9e', display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0eee8', marginBottom: '20px' }}>
              Booking Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(selected)
                .filter(([k, v]) => !k.startsWith('_') && v !== undefined && v !== '')
                .map(([k, v]) => {
                  const isStatus = k.toLowerCase().includes('status');
                  const isDate   = isDateCol(k);
                  const { bg, text } = isStatus ? statusColor(v) : {};

                  return (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '12px', color: '#56546a', flexShrink: 0, paddingTop: '2px' }}>{k}</span>
                      {isStatus ? (
                        <span style={{ background: bg, color: text, fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>{v}</span>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#f0eee8', fontWeight: 500, textAlign: 'right' }}>
                          {isDate ? formatDate(v) : String(v)}
                        </span>
                      )}
                    </div>
                  );
                })}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const navBtn = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '8px',
  cursor: 'pointer',
  color: '#8c8a9e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const emptyCell = {
  minHeight: '88px',
  borderTop: '1px solid rgba(255,255,255,0.05)',
};

const thStyle = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: '11px',
  color: '#56546a',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle = {
  padding: '10px 12px',
  color: '#8c8a9e',
  verticalAlign: 'middle',
};
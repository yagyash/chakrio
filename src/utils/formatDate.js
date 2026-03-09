const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Convert any date string to "27 Feb 2026" format */
export function formatDate(val) {
  if (!val) return '';
  const s = String(val).trim();
  // ISO with or without time: "2026-02-27" or "2026-02-27T19:14:11.181+05:30"
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${parseInt(m[3])} ${MONTHS[parseInt(m[2]) - 1]} ${m[1]}`;
  // DD/MM/YYYY
  const d = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (d) return `${parseInt(d[1])} ${MONTHS[parseInt(d[2]) - 1]} ${d[3]}`;
  // Already word-based (e.g. "27 Feb 2026") — return as-is
  if (/^[A-Za-z0-9]/.test(s)) return s;
  return s;
}

/** Returns true if this column name looks like a date field (check-in, check-out, date, etc.) */
export function isDateCol(col) {
  const c = col.toLowerCase().replace(/[_\s-]/g, '');
  return [
    'checkin', 'checkout', 'date', 'bookingdate', 'arrivaldate',
    'departuredate', 'checkindatetime', 'checkoutdatetime',
  ].some((k) => c.includes(k));
}

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList,
  PieChart, Pie, Cell, Label, ResponsiveContainer,
} from 'recharts';
import { useSheetData } from '../../hooks/useSheetData';
import { useTabNames } from '../../hooks/useTabNames';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import DemoBanner from '../../components/shared/DemoBanner';
import GenericTable from '../../components/shared/GenericTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate, isDateCol } from '../../utils/formatDate';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const BAR_COLORS = ['#7c6af5', '#4ecdc4', '#e8a86a', '#f87171', '#a896f8'];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function formatMonthLabel(val) {
  if (!val) return String(val ?? '');
  const s = String(val).trim();
  if (/^[A-Za-z]/.test(s)) return s;
  let m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return `${MONTH_NAMES[parseInt(m[2], 10) - 1] ?? m[2]} ${m[1]}`;
  m = s.match(/^(\d{1,2})\/*(\d{4})$/);
  if (m) return `${MONTH_NAMES[parseInt(m[1], 10) - 1] ?? m[1]} ${m[2]}`;
  return s;
}

/** Human-friendly label overrides for common sheet column names */
const LABEL_MAP = {
  total_amount:    'Total Amount',
  advance_amount:  'Advance Paid',
  balance_amount:  'Balance Due',
  booking_amount:  'Booking Amount',
  paid_amount:     'Amount Paid',
  pending_amount:  'Amount Pending',
  room_rate:       'Room Rate',
  no_of_nights:    'No. of Nights',
  num_nights:      'Nights',
  no_of_guests:    'Guests',
  num_guests:      'Guests',
  total_nights:    'Total Nights',
  total_guests:    'Total Guests',
  net_profit:      'Net Profit',
  gross_revenue:   'Gross Revenue',
  total_revenue:   'Total Revenue',
  total_expense:   'Total Expenses',
  total_expenses:  'Total Expenses',
};

/** Replace underscores/hyphens with spaces and title-case each word.
 *  Uses LABEL_MAP for well-known column names first. */
function formatColumnLabel(col) {
  const key = String(col).toLowerCase().replace(/\s+/g, '_');
  if (LABEL_MAP[key]) return LABEL_MAP[key];
  return col.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Returns true if the column is a count (nights, guests, days…) not a currency amount */
const COUNT_KEYWORDS = ['night', 'guest', 'day', 'count', 'qty', 'quantity', 'num', 'pax', 'person', 'people'];
function isCountCol(col) {
  const c = String(col).toLowerCase().replace(/[_\s-]/g, '');
  return COUNT_KEYWORDS.some((kw) => c.includes(kw));
}

/** Returns true if the column is an identifier/reference number that should not be summed */
const ID_KEYWORDS = ['room_no', 'roomno', 'room_number', 'roomnumber', '_id', 'booking_id', 'bookingid', 'invoice_no', 'ref'];
function isIdCol(col) {
  const c = String(col).toLowerCase().replace(/[\s-]/g, '_');
  return ID_KEYWORDS.some((kw) => c === kw || c.endsWith(kw));
}

/** Format a chart value — ₹ for amounts, plain for counts */
function fmtVal(col, v) {
  return isCountCol(col) ? fmt(v) : `₹${fmt(v)}`;
}

/** Format a short bar-top label — ₹Xk for amounts, X for counts */
function fmtShort(col, v) {
  if (!v || v === 0) return '';
  return isCountCol(col) ? String(v) : `₹${(v / 1000).toFixed(1)}k`;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function numericCols(data) {
  if (!data.length) return [];
  return Object.keys(data[0]).filter((col) => {
    const vals = data.map((r) => r[col]).filter((v) => v !== '' && v !== undefined);
    return vals.length > 0 && vals.every((v) => !isNaN(Number(v)) && isFinite(Number(v)));
  });
}

function detectDateCol(data) {
  if (!data.length) return null;
  // Prefer column whose NAME is a recognised date column (avoids matching IDs with embedded dates)
  const byName = Object.keys(data[0]).find((col) => isDateCol(col));
  if (byName) return byName;
  // Fallback: value-pattern detection
  const dateRe = /(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})/;
  return Object.keys(data[0]).find((col) => {
    const sample = data.slice(0, 20).map((r) => r[col]).filter(Boolean);
    return sample.length > 0 && sample.filter((v) => dateRe.test(String(v))).length >= sample.length * 0.6;
  }) ?? null;
}

/** Find the booking status column by keyword matching on column name */
function detectStatusCol(data) {
  if (!data.length) return null;
  const keywords = ['status', 'state', 'booking status', 'confirmation', 'booking state'];
  return Object.keys(data[0]).find((col) =>
    keywords.some((kw) => col.toLowerCase().includes(kw))
  ) ?? null;
}

/** Map a status value to a fixed color for consistent visual meaning */
function statusColor(value) {
  const v = String(value).toLowerCase();
  if (/confirm|approved|active/.test(v))          return '#6C63FF'; // violet
  if (/complet|checked.?out|done|finish/.test(v)) return '#3b82f6'; // blue
  if (/cancel|reject|declined|denied/.test(v))    return '#f87171'; // red
  if (/pending|hold|waiting|tentative/.test(v))   return '#f59e0b'; // amber
  if (/no.?show/.test(v))                          return '#8b5cf6'; // purple
  return '#94a3b8'; // gray fallback
}

function toYearMonth(val) {
  if (!val) return null;
  const s = String(val).trim();
  let m = s.match(/^(\d{4})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}`;
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}`; // DD/MM/YYYY
  return null;
}

function groupByMonth(data, dateCol, valueCols) {
  const map = {};
  data.forEach((row) => {
    const ym = toYearMonth(row[dateCol]);
    if (!ym) return;
    if (!map[ym]) {
      map[ym] = { label: ym };
      valueCols.forEach((c) => { map[ym][c] = 0; });
    }
    valueCols.forEach((c) => { map[ym][c] += Number(row[c] || 0); });
  });
  return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
}

/** Keep only rows in the current month or future. Rows with no detectable date pass through. */
function filterCurrentAndFuture(data, currentYM) {
  const dc = detectDateCol(data);
  if (!dc) return data; // can't filter — show all
  return data.filter((row) => {
    const ym = toYearMonth(row[dc]);
    return !ym || ym >= currentYM; // no date → include; past → exclude
  });
}

/** Keep only rows in the current month. Rows with no detectable date pass through. */
function filterCurrentMonth(data, currentYM) {
  const dc = detectDateCol(data);
  if (!dc) return data;
  return data.filter((row) => {
    const ym = toYearMonth(row[dc]);
    return !ym || ym === currentYM;
  });
}

/** YYYY-MM for today */
function getCurrentYM() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function HomestayDashboard() {
  const { bookingsTab, expensesTab } = useTabNames();
  const { data: bookings, loading: bLoading, error: bError } = useSheetData(bookingsTab);
  const { data: expenses, loading: eLoading }                = useSheetData(expensesTab);

  const currentYM = useMemo(() => getCurrentYM(), []);

  // ── filter to current month + future ─────────────────────────────────────
  const activeBookings = useMemo(
    () => filterCurrentAndFuture(bookings, currentYM),
    [bookings, currentYM],
  );
  const activeExpenses = useMemo(
    () => filterCurrentMonth(expenses, currentYM),
    [expenses, currentYM],
  );

  // ── stat card totals ──────────────────────────────────────────────────────
  const bookingTotals = useMemo(() => {
    const cols = numericCols(activeBookings).filter((col) => !isIdCol(col));
    return cols.map((col) => ({
      label: col,
      value: activeBookings.reduce((s, r) => s + Number(r[col] || 0), 0),
    }));
  }, [activeBookings]);

  const expenseTotals = useMemo(() => {
    const cols = numericCols(activeExpenses);
    return cols.map((col) => ({
      label: col,
      value: activeExpenses.reduce((s, r) => s + Number(r[col] || 0), 0),
    }));
  }, [activeExpenses]);

  // ── net profit = primary booking revenue col − primary expense amount col ──
  const netProfit = useMemo(() => {
    const pickCol = (data, keywords) => {
      const cols = numericCols(data);
      for (const kw of keywords) {
        const c = cols.find((col) => col.toLowerCase().replace(/\s+/g, '_').includes(kw));
        if (c) return c;
      }
      return cols[0] ?? null;
    };
    const revCol  = pickCol(activeBookings, ['total_amount', 'booking_amount', 'total', 'revenue', 'amount']);
    const expCol  = pickCol(activeExpenses,  ['amount', 'total', 'expense']);
    const revenue = revCol ? activeBookings.reduce((s, r) => s + Number(r[revCol] || 0), 0) : 0;
    const expense = expCol ? activeExpenses.reduce((s,  r) => s + Number(r[expCol]  || 0), 0) : 0;
    return revenue - expense;
  }, [activeBookings, activeExpenses]);

  // ── time-series chart ─────────────────────────────────────────────────────
  const { dateCol, numCols: bookingNumCols, trendData } = useMemo(() => {
    const dc   = detectDateCol(activeBookings);
    const nums = numericCols(activeBookings).filter((col) => !isIdCol(col));
    if (!dc || !nums.length) return { dateCol: null, numCols: [], trendData: [] };
    const currentYear = String(new Date().getFullYear());
    const grouped = groupByMonth(activeBookings, dc, nums);
    const trendData = grouped.filter((row) => row.label.startsWith(currentYear));
    return { dateCol: dc, numCols: nums, trendData };
  }, [activeBookings]);

  // Exclude count columns (nights, guests, days…) from chart — amounts only
  const displayCols = useMemo(
    () => bookingNumCols.filter((col) => !isCountCol(col)),
    [bookingNumCols],
  );

  // ── booking status donut ──────────────────────────────────────────────────
  const { statusCol, statusData } = useMemo(() => {
    const sc = detectStatusCol(activeBookings);
    if (!sc) return { statusCol: null, statusData: [] };
    const counts = {};
    activeBookings.forEach((r) => {
      const v = r[sc] || '(empty)';
      counts[v] = (counts[v] ?? 0) + 1;
    });
    return {
      statusCol: sc,
      statusData: Object.entries(counts).map(([name, value]) => ({ name, value })),
    };
  }, [activeBookings]);

  // ── confirmed bookings only (excludes cancelled / completed) ─────────────
  const confirmedBookings = useMemo(() => {
    if (!statusCol) return activeBookings; // no status col — show all
    return activeBookings.filter((r) => {
      const v = String(r[statusCol] || '').toLowerCase();
      return /confirm|approved|active/.test(v);
    });
  }, [activeBookings, statusCol]);

  // ── upcoming entries (sorted soonest first) ───────────────────────────────
  const upcoming = useMemo(() => activeBookings.slice(0, 10), [activeBookings]);

  // ── row color by booking status ───────────────────────────────────────────
  const getRowClassName = useMemo(() => {
    if (!statusCol) return undefined;
    return (row) => {
      const v = String(row[statusCol] || '').toLowerCase();
      if (/confirm|approved|active/.test(v))
        return 'row-confirmed table-row-hover';
      if (/cancel|reject|declined|denied/.test(v))
        return 'row-cancelled table-row-hover';
      if (/complet|checked.?out|done|finish/.test(v))
        return 'row-completed table-row-hover';
      return 'table-row-hover';
    };
  }, [statusCol]);

  // ── format cells in upcoming bookings table ───────────────────────────────
  const upcomingFormatCell = useMemo(() => (col, val) => {
    if (!val && val !== 0) return val;
    const c = col.toLowerCase().replace(/[\s_-]/g, '');
    if (statusCol && c === statusCol.toLowerCase().replace(/[\s_-]/g, '')) return <StatusBadge value={val} />;
    if (isDateCol(col)) return formatDate(val);
    if (c.includes('id') || c.includes('bookingid')) {
      return <span style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#56546a', letterSpacing: '0.3px' }}>{val}</span>;
    }
    if (c.includes('guest') || c.includes('name') || c.includes('customer')) {
      return <span style={{ fontWeight: 600, color: '#f0eee8', fontSize: '14px' }}>{val}</span>;
    }
    if (c.includes('total') || c.includes('bookingamount')) {
      return <span style={{ fontWeight: 600, color: '#f0eee8' }}>{val}</span>;
    }
    if (c.includes('balance') || c.includes('balancedue') || c.includes('pending')) {
      return <span style={{ color: '#e8a86a', fontWeight: 500 }}>{val}</span>;
    }
    if (c.includes('advance') || c.includes('paid')) {
      return <span style={{ color: '#8c8a9e' }}>{val}</span>;
    }
    return val;
  }, [statusCol]);

  // ── render ────────────────────────────────────────────────────────────────
  if (bLoading || eLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (bError) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-sm" style={{ color: '#56546a' }}>
        Failed to load data.{' '}
        <button className="ml-2 underline" style={{ color: '#c8a96e' }} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DemoBanner />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* ── Filter badge ────────────────────────────────────────────────── */}
        <div className="animate-fade-in flex items-center gap-2 flex-wrap">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            background: 'rgba(124,106,245,0.12)',
            border: '1px solid rgba(124,106,245,0.2)',
            fontSize: '12px', fontWeight: 500, color: '#a896f8',
          }}>
            <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Showing {currentYM} onwards
          </span>
          <span style={{ fontSize: '12px', color: '#56546a' }}>
            Past months are hidden — view full history in Bookings / Expenses tabs
          </span>
        </div>

        {/* ── Row count cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="animate-fade-in-up stagger-1">
            <CountCard
              count={confirmedBookings.length}
              label={`Confirmed bookings in ${bookingsTab}`}
              color="emerald"
            />
          </div>
          <div className="animate-fade-in-up stagger-2">
            <CountCard
              count={activeExpenses.length}
              label={`Active expenses in ${expensesTab}`}
              color="rose"
            />
          </div>
          <div className="animate-fade-in-up stagger-3">
            <NetProfitCard value={netProfit} />
          </div>
        </div>

        {/* ── Numeric column totals — bookings ────────────────────────────── */}
        {bookingTotals.length > 0 && (
          <div className="animate-fade-in-up stagger-3">
            <Section label={`${bookingsTab} — current & upcoming totals`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {bookingTotals.map(({ label, value }, i) => (
                  <MiniCard key={label} label={formatColumnLabel(label)} value={fmt(value)} delay={i} />
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── Numeric column totals — expenses ────────────────────────────── */}
        {expenseTotals.length > 0 && (
          <div className="animate-fade-in-up stagger-4">
            <Section label={`${expensesTab} — current month totals`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {expenseTotals.map(({ label, value }, i) => (
                  <MiniCard key={label} label={formatColumnLabel(label)} value={fmt(value)} delay={i} />
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── Charts row ──────────────────────────────────────────────────── */}
        {(trendData.length > 0 || statusCol) && (
          <div className={`grid gap-4 animate-fade-in-up stagger-5 ${trendData.length && statusCol ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

            {/* Monthly trend bar chart */}
            {trendData.length > 0 && (
              <div style={{ background: '#16151f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }} className="card-hover">
                <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#f0eee8', margin: '0 0 4px' }}>
                  Monthly trend — {bookingsTab}
                </h2>
                <p style={{ fontSize: '12px', color: '#56546a', margin: '0 0 16px' }}>
                  Grouped by <span style={{ fontWeight: 500, color: '#8c8a9e' }}>{dateCol}</span>
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={trendData} barGap={4} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={formatMonthLabel} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#8c8a9e' }} formatter={(value) => formatColumnLabel(value)} />
                    {displayCols.map((col, i) => (
                      <Bar key={col} dataKey={col} fill={BAR_COLORS[i % BAR_COLORS.length]} radius={[4, 4, 0, 0]}>
                        <LabelList dataKey={col} position="top"
                          formatter={(v) => fmtShort(col, v)}
                          style={{ fontSize: 9, fill: '#56546a' }} />
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Booking status donut */}
            <div style={{ background: '#16151f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }} className="card-hover">
              <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#f0eee8', margin: '0 0 4px' }}>Booking Status</h2>
              {statusCol ? (
                <>
                  <p style={{ fontSize: '12px', color: '#56546a', margin: '0 0 16px' }}>
                    From <span style={{ fontWeight: 500, color: '#8c8a9e' }}>"{statusCol}"</span> column
                  </p>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {statusData.map(({ name, value }) => (
                      <span
                        key={name}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '2px 8px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: 500,
                          background: `${statusColor(name)}20`, color: statusColor(name),
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor(name), display: 'inline-block' }} />
                        {name} ({value})
                      </span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map(({ name }) => (
                          <Cell key={name} fill={statusColor(name)} />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            const { cx, cy } = viewBox;
                            const total = statusData.reduce((s, d) => s + d.value, 0);
                            return (
                              <g>
                                <text x={cx} y={cy - 4} textAnchor="middle" fill="#f0eee8" style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px' }}>
                                  {total}
                                </text>
                                <text x={cx} y={cy + 18} textAnchor="middle" fill="#56546a" style={{ fontSize: '11px' }}>
                                  bookings
                                </text>
                              </g>
                            );
                          }}
                        />
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  marginTop: '12px', padding: '12px',
                  background: 'rgba(232,168,106,0.08)', border: '1px solid rgba(232,168,106,0.15)',
                  borderRadius: '8px',
                }}>
                  <svg style={{ width: '14px', height: '14px', color: '#e8a86a', marginTop: '2px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ fontSize: '12px', color: '#e8a86a', margin: 0 }}>
                    Add a column named <strong>"Status"</strong> to your {bookingsTab} tab with values like
                    Confirmed, Cancelled, Completed, Pending.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Upcoming entries ─────────────────────────────────────────────── */}
        <div className="animate-fade-in-up stagger-6">
          <Section label={`Upcoming — ${bookingsTab}`}>
            <GenericTable
              data={upcoming}
              getRowClassName={getRowClassName}
              formatCell={upcomingFormatCell}
              formatHeader={formatColumnLabel}
              hideCols={['created_at', 'updated_at', 'createdat', 'updatedat']}
            />
          </Section>
        </div>

      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }) {
  return (
    <div>
      <h2 style={{ fontSize: '11px', fontWeight: 600, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '12px' }}>{label}</h2>
      {children}
    </div>
  );
}

function CountCard({ count, label, color }) {
  const colors = {
    emerald: { bg: 'rgba(124,106,245,0.12)', text: '#a896f8', badge: { bg: 'rgba(92,184,138,0.1)', color: '#5cb88a' }, badgeText: `↑ ${count} active` },
    rose:    { bg: 'rgba(224,112,112,0.12)', text: '#e07070', badge: { bg: 'rgba(224,112,112,0.1)', color: '#e07070' }, badgeText: `↓ ${count} item${count !== 1 ? 's' : ''}` },
  };
  const { bg, text, badge, badgeText } = colors[color] ?? colors.emerald;
  return (
    <div style={{ background: '#16151f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }} className="card-hover cursor-default">
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <TableIcon style={{ width: '20px', height: '20px' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', fontWeight: 400, letterSpacing: '-1px', color: '#f0eee8', margin: 0, lineHeight: 1 }}>{count}</p>
          <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>{badgeText}</span>
        </div>
        <p style={{ fontSize: '11px', color: '#56546a', margin: '6px 0 0' }}>{label}</p>
      </div>
    </div>
  );
}

function NetProfitCard({ value }) {
  const positive = value >= 0;
  return (
    <div style={{ background: '#16151f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }} className="card-hover cursor-default">
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: positive ? 'rgba(124,106,245,0.12)' : 'rgba(224,112,112,0.12)' }}>
        <svg style={{ width: '20px', height: '20px', color: positive ? '#a896f8' : '#e07070' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d={positive
              ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
              : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'} />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', fontWeight: 400, letterSpacing: '-1px', color: positive ? '#c8a96e' : '#e07070', margin: 0, lineHeight: 1 }}>
            {positive ? '+' : '−'} ₹{fmt(Math.abs(value))}
          </p>
          <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', background: 'rgba(92,184,138,0.1)', color: '#5cb88a', whiteSpace: 'nowrap' }}>
            {positive ? '↑ this period' : '↓ this period'}
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#56546a', margin: '6px 0 0' }}>Net Profit (current &amp; upcoming)</p>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0d0d14',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 20px 40px -8px rgba(0,0,0,0.55)',
      minWidth: 150,
    }}>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {formatMonthLabel(label)}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: entry.fill, flexShrink: 0, boxShadow: `0 0 6px ${entry.fill}80` }} />
          <span style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>{formatColumnLabel(entry.dataKey)}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            {fmtVal(entry.dataKey, entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  const color = p?.fill ?? statusColor(name);
  return (
    <div style={{
      background: '#0d0d14',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 20px 40px -8px rgba(0,0,0,0.55)',
      minWidth: 140,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}90` }} />
        <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>{name}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{value}</span>
      </div>
    </div>
  );
}

const STAGGER_CLASSES = ['stagger-1','stagger-2','stagger-3','stagger-4','stagger-5','stagger-6','stagger-7','stagger-8'];

function MiniCard({ label, value, delay = 0 }) {
  const isBalance = label.toLowerCase().includes('balance');
  return (
    <div
      className={`cursor-default animate-fade-in-up ${STAGGER_CLASSES[delay % STAGGER_CLASSES.length]}`}
      style={{ background: '#16151f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', padding: '18px 20px', transition: 'border-color 0.2s ease' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
    >
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, letterSpacing: '-0.5px', color: isBalance ? '#e8a86a' : '#f0eee8', margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#56546a', margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>{label}</p>
    </div>
  );
}

const TableIcon = ({ style }) => (
  <svg style={style ?? { width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 10h18M3 6h18M3 14h18M3 18h18" />
  </svg>
);

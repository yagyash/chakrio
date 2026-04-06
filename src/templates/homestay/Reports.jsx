import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LabelList,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSheetData } from '../../hooks/useSheetData';
import { useTabNames } from '../../hooks/useTabNames';
import { useAuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import DemoBanner from '../../components/shared/DemoBanner';
import GenericTable from '../../components/shared/GenericTable';
import { downloadCSV } from '../../utils/downloadCSV';

const fmt   = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtPc = (n) => `${Number(n || 0).toFixed(1)}%`;

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/**
 * Converts raw month values from the sheet into a readable label.
 * Handles: "3/2026", "3//2026", "03/2026", "2026-03", "March 2026", etc.
 */
function formatMonthLabel(val) {
  if (!val) return String(val);
  const s = String(val).trim();
  // Already a word-based label e.g. "March 2026"
  if (/^[A-Za-z]/.test(s)) return s;
  // YYYY-MM  →  March 2026
  let m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return `${MONTH_NAMES[parseInt(m[2], 10) - 1] ?? m[2]} ${m[1]}`;
  // M/YYYY or M//YYYY or MM/YYYY  →  March 2026
  m = s.match(/^(\d{1,2})\/*(\d{4})$/);
  if (m) return `${MONTH_NAMES[parseInt(m[1], 10) - 1] ?? m[1]} ${m[2]}`;
  return s;
}

// ── column detection helpers ──────────────────────────────────────────────────

/** Find first column whose name contains any of the given keywords (case-insensitive) */
function findCol(cols, keywords) {
  return cols.find((c) =>
    keywords.some((kw) => c.toLowerCase().includes(kw.toLowerCase()))
  ) ?? null;
}

/** Columns where every non-empty cell is a finite number */
function numericCols(data) {
  if (!data.length) return [];
  return Object.keys(data[0]).filter((col) => {
    const vals = data.map((r) => r[col]).filter((v) => v !== '' && v !== undefined);
    return vals.length > 0 && vals.every((v) => !isNaN(Number(v)) && isFinite(Number(v)));
  });
}

/** First non-numeric column — used as X-axis label (month / period) */
function detectLabelCol(data, numCols) {
  if (!data.length) return null;
  const numSet = new Set(numCols);
  return Object.keys(data[0]).find((c) => !numSet.has(c)) ?? null;
}

/** Normalise any date string to YYYY-MM */
function toYearMonth(val) {
  const s = String(val ?? '').trim();
  // YYYY-MM or YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}`;
  // DD/MM/YYYY
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}`;
  // M/YYYY or M//YYYY — n8n Summary tab format e.g. "3//2026"
  m = s.match(/^(\d{1,2})\/*(\d{4})$/);
  if (m) return `${m[2]}-${String(m[1]).padStart(2, '0')}`;
  // "March 2026" or "Mar 2026"
  m = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const idx = MONTH_NAMES.findIndex(
      (n) => n.toLowerCase().startsWith(m[1].toLowerCase().slice(0, 3))
    );
    if (idx >= 0) return `${m[2]}-${String(idx + 1).padStart(2, '0')}`;
  }
  return null;
}

/** Days in a YYYY-MM month string */
function daysInMonth(ym) {
  const [y, mo] = ym.split('-').map(Number);
  return new Date(y, mo, 0).getDate();
}

// ── occupancy from bookings tab ───────────────────────────────────────────────

/**
 * @param {Array}       bookings   - raw booking rows
 * @param {number|null} totalRooms - from Firestore property config
 *   null  → villa formula:  nights_booked / days_in_month
 *   number → hotel formula: room_nights_sold / (totalRooms × days_in_month)
 */
function computeOccupancy(bookings, totalRooms) {
  if (!bookings.length) return [];

  const numCols_ = new Set(numericCols(bookings));
  const nightsCol = findCol([...numCols_], ['night', 'nights', 'duration', 'stay', 'no. of night', 'no of night']);

  // Group room-nights sold by month using Check-in date
  const monthMap = {};
  bookings.forEach((row) => {
    const ym = toYearMonth(String(row['Check-in'] ?? row['check_in'] ?? ''));
    if (!ym) return;
    const n = nightsCol ? Number(row[nightsCol] || 1) : 1;
    monthMap[ym] = (monthMap[ym] ?? 0) + n;
  });

  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, roomNights]) => {
      const days = daysInMonth(ym);
      const denominator = totalRooms ? totalRooms * days : days;
      return {
        label: ym,
        Occupancy: Math.min(100, parseFloat(((roomNights / denominator) * 100).toFixed(1))),
      };
    });
}

// ── main component ────────────────────────────────────────────────────────────

export default function Reports() {
  const { selectedProperty } = useAuthContext();
  const { bookingsTab, expensesTab } = useTabNames();
  const { data: bookings, loading: bLoading, error: bError, refetch: bRefetch } = useSheetData(bookingsTab);
  const { data: expenses, loading: eLoading, error: eError, refetch: eRefetch } = useSheetData(expensesTab);

  const [selectedMonth, setSelectedMonth] = useState('');

  // ── current month YYYY-MM ─────────────────────────────────────────────────
  const currentYM = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // ── aggregate bookings + expenses by month ────────────────────────────────
  const monthlyData = useMemo(() => {
    const map = {};

    // Seed a rolling 6-month past + 3-month future window so charts always
    // show a continuous range even when there's no data for those months
    for (let offset = -6; offset <= 3; offset++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + offset);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[ym] = { revenue: 0, expense: 0, bookingCount: 0 };
    }

    bookings.forEach((r) => {
      const ym = toYearMonth(String(r['Check-in'] ?? r['check_in'] ?? ''));
      if (!ym) return;
      if (!map[ym]) map[ym] = { revenue: 0, expense: 0, bookingCount: 0 };
      map[ym].revenue += Number(r['Total_Amount'] ?? 0);
      map[ym].bookingCount += 1;
    });

    expenses.forEach((r) => {
      const ym = toYearMonth(String(r['Date'] ?? r['date'] ?? ''));
      if (!ym) return;
      if (!map[ym]) map[ym] = { revenue: 0, expense: 0, bookingCount: 0 };
      map[ym].expense += Number(r['Amount'] ?? 0);
    });

    Object.keys(map).forEach((ym) => {
      map[ym].profit = map[ym].revenue - map[ym].expense;
    });

    return map;
  }, [bookings, expenses]);

  // ── sorted month list for picker ──────────────────────────────────────────
  const monthOptions = useMemo(
    () => Object.keys(monthlyData).sort(),
    [monthlyData],
  );

  const activeMonth = useMemo(() => {
    if (selectedMonth && monthlyData[selectedMonth]) return selectedMonth;
    return currentYM;
  }, [selectedMonth, monthlyData, currentYM]);

  // ── selected month P&L ────────────────────────────────────────────────────
  const plData = useMemo(() => monthlyData[activeMonth] ?? { revenue: 0, expense: 0, profit: 0, bookingCount: 0 }, [monthlyData, activeMonth]);

  // ── chart series (all months sorted) ─────────────────────────────────────
  const sortedMonths = useMemo(() => monthOptions, [monthOptions]);

  const revenueData = useMemo(
    () => sortedMonths.map((ym) => ({ label: ym, value: monthlyData[ym]?.revenue ?? 0 })),
    [sortedMonths, monthlyData],
  );
  const expenseData = useMemo(
    () => sortedMonths.map((ym) => ({ label: ym, value: monthlyData[ym]?.expense ?? 0 })),
    [sortedMonths, monthlyData],
  );
  const profitData = useMemo(
    () => sortedMonths.map((ym) => ({ label: ym, value: monthlyData[ym]?.profit ?? 0 })),
    [sortedMonths, monthlyData],
  );

  // ── occupancy computed from bookings ─────────────────────────────────────
  const totalRooms = selectedProperty?.total_rooms ?? null;
  const occupancyData = useMemo(
    () => computeOccupancy(bookings, totalRooms),
    [bookings, totalRooms],
  );

  // ── selected month table row ──────────────────────────────────────────────
  const tableRows = useMemo(() => [{
    Month:        formatMonthLabel(activeMonth),
    Revenue:      plData.revenue,
    Expenses:     plData.expense,
    'Net Profit': plData.profit,
    Bookings:     plData.bookingCount,
  }], [activeMonth, plData]);

  // ── loading / error ───────────────────────────────────────────────────────
  if (bLoading || eLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (bError || eError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-sm" style={{ color: '#56546a' }}>
        <p>Failed to load data.</p>
        <button onClick={() => { bRefetch(); eRefetch(); }} style={{ background: 'linear-gradient(135deg,#7c6af5,#a896f8)', color: '#fff', padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Retry</button>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DemoBanner />
      <div className="flex-1 overflow-auto p-6 space-y-6 print-full">

        {/* ── toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-3 no-print animate-fade-in-up">
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#56546a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Select Month
            </label>
            <select
              value={activeMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '8px 14px',
                background: '#1e1c2a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#f0eee8',
                outline: 'none',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(200,169,110,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              {monthOptions.map((ym) => (
                <option key={ym} value={ym}>{formatMonthLabel(ym)}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => downloadCSV(tableRows, `report_${activeMonth}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                background: '#1e1c2a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#8c8a9e',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#f0eee8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#8c8a9e'; }}
            >
              <DownloadIcon />
              {formatMonthLabel(activeMonth)} CSV
            </button>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px',
                background: '#7c6af5',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#8f7ff7'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#7c6af5'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <PrintIcon />
              Print
            </button>
          </div>
        </div>

        {/* ── P&L summary strip for selected month ────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up stagger-2">
          <PLCard label="Revenue"    value={`₹${fmt(plData.revenue)}`} color="emerald" />
          <PLCard label="Expenses"   value={`₹${fmt(plData.expense)}`} color="rose" />
          <PLCard label="Net Profit" value={`₹${fmt(plData.profit)}`}  color={plData.profit >= 0 ? 'emerald' : 'rose'} />
          <PLCard label="Bookings"   value={plData.bookingCount}        color="blue" />
        </div>

        {/* ── 4 chart panels ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Revenue */}
          <ChartCard title="Monthly Revenue" className="animate-fade-in-up stagger-3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} barGap={4} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={formatMonthLabel} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip prefix="₹" />} />
                <Bar dataKey="value" name="Revenue" fill="#7c6af5" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="value" position="top"
                    formatter={(v) => v > 0 ? `₹${(v/1000).toFixed(1)}k` : ''}
                    style={{ fontSize: 9, fill: '#56546a' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Expenses */}
          <ChartCard title="Monthly Expenses" className="animate-fade-in-up stagger-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={expenseData} barGap={4} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={formatMonthLabel} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip prefix="₹" />} />
                <Bar dataKey="value" name="Expenses" fill="#e07070" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="value" position="top"
                    formatter={(v) => v > 0 ? `₹${(v/1000).toFixed(1)}k` : ''}
                    style={{ fontSize: 9, fill: '#56546a' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Net Profit */}
          <ChartCard title="Net Monthly Profit" className="animate-fade-in-up stagger-5">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={profitData} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c6af5" stopOpacity={0.35}/>
                    <stop offset="100%" stopColor="#7c6af5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={formatMonthLabel} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip prefix="₹" />} />
                <Area type="monotone" dataKey="value" name="Net Profit" stroke="#7c6af5" strokeWidth={2.5}
                  fill="url(#profitGrad)" dot={{ r: 4, fill: '#7c6af5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Occupancy */}
          <ChartCard
            title="Monthly Occupancy %"
            subtitle={occupancyData.length > 0 ? `Computed from ${bookingsTab}` : null}
            className="animate-fade-in-up stagger-6"
          >
            {occupancyData.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={occupancyData} barGap={4} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={formatMonthLabel} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip prefix="" suffix="%" />} />
                  <Bar dataKey="Occupancy" name="Occupancy" fill="#4ecdc4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

        </div>

        {/* ── full monthly summary table ───────────────────────────────────── */}
        <div className="animate-fade-in-up stagger-7">
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '12px' }}>
            {formatMonthLabel(activeMonth)} — P&amp;L summary
          </p>
          <GenericTable
            data={tableRows}
            downloadFileName="monthly_report"
            formatCell={(col, val) => {
              if (col === 'Net Profit') {
                const num = Number(val);
                if (num < 0) return <span style={{ color: '#e07070', fontWeight: 600 }}>₹{fmt(Math.abs(num))}</span>;
                if (num > 0) return <span style={{ color: '#5cb88a', fontWeight: 600 }}>₹{fmt(num)}</span>;
                return <span style={{ color: '#8c8a9e' }}>₹0</span>;
              }
              if (col === 'Revenue' || col === 'Expenses') return `₹${fmt(val)}`;
              return val;
            }}
          />
        </div>

      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, prefix = '₹', suffix = '' }) {
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
      <p style={{ fontSize: 11, color: '#56546a', marginBottom: 8, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {formatMonthLabel(label)}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey ?? entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: entry.stroke ?? entry.fill, flexShrink: 0, boxShadow: `0 0 6px ${(entry.stroke ?? entry.fill)}80` }} />
          <span style={{ fontSize: 11, color: '#8c8a9e', flex: 1 }}>{entry.name}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            {prefix}{typeof entry.value === 'number' ? Number(entry.value).toLocaleString('en-IN') : entry.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

function PLCard({ label, value, color }) {
  const colorMap = {
    emerald: {
      text: '#a896f8',
      bg: 'linear-gradient(135deg, rgba(124,106,245,0.12), rgba(124,106,245,0.04))',
      border: 'rgba(124,106,245,0.3)',
    },
    rose: {
      text: '#e07070',
      bg: 'linear-gradient(135deg, rgba(224,112,112,0.1), rgba(224,112,112,0.04))',
      border: 'rgba(224,112,112,0.25)',
    },
    blue: {
      text: '#c8a96e',
      bg: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))',
      border: 'rgba(200,169,110,0.3)',
    },
  };
  const { text, bg, border } = colorMap[color] ?? colorMap.emerald;
  return (
    <div style={{ borderRadius: '16px', border: `1px solid ${border}`, background: bg, padding: '22px' }} className="card-hover">
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', fontWeight: 400, letterSpacing: '-1px', color: text, margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '12px', color: '#56546a', margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, className, children }) {
  return (
    <div
      style={{ background: '#16151f', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '22px' }}
      className={`card-hover ${className ?? ''}`}
    >
      <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#f0eee8', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '12px', color: '#56546a', margin: '4px 0 0' }}>{subtitle}</p>}
      <div style={{ marginTop: '12px' }}>{children}</div>
    </div>
  );
}

const PrintIcon = () => (
  <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const DownloadIcon = () => (
  <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

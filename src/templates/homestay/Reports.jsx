import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LabelList,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSheetData } from '../../hooks/useSheetData';
import { useTabNames } from '../../hooks/useTabNames';
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

function computeOccupancy(bookings) {
  if (!bookings.length) return [];

  const cols    = Object.keys(bookings[0]);
  const numCols_  = new Set(numericCols(bookings));
  // find date col
  const dateCol = cols.find((c) => {
    const sample = bookings.slice(0, 20).map((r) => r[c]).filter(Boolean);
    return sample.length > 0 &&
      sample.filter((v) => /(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})/.test(String(v))).length >= sample.length * 0.5;
  }) ?? null;

  if (!dateCol) return [];

  // find a "nights" / "duration" column
  const nightsCol = findCol([...numCols_], ['night', 'nights', 'duration', 'stay', 'days', 'no. of night', 'no of night']);

  // sum nights (or count 1 per row) grouped by month
  const monthMap = {};
  bookings.forEach((row) => {
    const ym = toYearMonth(row[dateCol]);
    if (!ym) return;
    const n = nightsCol ? Number(row[nightsCol] || 0) : 1;
    monthMap[ym] = (monthMap[ym] ?? 0) + n;
  });

  const currentYear = new Date().getFullYear();
  return Object.entries(monthMap)
    .filter(([ym]) => parseInt(ym.split('-')[0]) <= currentYear)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, nights]) => ({
      label: ym,
      Occupancy: Math.min(100, parseFloat(((nights / daysInMonth(ym)) * 100).toFixed(1))),
    }));
}

// ── main component ────────────────────────────────────────────────────────────

export default function Reports() {
  const { summaryTab, bookingsTab } = useTabNames();
  const { data: summary,  loading: sLoading, error: sError, refetch: sRefetch } = useSheetData(summaryTab);
  const { data: bookings, loading: bLoading }                                    = useSheetData(bookingsTab);

  const [selectedMonth, setSelectedMonth] = useState('');

  // ── detect columns in Summary tab ────────────────────────────────────────
  const cols = useMemo(() => numericCols(summary), [summary]);
  const labelCol = useMemo(() => detectLabelCol(summary, cols), [summary, cols]);

  const revenueCol   = useMemo(() => findCol(cols, ['revenue', 'income', 'receipt', 'collected', 'earning', 'booking amount']), [cols]);
  const expenseCol   = useMemo(() => findCol(cols, ['expense', 'cost', 'spend', 'expenditure', 'payment', 'outgo']),             [cols]);
  const profitCol    = useMemo(() => findCol(cols, ['profit', 'net', 'surplus', 'margin', 'p&l', 'pnl']),                       [cols]);
  const occupancyCol = useMemo(() => findCol(cols, ['occupancy', 'occupied', 'utiliz', 'fill', 'occ %', 'occ%']),               [cols]);

  // ── month options from summary label column ────────────────────────────────
  const currentYM = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const monthOptions = useMemo(() => {
    const base = labelCol ? summary.map((r) => r[labelCol]).filter(Boolean) : [];
    // Always ensure the current month appears in the list even if the Summary
    // sheet hasn't been written yet (month in progress)
    const alreadyHasCurrent = base.some((m) => toYearMonth(String(m)) === currentYM);
    return alreadyHasCurrent ? base : [...base, currentYM];
  }, [summary, labelCol, currentYM]);

  const activeMonth = useMemo(() => {
    if (selectedMonth) return selectedMonth;
    // Prefer an exact match from the sheet; fall back to the injected currentYM entry
    const match = monthOptions.find((m) => toYearMonth(String(m)) === currentYM);
    return match ?? currentYM;
  }, [selectedMonth, monthOptions, currentYM]);

  // ── hide all-zero rows in summary table ───────────────────────────────────
  const nonEmptySummary = useMemo(
    () => cols.length
      ? summary.filter((row) => cols.some((c) => Number(row[c] || 0) !== 0))
      : summary,
    [summary, cols],
  );

  // ── selected month P&L row ─────────────────────────────────────────────────
  const plRow = useMemo(() => {
    if (!labelCol || !activeMonth) return null;
    return summary.find((r) => r[labelCol] === activeMonth) ?? null;
  }, [summary, labelCol, activeMonth]);

  // ── chart series builders ──────────────────────────────────────────────────
  const makeChartData = (col) =>
    summary
      .filter((r) => r[labelCol] !== undefined)
      .map((r) => ({ label: r[labelCol], value: Number(r[col] || 0) }));

  const revenueData   = useMemo(() => revenueCol   ? makeChartData(revenueCol)   : [], [summary, revenueCol,   labelCol]);
  const expenseData   = useMemo(() => expenseCol   ? makeChartData(expenseCol)   : [], [summary, expenseCol,   labelCol]);
  const profitData    = useMemo(() => profitCol    ? makeChartData(profitCol)    : [], [summary, profitCol,    labelCol]);

  // ── occupancy: from Summary col OR computed from Bookings ─────────────────
  const occupancyData = useMemo(() => {
    if (occupancyCol && labelCol) return makeChartData(occupancyCol).map((d) => ({ ...d, value: Number(d.value) }));
    return computeOccupancy(bookings);
  }, [summary, occupancyCol, labelCol, bookings]);

  // ── loading / error ───────────────────────────────────────────────────────
  if (sLoading || bLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (sError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-sm" style={{ color: '#56546a' }}>
        <p>Failed to load <strong style={{ color: '#8c8a9e' }}>"{summaryTab}"</strong> tab.</p>
        <p style={{ fontSize: '12px', color: '#56546a' }}>{sError}</p>
        <button onClick={sRefetch} style={{ background: 'linear-gradient(135deg,#7c6af5,#a896f8)', color: '#fff', padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Retry</button>
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
          {monthOptions.length > 0 && (
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
                {monthOptions.map((m) => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {summary.length > 0 && (
              <button
                onClick={() => {
                  const rows = plRow ? [plRow] : summary;
                  const name = activeMonth ? `${summaryTab}_${activeMonth}` : summaryTab;
                  downloadCSV(rows, name);
                }}
                title={activeMonth ? `Download ${activeMonth} as CSV` : 'Download all months as CSV'}
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
                {activeMonth ? `${formatMonthLabel(activeMonth)} CSV` : 'All months'}
              </button>
            )}
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
        {plRow && (revenueCol || expenseCol || profitCol) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up stagger-2">
            {revenueCol && (
              <PLCard label="Revenue" value={`₹${fmt(plRow[revenueCol])}`} color="emerald" />
            )}
            {expenseCol && (
              <PLCard label="Expenses" value={`₹${fmt(plRow[expenseCol])}`} color="rose" />
            )}
            {profitCol && (
              <PLCard
                label="Net Profit"
                value={`₹${fmt(plRow[profitCol])}`}
                color={Number(plRow[profitCol]) >= 0 ? 'emerald' : 'rose'}
              />
            )}
            {(occupancyCol || occupancyData.find((d) => d.label === activeMonth)) && (
              <PLCard
                label="Occupancy"
                value={fmtPc(
                  occupancyCol
                    ? plRow[occupancyCol]
                    : (occupancyData.find((d) => d.label === activeMonth)?.Occupancy ?? occupancyData.find((d) => d.label === activeMonth)?.value ?? 0)
                )}
                color="blue"
              />
            )}
          </div>
        )}

        {/* ── 4 chart panels ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Revenue */}
          <ChartCard
            title="Monthly Revenue"
            col={revenueCol}
            hint="Add a column containing 'revenue' or 'income' to your Summary tab"
            className="animate-fade-in-up stagger-3"
          >
            {revenueData.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} barGap={4} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={formatMonthLabel} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip prefix="₹" />} />
                  <Bar dataKey="value" name={revenueCol} fill="#7c6af5" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top"
                      formatter={(v) => v > 0 ? `₹${(v/1000).toFixed(1)}k` : ''}
                      style={{ fontSize: 9, fill: '#56546a' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Expenses */}
          <ChartCard
            title="Monthly Expenses"
            col={expenseCol}
            hint="Add a column containing 'expense' or 'cost' to your Summary tab"
            className="animate-fade-in-up stagger-4"
          >
            {expenseData.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={expenseData} barGap={4} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={formatMonthLabel} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip prefix="₹" />} />
                  <Bar dataKey="value" name={expenseCol} fill="#e07070" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top"
                      formatter={(v) => v > 0 ? `₹${(v/1000).toFixed(1)}k` : ''}
                      style={{ fontSize: 9, fill: '#56546a' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Net Profit — AreaChart with gradient fill */}
          <ChartCard
            title="Net Monthly Profit"
            col={profitCol}
            hint="Add a column containing 'profit' or 'net' to your Summary tab"
            className="animate-fade-in-up stagger-5"
          >
            {profitData.length > 0 && (
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
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={profitCol}
                    stroke="#7c6af5"
                    strokeWidth={2.5}
                    fill="url(#profitGrad)"
                    dot={{ r: 4, fill: '#7c6af5', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Occupancy */}
          <ChartCard
            title="Monthly Occupancy %"
            col={occupancyCol ?? (occupancyData.length > 0 ? 'computed' : null)}
            hint={
              occupancyData.length === 0
                ? `Add an 'Occupancy' column to your ${summaryTab} tab, or add a date + nights column in ${bookingsTab}`
                : null
            }
            subtitle={
              !occupancyCol && occupancyData.length > 0
                ? `Auto-computed from ${bookingsTab} tab`
                : occupancyCol
                ? `From "${occupancyCol}" column`
                : null
            }
            className="animate-fade-in-up stagger-6"
          >
            {occupancyData.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={occupancyData} barGap={4} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#56546a' }} tickFormatter={formatMonthLabel} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#56546a' }}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip prefix="" suffix="%" />} />
                  <Bar
                    dataKey={occupancyCol ? 'value' : 'Occupancy'}
                    name="Occupancy"
                    fill="#4ecdc4"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

        </div>

        {/* ── full data table ──────────────────────────────────────────────── */}
        <div className="animate-fade-in-up stagger-7">
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '12px' }}>
            {summaryTab} — all rows
          </p>
          <GenericTable
            data={nonEmptySummary}
            downloadFileName={summaryTab}
            formatCell={(col, val) => {
              if (col === labelCol) return formatMonthLabel(val);
              const c = col.toLowerCase().replace(/[\s_-]/g, '');
              if (c.includes('profit') || c.includes('net')) {
                const num = Number(String(val ?? '').replace(/[,₹\s]/g, ''));
                if (!isNaN(num) && isFinite(num)) {
                  if (num < 0) return <span style={{ color: '#e07070', fontWeight: 600 }}>{val}</span>;
                  if (num > 0) return <span style={{ color: '#5cb88a', fontWeight: 600 }}>{val}</span>;
                  return <span style={{ color: '#8c8a9e' }}>{val}</span>;
                }
              }
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

function ChartCard({ title, col, hint, subtitle, className, children }) {
  return (
    <div
      style={{ background: '#16151f', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '22px' }}
      className={`card-hover ${className ?? ''}`}
    >
      <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#f0eee8', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '12px', color: '#56546a', margin: '4px 0 12px' }}>{subtitle}</p>}
      {!col && hint ? (
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
          <p style={{ fontSize: '12px', color: '#e8a86a', margin: 0 }}>{hint}</p>
        </div>
      ) : (
        <div style={{ marginTop: subtitle ? 0 : '12px' }}>{children}</div>
      )}
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

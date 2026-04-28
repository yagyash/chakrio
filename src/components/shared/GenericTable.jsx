import { useState, useMemo } from 'react';
import { downloadCSV } from '../../utils/downloadCSV';

// ── date helpers (for month filter) ──────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function formatMonthLabel(ym) {
  const m = String(ym).match(/^(\d{4})-(\d{1,2})$/);
  if (m) return `${MONTH_NAMES[parseInt(m[2], 10) - 1]} ${m[1]}`;
  return ym;
}

function toYearMonth(val) {
  const s = String(val ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}`;
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}`; // DD/MM/YYYY → YYYY-MM
  return null;
}

function detectDateCol(data) {
  if (!data.length) return null;
  // Anchored: the entire cell must be a date, not just contain one (e.g. "id_2026-02-26" should NOT match)
  const dateRe = /^(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})$/;
  return Object.keys(data[0]).find((col) => {
    const sample = data.slice(0, 20).map((r) => r[col]).filter(Boolean);
    return (
      sample.length > 0 &&
      sample.filter((v) => dateRe.test(String(v).trim())).length >= sample.length * 0.6
    );
  }) ?? null;
}

// ── component ─────────────────────────────────────────────────────────────────

/**
 * Renders any array of objects as a searchable, filterable table.
 * Column headers are derived from the keys of the first row.
 *
 * Props:
 *  - downloadFileName  show CSV download button; filename = `${downloadFileName}_${month}.csv`
 *  - showMonthFilter   auto-detect date column and show a month picker in the header
 *  - maxRows           cap the number of rows shown
 */
export default function GenericTable({ data, title, maxRows, downloadFileName, showMonthFilter, getRowClassName, formatCell, hideCols, formatHeader }) {
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const columns = useMemo(() => {
    const all = data.length > 0 ? Object.keys(data[0]) : [];
    if (!hideCols || !hideCols.length) return all;
    const hidden = hideCols.map((h) => h.toLowerCase());
    return all.filter((c) => !hidden.includes(c.toLowerCase()));
  }, [data, hideCols]);

  // detect date column when month filter is enabled
  const dateCol = useMemo(
    () => (showMonthFilter ? detectDateCol(data) : null),
    [data, showMonthFilter],
  );

  // unique sorted months derived from the date column
  const monthOptions = useMemo(() => {
    if (!dateCol) return [];
    const set = new Set(data.map((r) => toYearMonth(r[dateCol])).filter(Boolean));
    return [...set].sort();
  }, [data, dateCol]);

  // rows after month + search filters
  const filtered = useMemo(() => {
    let rows = maxRows ? data.slice(0, maxRows) : data;

    if (selectedMonth && dateCol) {
      rows = rows.filter((r) => toYearMonth(r[dateCol]) === selectedMonth);
    }

    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, search, maxRows, selectedMonth, dateCol]);

  // build filename: "Bookings_2025-03.csv" or "Bookings.csv"
  const csvFilename = downloadFileName
    ? selectedMonth
      ? `${downloadFileName}_${selectedMonth}`
      : downloadFileName
    : '';

  return (
    <div style={{
      background: '#16151f',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.07)',
      overflow: 'hidden',
    }} className="animate-fade-in-up card-hover">
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {title && (
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#f0eee8', margin: 0 }}>{title}</h2>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>

          {/* Month picker */}
          {monthOptions.length > 0 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '6px 10px',
                background: '#1e1c2a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#8c8a9e',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">All months</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          )}

          {/* Download CSV */}
          {downloadFileName && data.length > 0 && (
            <button
              onClick={() => downloadCSV(filtered, csvFilename)}
              title={selectedMonth ? `Download ${selectedMonth} as CSV` : 'Download all as CSV'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#8c8a9e',
                background: '#1e1c2a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#f0eee8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#8c8a9e'; }}
            >
              <DownloadIcon />
              {selectedMonth ? `${selectedMonth}` : 'All'} CSV
            </button>
          )}

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#56546a' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                paddingLeft: '32px',
                paddingRight: '16px',
                paddingTop: '6px',
                paddingBottom: '6px',
                background: '#1e1c2a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#f0eee8',
                outline: 'none',
                width: '180px',
              }}
            />
          </div>

          <span style={{ fontSize: '12px', color: '#56546a', whiteSpace: 'nowrap' }}>
            {filtered.length} / {data.length} rows
          </span>
        </div>
      </div>

      {/* Table */}
      {columns.length === 0 ? (
        <p style={{ padding: '56px 16px', textAlign: 'center', color: '#56546a', fontSize: '13px' }}>No data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm animate-rows">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(30,28,42,0.5)' }}>
                {columns.map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#56546a',
                      padding: '10px 16px',
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {formatHeader ? formatHeader(col) : col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: '48px 16px', textAlign: 'center', color: '#56546a', fontSize: '13px' }}>
                    No rows match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    className={getRowClassName ? getRowClassName(row) : `table-row-hover ${i % 2 !== 0 ? 'table-row-alt' : ''}`}
                  >
                    {columns.map((col) => {
                      const raw = row[col];
                      const display = formatCell ? formatCell(col, raw) : raw;
                      // Default negative number color when no formatCell override
                      const rawNum = !formatCell ? Number(String(raw ?? '').replace(/[,₹\s]/g, '')) : NaN;
                      const isNeg = !isNaN(rawNum) && isFinite(rawNum) && rawNum < 0;
                      return (
                        <td
                          key={col}
                          style={{ padding: '11px 16px', color: isNeg ? '#e07070' : '#8c8a9e', fontWeight: isNeg ? 600 : undefined, whiteSpace: 'nowrap' }}
                          title={String(raw ?? '')}
                        >
                          <span style={{ display: 'block', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{display}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const DownloadIcon = () => (
  <svg style={{ width: '13px', height: '13px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

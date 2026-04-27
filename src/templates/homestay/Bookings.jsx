import { useMemo } from 'react';
import { useSheetData } from '../../hooks/useSheetData';
import { useTabNames } from '../../hooks/useTabNames';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import DemoBanner from '../../components/shared/DemoBanner';
import GenericTable from '../../components/shared/GenericTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate, isDateCol } from '../../utils/formatDate';

const HIDDEN_COLS = ['created_at', 'updated_at', 'createdat', 'updatedat', 'Created_At', 'Updated_At'];

const HEADER_MAP = {
  total_amount:   'Total Amount',
  advance_amount: 'Advance Paid',
  balance_amount: 'Balance Due',
};

function formatHeader(col) {
  const key = String(col).toLowerCase().replace(/[\s-]/g, '_');
  return HEADER_MAP[key] ?? col;
}

function formatCell(col, val) {
  if (!val && val !== 0) return val;
  const c = col.toLowerCase().replace(/[\s_-]/g, '');

  if (c.includes('status')) return <StatusBadge value={val} />;
  if (isDateCol(col)) return formatDate(val);

  // Extras column — gold amount or dash
  if (c === 'extras') {
    if (!val || val === '—') return <span style={{ color: '#56546a' }}>—</span>;
    return <span style={{ color: '#c8a96e', fontWeight: 600 }}>₹{Number(val).toLocaleString('en-IN')}</span>;
  }
  // ID columns — monospace muted
  if (c.includes('id') || c.includes('bookingid') || c.includes('booking_id')) {
    return <span style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#56546a', letterSpacing: '0.3px' }}>{val}</span>;
  }
  // Guest / primary name
  if (c.includes('guest') || c.includes('name') || c.includes('customer')) {
    return <span style={{ fontWeight: 600, color: '#f0eee8', fontSize: '14px' }}>{val}</span>;
  }
  // Total / booking amount
  if (c.includes('total') || c.includes('booking_amount') || c.includes('bookingamount')) {
    return <span style={{ fontWeight: 600, color: '#f0eee8' }}>{val}</span>;
  }
  // Balance due — gold
  if (c.includes('balance') || c.includes('balancedue') || c.includes('pending')) {
    return <span style={{ color: '#e8a86a', fontWeight: 500 }}>{val}</span>;
  }
  // Advance paid — muted
  if (c.includes('advance') || c.includes('paid')) {
    return <span style={{ color: '#8c8a9e' }}>{val}</span>;
  }
  // Negative numbers
  const num = Number(String(val).replace(/[,₹]/g, ''));
  if (!isNaN(num) && isFinite(num) && num < 0) {
    return <span style={{ color: '#e07070', fontWeight: 600 }}>{val}</span>;
  }

  return val;
}

export default function Bookings() {
  const { bookingsTab } = useTabNames();
  const { data, loading, error, refetch } = useSheetData(bookingsTab);
  const { data: extrasRaw } = useSheetData('extras');

  // Build booking_ref → total extras amount map
  const extrasMap = useMemo(() => {
    const map = {};
    (extrasRaw || []).forEach((row) => {
      const ref = row.booking_ref;
      if (ref) map[ref] = (map[ref] || 0) + Number(row.amount || 0);
    });
    return map;
  }, [extrasRaw]);

  // Inject Extras column into each booking row
  const dataWithExtras = useMemo(() =>
    data.map((row) => {
      const ref = row['Booking ID'] || row['booking_ref'] || row['booking_id'];
      const total = ref ? (extrasMap[ref] || 0) : 0;
      return { ...row, Extras: total > 0 ? total : '—' };
    }),
    [data, extrasMap],
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-sm" style={{ color: '#56546a' }}>
        <p>Failed to load data from tab <strong style={{ color: '#8c8a9e' }}>"{bookingsTab}"</strong>.</p>
        <p style={{ fontSize: '12px' }}>{error}</p>
        <button
          onClick={refetch}
          style={{ background: 'linear-gradient(135deg,#7c6af5,#a896f8)', color: '#fff', padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DemoBanner />
      <div className="flex-1 overflow-auto p-6">
        <GenericTable
          data={dataWithExtras}
          title={`${bookingsTab} — ${data.length} rows`}
          downloadFileName={bookingsTab}
          showMonthFilter
          hideCols={HIDDEN_COLS}
          formatHeader={formatHeader}
          formatCell={formatCell}
        />
      </div>
    </div>
  );
}

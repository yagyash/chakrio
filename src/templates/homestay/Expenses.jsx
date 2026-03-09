import { useSheetData } from '../../hooks/useSheetData';
import { useTabNames } from '../../hooks/useTabNames';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import DemoBanner from '../../components/shared/DemoBanner';
import GenericTable from '../../components/shared/GenericTable';
import { formatDate, isDateCol } from '../../utils/formatDate';

const HIDDEN_COLS = ['created_at', 'Created_At', 'createdat'];

// FIX 5 — Category pill styles
function CategoryPill({ value }) {
  const v = String(value).toLowerCase();
  let style = { bg: 'rgba(255,255,255,0.05)', color: '#8c8a9e', border: 'rgba(255,255,255,0.1)' };
  if (v.includes('chlorine'))                         style = { bg: 'rgba(78,205,196,0.1)',   color: '#4ecdc4', border: 'rgba(78,205,196,0.2)' };
  else if (v.includes('caretaker'))                   style = { bg: 'rgba(124,106,245,0.1)',  color: '#a896f8', border: 'rgba(124,106,245,0.2)' };
  else if (v.includes('plant') || v.includes('garden')) style = { bg: 'rgba(92,184,138,0.1)', color: '#5cb88a', border: 'rgba(92,184,138,0.2)' };
  else if (v.includes('pipeline') || v.includes('maintenance') || v.includes('repair'))
                                                       style = { bg: 'rgba(232,168,106,0.1)', color: '#e8a86a', border: 'rgba(232,168,106,0.2)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 500,
      background: style.bg, color: style.color,
      border: `1px solid ${style.border}`,
    }}>{value}</span>
  );
}

function formatCell(col, val) {
  if (!val && val !== 0) return val;
  const c = col.toLowerCase().replace(/[\s_-]/g, '');

  if (isDateCol(col)) return formatDate(val);

  // ID columns — monospace muted
  if (c.includes('id') || c.includes('expenseid')) {
    return <span style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#56546a', letterSpacing: '0.3px' }}>{val}</span>;
  }
  // Category — colored pill
  if (c.includes('category') || c.includes('cat')) {
    return <CategoryPill value={val} />;
  }
  // Description — primary text
  if (c.includes('description') || c.includes('desc') || c.includes('item')) {
    return <span style={{ fontWeight: 500, color: '#f0eee8' }}>{val}</span>;
  }
  // Amount
  if (c.includes('amount') || c.includes('total') || c.includes('cost')) {
    const num = Number(String(val).replace(/[,₹]/g, ''));
    if (!isNaN(num) && isFinite(num) && num < 0) {
      return <span style={{ color: '#e07070', fontWeight: 600 }}>{val}</span>;
    }
    return <span style={{ fontWeight: 600, color: '#f0eee8' }}>{val}</span>;
  }

  // Generic negative numbers
  const num = Number(String(val).replace(/[,₹]/g, ''));
  if (!isNaN(num) && isFinite(num) && num < 0) {
    return <span style={{ color: '#e07070', fontWeight: 600 }}>{val}</span>;
  }

  return val;
}

export default function Expenses() {
  const { expensesTab } = useTabNames();
  const { data, loading, error, refetch } = useSheetData(expensesTab);

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
        <p>Failed to load data from tab <strong style={{ color: '#8c8a9e' }}>"{expensesTab}"</strong>.</p>
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
          data={data}
          title={`${expensesTab} — ${data.length} rows`}
          downloadFileName={expensesTab}
          showMonthFilter
          hideCols={HIDDEN_COLS}
          formatCell={formatCell}
        />
      </div>
    </div>
  );
}

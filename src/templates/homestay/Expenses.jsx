import { useSheetData } from '../../hooks/useSheetData';
import { useTabNames } from '../../hooks/useTabNames';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import DemoBanner from '../../components/shared/DemoBanner';
import GenericTable from '../../components/shared/GenericTable';
import { formatDate, isDateCol } from '../../utils/formatDate';

const HIDDEN_COLS = ['created_at', 'Created_At', 'createdat'];

const CATEGORY_STYLES = {
  supplies:      { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.25)' },
  maintenance:   { bg: 'rgba(232,168,106,0.1)', color: '#e8a86a', border: 'rgba(232,168,106,0.25)' },
  utilities:     { bg: 'rgba(96,165,250,0.1)',  color: '#60a5fa', border: 'rgba(96,165,250,0.25)'  },
  staff:         { bg: 'rgba(168,150,248,0.1)', color: '#a896f8', border: 'rgba(168,150,248,0.25)' },
  food:          { bg: 'rgba(78,205,196,0.1)',  color: '#4ecdc4', border: 'rgba(78,205,196,0.25)'  },
  transport:     { bg: 'rgba(56,189,248,0.1)',  color: '#38bdf8', border: 'rgba(56,189,248,0.25)'  },
  construction:  { bg: 'rgba(251,146,60,0.1)',  color: '#fb923c', border: 'rgba(251,146,60,0.25)'  },
  equipment:     { bg: 'rgba(236,72,153,0.1)',  color: '#ec4899', border: 'rgba(236,72,153,0.25)'  },
  'owner drawing': { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.25)' },
  rent:          { bg: 'rgba(92,184,138,0.1)',  color: '#5cb88a', border: 'rgba(92,184,138,0.25)'  },
};

function CategoryPill({ value }) {
  const key = String(value).toLowerCase().trim();
  const style = CATEGORY_STYLES[key] ?? { bg: 'rgba(255,255,255,0.05)', color: '#8c8a9e', border: 'rgba(255,255,255,0.1)' };
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
          title={expensesTab}
          downloadFileName={expensesTab}
          showMonthFilter
          hideCols={HIDDEN_COLS}
          formatCell={formatCell}
        />
      </div>
    </div>
  );
}

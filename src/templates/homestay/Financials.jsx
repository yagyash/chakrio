import { useSheetData } from '../../hooks/useSheetData';
import { useTabNames } from '../../hooks/useTabNames';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import DemoBanner from '../../components/shared/DemoBanner';
import GenericTable from '../../components/shared/GenericTable';

export default function Financials() {
  const { financialsTab } = useTabNames();
  const { data, loading, error, refetch } = useSheetData(financialsTab);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-gray-500 text-sm">
        <p>Failed to load data from tab <strong>"{financialsTab}"</strong>.</p>
        <p className="text-xs text-gray-400">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 text-white text-sm rounded-lg transition-colors" style={{ background: '#6C63FF' }}
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
          title={`${financialsTab} — ${data.length} rows`}
        />
      </div>
    </div>
  );
}

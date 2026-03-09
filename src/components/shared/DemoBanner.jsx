import { isDemoMode } from '../../services/googleSheets';

export default function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-sm text-amber-800">
      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        <strong>Demo Mode</strong> — Connect your Google Sheet to see live data.
        Set <code className="bg-amber-100 px-1 rounded">VITE_GOOGLE_SHEETS_API_KEY</code> in your environment.
      </span>
    </div>
  );
}

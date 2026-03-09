import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { fetchSheetData } from '../services/googleSheets';

/**
 * Hook to fetch a single tab from the currently selected property's Google Sheet.
 * @param {string} tabName   - Sheet tab name (e.g. "Bookings")
 * @param {string} [range]   - Optional A1 range within the tab
 */
export function useSheetData(tabName, range = '') {
  const { selectedProperty } = useAuthContext();
  // Reads sheet_id from the selected property, not directly from userProfile
  const sheetId = selectedProperty?.sheet_id ?? null;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSheetData(sheetId, tabName, range);
      setData(result);
    } catch (err) {
      setError(err.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [sheetId, tabName, range]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

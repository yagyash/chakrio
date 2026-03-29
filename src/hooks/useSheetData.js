import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { fetchSheetData } from '../services/googleSheets';
import { fetchSupabaseTab } from '../services/supabaseService';

/**
 * Hook to fetch a single tab from the currently selected property.
 * Routes to Supabase if the property has a supabase_property_id,
 * otherwise falls back to Google Sheets.
 *
 * @param {string} tabName   - Tab name (e.g. "Bookings")
 * @param {string} [range]   - Optional A1 range (Sheets only — ignored for Supabase)
 */
export function useSheetData(tabName, range = '') {
  const { selectedProperty } = useAuthContext();
  const supabasePropertyId = selectedProperty?.supabase_property_id ?? null;
  const sheetId = selectedProperty?.sheet_id ?? null;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = supabasePropertyId
        ? await fetchSupabaseTab(supabasePropertyId, tabName)
        : await fetchSheetData(sheetId, tabName, range);
      setData(result);
    } catch (err) {
      setError(err.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [supabasePropertyId, sheetId, tabName, range]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

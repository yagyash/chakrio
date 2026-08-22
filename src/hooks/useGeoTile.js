import { useState, useEffect, useCallback } from 'react';
import { getIdToken } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';

/**
 * Fetches geo-tile data for the currently selected property via
 * /api/marketing?action=geo-tile — folded into the merged campaigns+wallet
 * function rather than its own Vercel function, to stay under the Hobby
 * plan's 12-function cap (see api/marketing.js's header comment).
 *
 * The response shape is entitlement-driven server-side (see chakrio-agent's
 * routers/geo.py) — { enabled: false } for a property with the flag off,
 * or { enabled: true, tier, ai_mentions, grid, fix_history } for one that's
 * on. This hook does no plan/tier logic of its own — it just hands back
 * whatever the server decided to include.
 */
export function useGeoTile() {
  const { selectedProperty } = useAuthContext();
  const propertyId = selectedProperty?.supabase_property_id ?? null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!propertyId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await getIdToken(auth.currentUser);
      const res = await fetch(`/api/marketing?action=geo-tile&propertyId=${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.ok ? await res.json() : null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, refetch: load };
}

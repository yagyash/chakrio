/**
 * Vercel Serverless Function — /api/data
 *
 * Flow:
 *   1. Verify Firebase ID token (server-side, using Google's JWKS)
 *   2. Confirm the requested propertyId belongs to this user (Firestore ownership check)
 *   3. Fetch from Supabase with service role key
 *   4. Return rows as JSON
 *
 * Env vars required (Vercel dashboard):
 *   SUPABASE_URL               https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  service role key (bypasses RLS)
 *   FIREBASE_PROJECT_ID        Firebase project ID
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const VALID_TABS = new Set(['bookings', 'expenses', 'summary', 'extras']);
const UUID_RE    = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ------------------------------------------------------------------
// Firestore ownership check
// Uses the user's own Firebase ID token — Firestore rules allow
// users to read their own document (allow read: if request.auth.uid == userId).
// Handles both flat schema (single property) and array schema (multi-property).
// ------------------------------------------------------------------

async function getOwnerPropertyIds(uid, token, projectId) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];

    const doc    = await res.json();
    const fields = doc.fields ?? {};
    const ids    = [];

    // Flat schema: supabase_property_id directly on document
    const flat = fields.supabase_property_id?.stringValue;
    if (flat) ids.push(flat);

    // Array schema: properties[].supabase_property_id
    for (const v of (fields.properties?.arrayValue?.values ?? [])) {
      const uuid = v.mapValue?.fields?.supabase_property_id?.stringValue;
      if (uuid) ids.push(uuid);
    }

    return ids;
  } catch {
    return [];
  }
}

// ------------------------------------------------------------------
// Supabase REST query per tab
// ------------------------------------------------------------------

function supabaseQuery(tab, propertyId) {
  switch (tab) {
    case 'bookings': return `/bookings?property_id=eq.${propertyId}&select=*&order=check_in.desc`;
    case 'expenses': return `/expenses?property_id=eq.${propertyId}&select=*&order=date.desc`;
    case 'summary':  return `/monthly_summary?property_id=eq.${propertyId}&select=*&order=year.desc,month.desc`;
    case 'extras':   return `/booking_extras?property_id=eq.${propertyId}&select=*&order=created_at.desc`;
  }
}

// PostgREST silently caps every select at db-max-rows (1000 on Supabase's
// default config) no matter what ?limit= says. A property past 1000 bookings
// would lose its OLDEST rows — which quietly zeroed early-month revenue,
// op. profit, op. expense and occupancy on the Reports page (they aggregate
// the rows this route returns). Page through with Range headers until a
// short page comes back so every month has its full booking set.
// ponytail: returning every row is fine at a few thousand per property; if
// one ever crosses ~10k bookings, make the Reports/Bookings pages request a
// date range and filter it server-side here instead of shipping everything.
const PAGE_SIZE = 1000;

async function fetchAllRows(url, serviceKey) {
  const rows = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const resp = await fetch(url, {
      headers: {
        apikey:        serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Range-Unit':  'items',
        Range:         `${start}-${start + PAGE_SIZE - 1}`,
      },
    });
    if (resp.status === 416) break;               // range starts past the last row
    if (!resp.ok) throw new Error(`Supabase ${resp.status}`);
    const page = await resp.json();
    if (!Array.isArray(page)) throw new Error('Unexpected Supabase response');
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

// ------------------------------------------------------------------
// Handler
// ------------------------------------------------------------------

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Extract + verify Firebase token ────────────────────────────
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return res.status(500).json({ error: 'Server configuration error' });

  let uid;
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer:   `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    uid = payload.sub;   // Firebase UID
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── 2. Validate query params ───────────────────────────────────────
  const { propertyId, tab } = req.query;

  if (!propertyId || !tab)        return res.status(400).json({ error: 'Bad request' });
  if (!VALID_TABS.has(tab))       return res.status(400).json({ error: 'Bad request' });
  if (!UUID_RE.test(propertyId))  return res.status(400).json({ error: 'Bad request' });

  // ── 3. Ownership check — confirm this user owns the property ───────
  const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
  if (!ownedIds.includes(propertyId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ── 4. Fetch from Supabase ─────────────────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server configuration error' });

  try {
    const url = `${supabaseUrl}/rest/v1${supabaseQuery(tab, propertyId)}`;
    return res.status(200).json(await fetchAllRows(url, serviceKey));
  } catch {
    return res.status(502).json({ error: 'Failed to load data' });
  }
}

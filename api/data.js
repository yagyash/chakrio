/**
 * Vercel Serverless Function — /api/data
 *
 * Sits between the frontend and Supabase. The browser never touches
 * Supabase directly; it sends a Firebase ID token here and gets back
 * the requested rows.
 *
 * Flow:
 *   1. Verify Firebase ID token (server-side, using Google's JWKS)
 *   2. Validate query params (propertyId UUID, tab whitelist)
 *   3. Fetch from Supabase with service role key
 *   4. Return rows as JSON
 *
 * Env vars required (set in Vercel dashboard — NOT prefixed with VITE_):
 *   SUPABASE_URL             https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  service role key (bypasses RLS)
 *   FIREBASE_PROJECT_ID      Firebase project ID
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

// Google publishes Firebase signing keys here — jose caches + rotates automatically
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const VALID_TABS = new Set(['bookings', 'expenses', 'summary', 'extras']);

// Supabase REST query per tab
function supabaseQuery(tab, propertyId) {
  switch (tab) {
    case 'bookings': return `/bookings?property_id=eq.${propertyId}&select=*&order=check_in.desc&limit=2000`;
    case 'expenses': return `/expenses?property_id=eq.${propertyId}&select=*&order=date.desc&limit=2000`;
    case 'summary':  return `/monthly_summary?property_id=eq.${propertyId}&select=*&order=year.desc,month.desc&limit=2000`;
    case 'extras':   return `/booking_extras?property_id=eq.${propertyId}&select=*&order=created_at.desc&limit=2000`;
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Verify Firebase ID token ───────────────────────────────────
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    await jwtVerify(token, FIREBASE_JWKS, {
      issuer:   `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
  } catch {
    // Expired, tampered, or wrong project — all treated identically
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── 2. Validate query params ──────────────────────────────────────
  const { propertyId, tab } = req.query;

  if (!propertyId || !tab) {
    return res.status(400).json({ error: 'Bad request' });
  }

  if (!VALID_TABS.has(tab)) {
    return res.status(400).json({ error: 'Bad request' });
  }

  // Validate UUID format to prevent injection via the query string
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)) {
    return res.status(400).json({ error: 'Bad request' });
  }

  // ── 3. Fetch from Supabase ────────────────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const url = `${supabaseUrl}/rest/v1${supabaseQuery(tab, propertyId)}`;
    const supaRes = await fetch(url, {
      headers: {
        apikey:        serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!supaRes.ok) {
      return res.status(502).json({ error: 'Failed to load data' });
    }

    const data = await supaRes.json();
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Failed to load data' });
  }
}

/**
 * Vercel Serverless Function — GET /api/admin-clients
 *
 * Returns all clients + their properties for the admin dashboard.
 * Only accessible to the admin email (ADMIN_EMAIL env var).
 *
 * Flow:
 *   1. Verify Firebase ID token
 *   2. Check decoded email === ADMIN_EMAIL
 *   3. Fetch clients JOIN properties from Supabase
 *
 * Env vars required (Vercel Dashboard):
 *   FIREBASE_PROJECT_ID
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Verify Firebase ID token ──────────────────────────────────
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!projectId || !adminEmail) return res.status(500).json({ error: 'Server configuration error' });

  let payload;
  try {
    const result = await jwtVerify(token, FIREBASE_JWKS, {
      issuer:   `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    payload = result.payload;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── 2. Admin-only gate ───────────────────────────────────────────
  if (payload.email !== adminEmail) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ── 3. Fetch from Supabase ───────────────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Server configuration error' });

  let supaRes;
  try {
    supaRes = await fetch(
      `${supabaseUrl}/rest/v1/clients?select=id,name,plan,email,phone,is_active,created_at,properties(id,property_id,property_name,property_type,notification_channel,is_active,created_at)&order=created_at.desc&limit=500`,
      {
        headers: {
          apikey:        supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept:        'application/json',
        },
      }
    );
  } catch {
    return res.status(502).json({ error: 'Database unreachable' });
  }

  if (!supaRes.ok) {
    return res.status(502).json({ error: 'Failed to fetch client data' });
  }

  const clients = await supaRes.json();
  return res.status(200).json(clients);
}

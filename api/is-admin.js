/**
 * Vercel Serverless Function — GET /api/is-admin
 *
 * Returns { isAdmin: true/false } for the authenticated user.
 * Admin list is stored in Supabase `admins` table — no redeployment needed to add admins.
 *
 * Env vars required:
 *   FIREBASE_PROJECT_ID
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
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

  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return res.status(200).json({ isAdmin: false });

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return res.status(500).json({ error: 'Server configuration error' });

  let payload;
  try {
    const result = await jwtVerify(token, FIREBASE_JWKS, {
      issuer:   `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    payload = result.payload;
  } catch {
    return res.status(200).json({ isAdmin: false });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Server configuration error' });

  const adminRes = await fetch(
    `${supabaseUrl}/rest/v1/admins?email=eq.${encodeURIComponent(payload.email)}&select=email&limit=1`,
    {
      headers: {
        apikey:        supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept:        'application/json',
      },
    }
  ).catch(() => null);

  if (!adminRes || !adminRes.ok) return res.status(200).json({ isAdmin: false });

  const rows = await adminRes.json().catch(() => []);
  return res.status(200).json({ isAdmin: Array.isArray(rows) && rows.length > 0 });
}

/**
 * Vercel Serverless Function — /api/admin-property
 *
 * PATCH { propertyId, action: 'activate'|'deactivate'|'payment', dueDate?, amount? }
 *   activate/deactivate → toggle is_active
 *   payment            → set is_active=true, subscription_status='active', due date + amount
 *
 * DELETE { propertyId }
 *   Hard delete property + cascades to rooms
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

async function verifyAdmin(req) {
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return null;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;

  let payload;
  try {
    const result = await jwtVerify(token, FIREBASE_JWKS, {
      issuer:   `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    payload = result.payload;
  } catch {
    return null;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

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

  if (!adminRes || !adminRes.ok) return null;
  const rows = await adminRes.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0 ? payload : null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!['PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req);
  if (!admin) return res.status(403).json({ error: 'Forbidden' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const { propertyId, action, dueDate, amount } = req.body ?? {};
  if (!propertyId) return res.status(400).json({ error: 'propertyId is required' });

  const headers = {
    apikey:          supabaseKey,
    Authorization:   `Bearer ${supabaseKey}`,
    'Content-Type':  'application/json',
    Prefer:          'return=minimal',
  };

  if (req.method === 'DELETE') {
    // Fetch client_id before deleting so we can cascade-delete orphaned client
    const fetchHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' };
    const propRes = await fetch(
      `${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}&select=client_id`,
      { headers: fetchHeaders }
    ).catch(() => null);
    const propData = propRes?.ok ? await propRes.json().catch(() => []) : [];
    const clientId = propData[0]?.client_id ?? null;

    // Delete property (cascades to rooms via FK)
    const r = await fetch(
      `${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`,
      { method: 'DELETE', headers }
    );
    if (!r.ok) return res.status(502).json({ error: 'Delete failed' });

    // Delete client if they have no remaining properties
    if (clientId) {
      const remRes = await fetch(
        `${supabaseUrl}/rest/v1/properties?client_id=eq.${clientId}&select=id`,
        { headers: fetchHeaders }
      ).catch(() => null);
      const remaining = remRes?.ok ? await remRes.json().catch(() => [null]) : [null];
      if (remaining.length === 0) {
        await fetch(
          `${supabaseUrl}/rest/v1/clients?id=eq.${clientId}`,
          { method: 'DELETE', headers }
        ).catch(() => null);
      }
    }

    return res.status(200).json({ ok: true });
  }

  // PATCH
  let patch;
  if (action === 'activate') {
    patch = { is_active: true };
  } else if (action === 'deactivate') {
    patch = { is_active: false };
  } else if (action === 'payment') {
    if (!dueDate) return res.status(400).json({ error: 'dueDate is required for payment action' });
    patch = {
      is_active:              true,
      subscription_status:   'active',
      subscription_due_date: dueDate,
      ...(amount != null ? { subscription_amount: parseFloat(amount) } : {}),
    };
  } else {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  const r = await fetch(
    `${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`,
    { method: 'PATCH', headers, body: JSON.stringify(patch) }
  );
  if (!r.ok) return res.status(502).json({ error: 'Update failed' });
  return res.status(200).json({ ok: true });
}

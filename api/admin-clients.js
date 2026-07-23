/**
 * Vercel Serverless Function — GET /api/admin-clients
 *
 * Default (no action):  returns all clients + properties + usage counts
 * ?action=token-history&propertyId=UUID  → monthly token breakdown (last 6 months)
 * ?action=activity                        → global activity log (last 20 events)
 * ?action=payment-history&propertyId=UUID → payment history for a property
 * ?action=checklist&propertyId=UUID       → onboard status checklist for a property
 * ?action=stats                           → collected-this-month from payment_history
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

async function verifyAdmin(req) {
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return false;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return false;

  let payload;
  try {
    const result = await jwtVerify(token, FIREBASE_JWKS, {
      issuer:   `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    payload = result.payload;
  } catch {
    return false;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return false;

  const adminRes = await fetch(
    `${supabaseUrl}/rest/v1/admins?email=eq.${encodeURIComponent(payload.email)}&select=email&limit=1`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' } }
  ).catch(() => null);

  const rows = adminRes?.ok ? await adminRes.json().catch(() => []) : [];
  return Array.isArray(rows) && rows.length > 0;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supaHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' };

  const { action, propertyId } = req.query;

  // ── token-history ──────────────────────────────────────────────────
  if (action === 'token-history') {
    if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/get_token_monthly`, {
      method: 'POST',
      headers: { ...supaHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_property_id: propertyId }),
    });
    if (!r.ok) return res.status(502).json({ error: 'RPC failed' });
    return res.status(200).json(await r.json());
  }

  // ── activity ───────────────────────────────────────────────────────
  if (action === 'activity') {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/get_activity_log`, {
      method: 'POST',
      headers: { ...supaHeaders, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!r.ok) return res.status(502).json({ error: 'RPC failed' });
    return res.status(200).json(await r.json());
  }

  // ── payment-history ────────────────────────────────────────────────
  if (action === 'payment-history') {
    if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
    const r = await fetch(
      `${supabaseUrl}/rest/v1/payment_history?property_id=eq.${propertyId}&order=created_at.desc&limit=20`,
      { headers: supaHeaders }
    );
    if (!r.ok) return res.status(502).json({ error: 'Query failed' });
    return res.status(200).json(await r.json());
  }

  // ── checklist ──────────────────────────────────────────────────────
  if (action === 'checklist') {
    if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/get_onboard_status`, {
      method: 'POST',
      headers: { ...supaHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_property_id: propertyId }),
    });
    if (!r.ok) return res.status(502).json({ error: 'RPC failed' });
    const rows = await r.json();
    return res.status(200).json(rows[0] ?? { has_message: false, has_booking: false });
  }

  // ── stats (collected this month) ───────────────────────────────────
  if (action === 'stats') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const r = await fetch(
      `${supabaseUrl}/rest/v1/payment_history?created_at=gte.${startOfMonth.toISOString()}&select=amount`,
      { headers: supaHeaders }
    );
    const rows = r.ok ? await r.json().catch(() => []) : [];
    const collected = rows.reduce((s, row) => s + (Number(row.amount) || 0), 0);
    return res.status(200).json({ collected_this_month: collected });
  }

  // ── default: all clients ───────────────────────────────────────────
  let supaRes;
  try {
    supaRes = await fetch(
      `${supabaseUrl}/rest/v1/clients?select=id,name,plan,email,phone,is_active,created_at,properties(id,property_id,property_name,property_type,notification_channel,is_active,created_at,subscription_due_date,subscription_amount,subscription_status)&order=created_at.desc&limit=500`,
      { headers: supaHeaders }
    );
  } catch {
    return res.status(502).json({ error: 'Database unreachable' });
  }

  if (!supaRes.ok) return res.status(502).json({ error: 'Failed to fetch client data' });
  const clients = await supaRes.json();

  let usageCounts = {};
  try {
    const usageRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_usage_counts`, {
      method: 'POST',
      headers: { ...supaHeaders, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (usageRes.ok) {
      const rows = await usageRes.json();
      rows.forEach(r => { usageCounts[r.property_id] = r; });
    }
  } catch { /* non-fatal */ }

  clients.forEach(c => c.properties?.forEach(p => {
    p.usage = usageCounts[p.id] ?? null;
  }));

  return res.status(200).json(clients);
}

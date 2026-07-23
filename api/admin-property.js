/**
 * Vercel Serverless Function — /api/admin-property
 *
 * PATCH { propertyId, action: 'activate'|'deactivate'|'payment'|'change_plan', ... }
 *   activate/deactivate → toggle is_active
 *   payment            → set is_active=true, subscription_status='active', due date + amount
 *                        also inserts into payment_history
 *   change_plan        → update clients.plan (requires clientId + plan in body)
 *
 * POST { action: 'send_message', propertyId, message }
 *   → proxy to chakrio-agent POST /admin/notify
 *
 * DELETE { propertyId }
 *   Hard delete property + cascades to rooms
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
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' } }
  ).catch(() => null);

  if (!adminRes || !adminRes.ok) return null;
  const rows = await adminRes.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0 ? payload : null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!['PATCH', 'DELETE', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req);
  if (!admin) return res.status(403).json({ error: 'Forbidden' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey:          supabaseKey,
    Authorization:   `Bearer ${supabaseKey}`,
    'Content-Type':  'application/json',
    Prefer:          'return=minimal',
  };

  // ── POST send_message ──────────────────────────────────────────────
  if (req.method === 'POST') {
    const { action, propertyId, message } = req.body ?? {};
    if (action !== 'send_message' || !propertyId || !message?.trim()) {
      return res.status(400).json({ error: 'action, propertyId, and message are required' });
    }
    const agentUrl = process.env.CHAKRIO_AGENT_URL;
    const secret   = process.env.ONBOARD_SECRET;
    if (!agentUrl || !secret) return res.status(500).json({ error: 'Agent not configured' });

    const r = await fetch(`${agentUrl}/admin/notify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Onboard-Secret': secret },
      body:    JSON.stringify({ property_id: propertyId, message }),
    }).catch(() => null);

    if (!r || !r.ok) {
      const detail = r ? await r.json().catch(() => ({})) : {};
      return res.status(502).json({ error: detail.detail || 'Failed to send message' });
    }
    return res.status(200).json({ ok: true });
  }

  const { propertyId, action, dueDate, amount, clientId, plan } = req.body ?? {};
  if (!propertyId) return res.status(400).json({ error: 'propertyId is required' });

  // ── DELETE ─────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const fetchHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' };
    const propRes = await fetch(
      `${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}&select=client_id`,
      { headers: fetchHeaders }
    ).catch(() => null);
    const propData = propRes?.ok ? await propRes.json().catch(() => []) : [];
    const resolvedClientId = propData[0]?.client_id ?? null;

    const r = await fetch(`${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`, { method: 'DELETE', headers });
    if (!r.ok) return res.status(502).json({ error: 'Delete failed' });

    if (resolvedClientId) {
      const remRes = await fetch(
        `${supabaseUrl}/rest/v1/properties?client_id=eq.${resolvedClientId}&select=id`,
        { headers: fetchHeaders }
      ).catch(() => null);
      const remaining = remRes?.ok ? await remRes.json().catch(() => [null]) : [null];
      if (remaining.length === 0) {
        await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${resolvedClientId}`, { method: 'DELETE', headers }).catch(() => null);
      }
    }
    return res.status(200).json({ ok: true });
  }

  // ── PATCH ──────────────────────────────────────────────────────────
  if (action === 'activate') {
    const r = await fetch(`${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ is_active: true }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Update failed' });
    return res.status(200).json({ ok: true });

  } else if (action === 'deactivate') {
    const r = await fetch(`${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ is_active: false }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Update failed' });
    return res.status(200).json({ ok: true });

  } else if (action === 'payment') {
    if (!dueDate) return res.status(400).json({ error: 'dueDate is required for payment action' });
    const patch = {
      is_active:              true,
      subscription_status:   'active',
      subscription_due_date: dueDate,
      ...(amount != null ? { subscription_amount: parseFloat(amount) } : {}),
    };
    const r = await fetch(`${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`, {
      method: 'PATCH', headers, body: JSON.stringify(patch),
    });
    if (!r.ok) return res.status(502).json({ error: 'Update failed' });

    // Record in payment_history (non-fatal)
    const histRow = { property_id: propertyId, ...(amount != null ? { amount: parseFloat(amount) } : {}), due_date: dueDate };
    await fetch(`${supabaseUrl}/rest/v1/payment_history`, {
      method: 'POST', headers, body: JSON.stringify(histRow),
    }).catch(() => null);

    return res.status(200).json({ ok: true });

  } else if (action === 'change_plan') {
    if (!clientId || !plan) return res.status(400).json({ error: 'clientId and plan are required' });
    const allowed = ['free', 'starter', 'pro'];
    if (!allowed.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
    const r = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${clientId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ plan }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Update failed' });
    return res.status(200).json({ ok: true });

  } else {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}

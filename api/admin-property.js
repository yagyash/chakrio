/**
 * Vercel Serverless Function — /api/admin-property
 *
 * PATCH { propertyId, action: 'activate'|'deactivate'|'payment'|'change_plan', ... }
 * POST  { action: 'send_message', propertyId, message }
 * DELETE { propertyId }
 *
 * Every successful action is recorded in the admin_actions table.
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

async function logAction(supabaseUrl, supabaseKey, { actionType, description, propertyName, performedBy }) {
  await fetch(`${supabaseUrl}/rest/v1/admin_actions`, {
    method:  'POST',
    headers: {
      apikey:         supabaseKey,
      Authorization:  `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer:         'return=minimal',
    },
    body: JSON.stringify({
      action_type:   actionType,
      description,
      property_name: propertyName ?? null,
      performed_by:  performedBy ?? null,
    }),
  }).catch(() => null); // non-fatal
}

async function getPropertyName(supabaseUrl, supabaseKey, propertyId) {
  const r = await fetch(
    `${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}&select=property_name&limit=1`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' } }
  ).catch(() => null);
  const rows = r?.ok ? await r.json().catch(() => []) : [];
  return rows[0]?.property_name ?? null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!['PATCH', 'DELETE', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req);
  if (!admin) return res.status(403).json({ error: 'Forbidden' });

  const adminEmail = admin.email ?? 'unknown';
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey:         supabaseKey,
    Authorization:  `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer:         'return=minimal',
  };

  // ── POST run_auto_complete ─────────────────────────────────────────
  if (req.method === 'POST' && (req.body?.action === 'run_auto_complete')) {
    const agentUrl = process.env.CHAKRIO_AGENT_URL;
    const secret   = process.env.ONBOARD_SECRET;
    if (!agentUrl || !secret) return res.status(500).json({ error: 'Agent not configured' });
    const r = await fetch(`${agentUrl}/admin/run-auto-complete`, {
      method: 'POST',
      headers: { 'X-Onboard-Secret': secret },
    }).catch(() => null);
    if (!r || !r.ok) return res.status(502).json({ error: 'Auto-complete trigger failed' });
    await logAction(supabaseUrl, supabaseKey, {
      actionType: 'auto_complete', description: 'Manual auto-complete triggered', performedBy: adminEmail,
    });
    return res.status(200).json({ ok: true });
  }

  // ── POST send_message ──────────────────────────────────────────────
  if (req.method === 'POST') {
    const { action, propertyId, message } = req.body ?? {};
    if (action !== 'send_message' || !propertyId || !message?.trim()) {
      return res.status(400).json({ error: 'action, propertyId, and message are required' });
    }
    const agentUrl = process.env.CHAKRIO_AGENT_URL;
    const secret   = process.env.ONBOARD_SECRET;
    if (!agentUrl || !secret) return res.status(500).json({ error: 'Agent not configured' });

    const propName = await getPropertyName(supabaseUrl, supabaseKey, propertyId);

    const r = await fetch(`${agentUrl}/admin/notify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Onboard-Secret': secret },
      body:    JSON.stringify({ property_id: propertyId, message }),
    }).catch(() => null);

    if (!r || !r.ok) {
      const detail = r ? await r.json().catch(() => ({})) : {};
      return res.status(502).json({ error: detail.detail || 'Failed to send message' });
    }

    await logAction(supabaseUrl, supabaseKey, {
      actionType:   'send_message',
      description:  `Message sent to ${propName ?? propertyId}`,
      propertyName: propName,
      performedBy:  adminEmail,
    });

    return res.status(200).json({ ok: true });
  }

  const { propertyId, action, dueDate, amount, clientId, plan, campaignId } = req.body ?? {};
  const propertyIdOptional = ['change_plan', 'pause_campaign', 'resume_campaign'].includes(action);
  if (!propertyId && !propertyIdOptional) return res.status(400).json({ error: 'propertyId is required' });

  // ── DELETE ─────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const fetchHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' };

    const propRes = await fetch(
      `${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}&select=client_id,property_name`,
      { headers: fetchHeaders }
    ).catch(() => null);
    const propData = propRes?.ok ? await propRes.json().catch(() => []) : [];
    const resolvedClientId = propData[0]?.client_id ?? null;
    const propName = propData[0]?.property_name ?? null;

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

    await logAction(supabaseUrl, supabaseKey, {
      actionType:   'delete',
      description:  `Deleted property: ${propName ?? propertyId}`,
      propertyName: propName,
      performedBy:  adminEmail,
    });

    return res.status(200).json({ ok: true });
  }

  // ── PATCH ──────────────────────────────────────────────────────────
  if (action === 'activate') {
    const propName = await getPropertyName(supabaseUrl, supabaseKey, propertyId);
    const r = await fetch(`${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ is_active: true }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Update failed' });
    await logAction(supabaseUrl, supabaseKey, {
      actionType: 'activate', description: `Activated ${propName ?? propertyId}`,
      propertyName: propName, performedBy: adminEmail,
    });
    return res.status(200).json({ ok: true });

  } else if (action === 'deactivate') {
    const propName = await getPropertyName(supabaseUrl, supabaseKey, propertyId);
    const r = await fetch(`${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ is_active: false }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Update failed' });
    await logAction(supabaseUrl, supabaseKey, {
      actionType: 'deactivate', description: `Deactivated ${propName ?? propertyId}`,
      propertyName: propName, performedBy: adminEmail,
    });
    return res.status(200).json({ ok: true });

  } else if (action === 'payment') {
    if (!dueDate) return res.status(400).json({ error: 'dueDate is required for payment action' });
    const propName = await getPropertyName(supabaseUrl, supabaseKey, propertyId);
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

    // Record in payment_history
    await fetch(`${supabaseUrl}/rest/v1/payment_history`, {
      method: 'POST', headers,
      body: JSON.stringify({ property_id: propertyId, ...(amount != null ? { amount: parseFloat(amount) } : {}), due_date: dueDate }),
    }).catch(() => null);

    const amtStr = amount ? `₹${Number(amount).toLocaleString('en-IN')} ` : '';
    await logAction(supabaseUrl, supabaseKey, {
      actionType:   'payment',
      description:  `Payment ${amtStr}recorded for ${propName ?? propertyId} — due ${dueDate}`,
      propertyName: propName,
      performedBy:  adminEmail,
    });
    return res.status(200).json({ ok: true });

  } else if (action === 'change_plan') {
    if (!clientId || !plan) return res.status(400).json({ error: 'clientId and plan are required' });
    const allowed = ['starter', 'lite', 'growth', 'pro', 'advance'];
    if (!allowed.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });

    // 1. Update Supabase clients.plan
    const r = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${clientId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ plan }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Update failed' });

    // 2. Sync plan to Firestore via agent (so dashboard gating reflects the new plan)
    const agentUrl = process.env.CHAKRIO_AGENT_URL;
    const secret   = process.env.ONBOARD_SECRET;
    if (agentUrl && secret) {
      await fetch(`${agentUrl}/admin/plan`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Onboard-Secret': secret },
        body:    JSON.stringify({ client_id: clientId, plan }),
      }).catch(() => null); // non-fatal — Supabase is source of truth
    }

    await logAction(supabaseUrl, supabaseKey, {
      actionType:  'change_plan',
      description: `Plan changed to ${plan}`,
      performedBy: adminEmail,
    });
    return res.status(200).json({ ok: true });

  } else if (action === 'pause_campaign' || action === 'resume_campaign') {
    if (!campaignId) return res.status(400).json({ error: 'campaignId is required' });
    const campaignAction = action === 'pause_campaign' ? 'pause' : 'resume';

    const agentUrl = process.env.CHAKRIO_AGENT_URL;
    const secret   = process.env.ONBOARD_SECRET;
    if (!agentUrl || !secret) return res.status(500).json({ error: 'Agent not configured' });

    // Existing backend endpoint (routers/campaigns.py PATCH) is shared-secret
    // gated only, no per-property ownership check — same one the property
    // dashboard's /campaigns page already uses, just reached via admin auth
    // instead of Firestore ownership (which an admin won't have for every
    // client's property).
    let upstream;
    try {
      upstream = await fetch(`${agentUrl}/campaigns/${campaignId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Onboard-Secret': secret },
        body:    JSON.stringify({ action: campaignAction }),
      });
    } catch {
      return res.status(502).json({ error: 'Could not reach campaign server' });
    }
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.detail ?? `Failed to ${campaignAction} campaign` });

    const propName = propertyId ? await getPropertyName(supabaseUrl, supabaseKey, propertyId) : null;
    await logAction(supabaseUrl, supabaseKey, {
      actionType:   action,
      description:  `Campaign ${campaignAction}d${propName ? ` — ${propName}` : ''}`,
      propertyName: propName,
      performedBy:  adminEmail,
    });
    return res.status(200).json(data);

  } else {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}

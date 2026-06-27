/**
 * Vercel Serverless Function — /api/campaigns
 *
 * GET  /api/campaigns?propertyId=UUID         — list campaigns for a property
 * GET  /api/campaigns?campaignId=UUID         — single campaign status
 * GET  /api/campaigns/count?propertyId=UUID   — eligible recipient count
 * POST /api/campaigns                         — create + launch a broadcast
 *
 * Security:
 *   1. Verify Firebase ID token (server-side JWKS)
 *   2. Confirm the user owns the requested propertyId (Firestore check)
 *   3. For POST: proxy to bot.chakrio.com with shared secret
 *   4. For GET:  query Supabase directly (no need to hit the bot)
 *
 * Env vars required (Vercel dashboard):
 *   FIREBASE_PROJECT_ID
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CHAKRIO_AGENT_URL   (e.g. https://bot.chakrio.com)
 *   ONBOARD_SECRET      (shared secret — same value as bot's .env)
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ------------------------------------------------------------------
// Shared: Firebase token verification
// ------------------------------------------------------------------

async function verifyToken(token, projectId) {
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    issuer:   `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload.sub;  // Firebase UID
}

// ------------------------------------------------------------------
// Shared: Firestore ownership check
// Returns array of supabase_property_id UUIDs this user owns.
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

    // Flat schema
    const flat = fields.supabase_property_id?.stringValue;
    if (flat) ids.push(flat);

    // Array schema
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
// GET helpers — query Supabase directly
// ------------------------------------------------------------------

async function supabaseFetch(path, supabaseUrl, serviceKey) {
  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    headers: {
      apikey:        serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept:        'application/json',
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

// ------------------------------------------------------------------
// Main handler
// ------------------------------------------------------------------

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  // ── Auth ──────────────────────────────────────────────────────────
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId)  return res.status(500).json({ error: 'Server configuration error' });

  let uid;
  try {
    uid = await verifyToken(token, projectId);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server configuration error' });

  // ── GET ───────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { propertyId, campaignId, action } = req.query;

    // Recipient count — how many eligible past guests with phone numbers
    if (action === 'count' && propertyId) {
      if (!UUID_RE.test(propertyId)) return res.status(400).json({ error: 'Bad request' });

      const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
      if (!ownedIds.includes(propertyId)) return res.status(403).json({ error: 'Forbidden' });

      try {
        // Get all completed bookings with a guest phone for this property
        const rows = await supabaseFetch(
          `/bookings?property_id=eq.${propertyId}&status=eq.completed&guest_phone=not.is.null&select=guest_phone`,
          supabaseUrl, serviceKey,
        );
        // Deduplicate by phone
        const uniquePhones = [...new Set(rows.map(r => r.guest_phone).filter(Boolean))];

        // Subtract opted-out phones
        let optedOut = 0;
        if (uniquePhones.length > 0) {
          const optOutRows = await supabaseFetch(
            `/marketing_opt_outs?phone=in.(${uniquePhones.join(',')})&select=phone`,
            supabaseUrl, serviceKey,
          ).catch(() => []);
          optedOut = optOutRows.length;
        }

        return res.status(200).json({ count: Math.max(0, uniquePhones.length - optedOut) });
      } catch {
        return res.status(502).json({ error: 'Failed to get recipient count' });
      }
    }

    // Single campaign status
    if (campaignId) {
      if (!UUID_RE.test(campaignId)) return res.status(400).json({ error: 'Bad request' });

      try {
        const rows = await supabaseFetch(
          `/broadcast_campaigns?id=eq.${campaignId}&select=*&limit=1`,
          supabaseUrl, serviceKey,
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });

        // Ownership: verify user owns this campaign's property
        const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
        if (!ownedIds.includes(rows[0].property_id)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        return res.status(200).json(rows[0]);
      } catch {
        return res.status(502).json({ error: 'Failed to load campaign' });
      }
    }

    // List campaigns for a property
    if (propertyId) {
      if (!UUID_RE.test(propertyId)) return res.status(400).json({ error: 'Bad request' });

      const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
      if (!ownedIds.includes(propertyId)) return res.status(403).json({ error: 'Forbidden' });

      try {
        const rows = await supabaseFetch(
          `/broadcast_campaigns?property_id=eq.${propertyId}&select=*&order=created_at.desc&limit=20`,
          supabaseUrl, serviceKey,
        );
        return res.status(200).json(rows);
      } catch {
        return res.status(502).json({ error: 'Failed to load campaigns' });
      }
    }

    return res.status(400).json({ error: 'propertyId or campaignId required' });
  }

  // ── POST — create + launch campaign ──────────────────────────────
  if (req.method === 'POST') {
    const { property_uuid, template_name, template_vars = {} } = req.body ?? {};

    if (!property_uuid || !template_name) {
      return res.status(400).json({ error: 'property_uuid and template_name are required' });
    }
    if (!UUID_RE.test(property_uuid)) {
      return res.status(400).json({ error: 'Bad request' });
    }

    // Ownership check
    const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
    if (!ownedIds.includes(property_uuid)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Proxy to bot
    const agentUrl = process.env.CHAKRIO_AGENT_URL;
    const secret   = process.env.ONBOARD_SECRET;
    if (!agentUrl || !secret) return res.status(503).json({ error: 'Campaigns not configured' });

    let upstream;
    try {
      upstream = await fetch(`${agentUrl}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type':     'application/json',
          'X-Onboard-Secret': secret,
        },
        body: JSON.stringify({ property_uuid, template_name, template_vars }),
      });
    } catch {
      return res.status(502).json({ error: 'Could not reach campaign server. Please try again.' });
    }

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.detail ?? 'Failed to launch campaign' });

    return res.status(200).json(data);
  }

  // ── PATCH — pause / resume campaign ─────────────────────────────
  if (req.method === 'PATCH') {
    const { campaignId } = req.query;
    const { action } = req.body ?? {};

    if (!campaignId || !UUID_RE.test(campaignId)) {
      return res.status(400).json({ error: 'campaignId required' });
    }
    if (!['pause', 'resume'].includes(action)) {
      return res.status(400).json({ error: 'action must be pause or resume' });
    }

    // Ownership: fetch campaign → verify property ownership
    try {
      const rows = await supabaseFetch(
        `/broadcast_campaigns?id=eq.${campaignId}&select=property_id&limit=1`,
        supabaseUrl, serviceKey,
      );
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
      if (!ownedIds.includes(rows[0].property_id)) return res.status(403).json({ error: 'Forbidden' });
    } catch {
      return res.status(502).json({ error: 'Ownership check failed' });
    }

    const agentUrl = process.env.CHAKRIO_AGENT_URL;
    const secret   = process.env.ONBOARD_SECRET;
    if (!agentUrl || !secret) return res.status(503).json({ error: 'Campaigns not configured' });

    try {
      const upstream = await fetch(`${agentUrl}/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type':     'application/json',
          'X-Onboard-Secret': secret,
        },
        body: JSON.stringify({ action }),
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return res.status(upstream.status).json({ error: data.detail ?? 'Failed' });
      return res.status(200).json(data);
    } catch {
      return res.status(502).json({ error: 'Could not reach campaign server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

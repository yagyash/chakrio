/**
 * Vercel Serverless Function — /api/marketing
 *
 * Merges the former api/campaigns.js and api/wallet.js — both are
 * marketing-wallet-funded features already loaded together on the same
 * page (Campaigns.jsx), and merging keeps the deployment under Vercel's
 * Hobby-plan 12-function cap (this repo has hit that limit twice now:
 * 489d6a8 folded is-admin into admin-clients, then geo-tile got folded
 * into wallet.js and STILL wasn't enough headroom — so wallet.js is
 * folded again, into this file, rather than adding yet another function
 * later and re-hitting the same wall).
 *
 * GET  ?action=campaigns&propertyId=UUID        — list campaigns for a property
 * GET  ?action=campaign&campaignId=UUID         — single campaign status
 * GET  ?action=campaign-count&propertyId=UUID   — eligible recipient count
 * GET  ?action=wallet&propertyId=UUID           — wallet balance + last 20 transactions
 * GET  ?action=geo-tile&propertyId=UUID         — geo-grid + AI-citation dashboard data
 * POST ?action=launch-campaign                  — create + launch a broadcast
 * POST ?action=topup                            — create wallet topup (Razorpay payment_url)
 * PATCH ?campaignId=UUID                        — pause/resume a campaign (body: { action })
 *
 * Security:
 *   1. Verify Firebase ID token (server-side JWKS)
 *   2. Confirm the user owns the requested propertyId/campaign (Firestore + Supabase)
 *   3. For CHAKRIO_AGENT_URL-bound calls: proxy with the shared secret
 *   4. For plain reads: query Supabase directly (no need to hit the bot)
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

    const flat = fields.supabase_property_id?.stringValue;
    if (flat) ids.push(flat);

    for (const v of (fields.properties?.arrayValue?.values ?? [])) {
      const uuid = v.mapValue?.fields?.supabase_property_id?.stringValue;
      if (uuid) ids.push(uuid);
    }

    return ids;
  } catch {
    return [];
  }
}

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
// GET handlers
// ------------------------------------------------------------------

async function getCampaignCount({ propertyId, uid, token, projectId, supabaseUrl, serviceKey, res }) {
  if (!propertyId || !UUID_RE.test(propertyId)) return res.status(400).json({ error: 'Bad request' });

  const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
  if (!ownedIds.includes(propertyId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const rows = await supabaseFetch(
      `/bookings?property_id=eq.${propertyId}&status=eq.completed&guest_phone=not.is.null&select=guest_phone`,
      supabaseUrl, serviceKey,
    );
    const uniquePhones = [...new Set(rows.map(r => r.guest_phone).filter(Boolean))];

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

async function getCampaign({ campaignId, uid, token, projectId, supabaseUrl, serviceKey, res }) {
  if (!campaignId || !UUID_RE.test(campaignId)) return res.status(400).json({ error: 'Bad request' });

  try {
    const rows = await supabaseFetch(
      `/broadcast_campaigns?id=eq.${campaignId}&select=*&limit=1`,
      supabaseUrl, serviceKey,
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
    if (!ownedIds.includes(rows[0].property_id)) return res.status(403).json({ error: 'Forbidden' });
    return res.status(200).json(rows[0]);
  } catch {
    return res.status(502).json({ error: 'Failed to load campaign' });
  }
}

async function getCampaigns({ propertyId, uid, token, projectId, supabaseUrl, serviceKey, res }) {
  if (!propertyId || !UUID_RE.test(propertyId)) return res.status(400).json({ error: 'Bad request' });

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

async function getWallet({ propertyId, uid, token, projectId, agentUrl, secret, res }) {
  if (!propertyId || !UUID_RE.test(propertyId)) return res.status(400).json({ error: 'propertyId required' });

  const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
  if (!ownedIds.includes(propertyId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const upstream = await fetch(`${agentUrl}/properties/${propertyId}/wallet`, {
      headers: { 'X-Onboard-Secret': secret },
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.detail ?? 'Failed' });
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Could not reach wallet server' });
  }
}

async function getGeoTile({ propertyId, uid, token, projectId, agentUrl, secret, res }) {
  if (!propertyId || !UUID_RE.test(propertyId)) return res.status(400).json({ error: 'propertyId required' });

  const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
  if (!ownedIds.includes(propertyId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const upstream = await fetch(`${agentUrl}/properties/${propertyId}/geo-insights`, {
      headers: { 'X-Onboard-Secret': secret },
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.detail ?? 'Failed' });
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Could not reach geo tile server' });
  }
}

// ------------------------------------------------------------------
// Main handler
// ------------------------------------------------------------------

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return res.status(500).json({ error: 'Server configuration error' });

  let uid;
  try {
    uid = await verifyToken(token, projectId);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const agentUrl    = process.env.CHAKRIO_AGENT_URL;
  const secret      = process.env.ONBOARD_SECRET;

  // ── GET ───────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { propertyId, campaignId, action } = req.query;
    const ctx = { propertyId, campaignId, uid, token, projectId, supabaseUrl, serviceKey, agentUrl, secret, res };

    if (action === 'campaign-count') {
      if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server configuration error' });
      return getCampaignCount(ctx);
    }
    if (action === 'campaign') {
      if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server configuration error' });
      return getCampaign(ctx);
    }
    if (action === 'campaigns') {
      if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server configuration error' });
      return getCampaigns(ctx);
    }
    if (action === 'wallet') {
      if (!agentUrl || !secret) return res.status(503).json({ error: 'Wallet not configured' });
      return getWallet(ctx);
    }
    if (action === 'geo-tile') {
      if (!agentUrl || !secret) return res.status(503).json({ error: 'Geo tile not configured' });
      return getGeoTile(ctx);
    }
    return res.status(400).json({ error: 'Unknown or missing action' });
  }

  // ── POST ──────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { action } = req.query;

    if (action === 'topup') {
      const { property_uuid, amount } = req.body ?? {};
      if (!property_uuid || !UUID_RE.test(property_uuid)) {
        return res.status(400).json({ error: 'property_uuid required' });
      }
      if (!amount || typeof amount !== 'number' || amount < 10) {
        return res.status(400).json({ error: 'Minimum topup is ₹10' });
      }
      const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
      if (!ownedIds.includes(property_uuid)) return res.status(403).json({ error: 'Forbidden' });

      if (!agentUrl || !secret) return res.status(503).json({ error: 'Wallet not configured' });
      try {
        const upstream = await fetch(`${agentUrl}/properties/${property_uuid}/wallet/topup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Onboard-Secret': secret },
          body: JSON.stringify({ amount }),
        });
        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) return res.status(upstream.status).json({ error: data.detail ?? 'Failed to create topup' });
        return res.status(200).json(data);
      } catch {
        return res.status(502).json({ error: 'Could not reach wallet server' });
      }
    }

    if (action === 'launch-campaign') {
      const { property_uuid, template_name, template_vars = {} } = req.body ?? {};
      if (!property_uuid || !template_name) {
        return res.status(400).json({ error: 'property_uuid and template_name are required' });
      }
      if (!UUID_RE.test(property_uuid)) return res.status(400).json({ error: 'Bad request' });

      const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
      if (!ownedIds.includes(property_uuid)) return res.status(403).json({ error: 'Forbidden' });

      if (!agentUrl || !secret) return res.status(503).json({ error: 'Campaigns not configured' });
      let upstream;
      try {
        upstream = await fetch(`${agentUrl}/campaigns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Onboard-Secret': secret },
          body: JSON.stringify({ property_uuid, template_name, template_vars }),
        });
      } catch {
        return res.status(502).json({ error: 'Could not reach campaign server. Please try again.' });
      }
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return res.status(upstream.status).json({ error: data.detail ?? 'Failed to launch campaign' });
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Unknown or missing action' });
  }

  // ── PATCH — pause / resume campaign ─────────────────────────────
  if (req.method === 'PATCH') {
    const { campaignId } = req.query;
    const { action } = req.body ?? {};

    if (!campaignId || !UUID_RE.test(campaignId)) return res.status(400).json({ error: 'campaignId required' });
    if (!['pause', 'resume'].includes(action)) return res.status(400).json({ error: 'action must be pause or resume' });
    if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server configuration error' });

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

    if (!agentUrl || !secret) return res.status(503).json({ error: 'Campaigns not configured' });
    try {
      const upstream = await fetch(`${agentUrl}/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Onboard-Secret': secret },
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

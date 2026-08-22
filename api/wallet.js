/**
 * Vercel Serverless Function — /api/wallet
 *
 * GET  /api/wallet?propertyId=UUID                    — wallet balance + last 20 transactions
 * GET  /api/wallet?propertyId=UUID&action=geo-tile     — geo-grid + AI-citation dashboard data
 * POST /api/wallet                                     — create topup (returns Razorpay payment_url)
 *
 * geo-tile shares this file rather than being its own function — Vercel's
 * Hobby plan caps a deployment at 12 serverless functions (see
 * admin-clients.js's `action` query param for the same pattern; this repo
 * already hit that cap once before, see 489d6a8).
 *
 * Security:
 *   1. Verify Firebase ID token (server-side JWKS)
 *   2. Confirm user owns the propertyId (Firestore check)
 *   3. Proxy to bot.chakrio.com with shared secret
 *
 * Env vars:
 *   FIREBASE_PROJECT_ID
 *   CHAKRIO_AGENT_URL   (e.g. https://bot.chakrio.com)
 *   ONBOARD_SECRET
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifyToken(token, projectId) {
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    issuer:   `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload.sub;
}

async function getOwnerPropertyIds(uid, token, projectId) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const doc    = await res.json();
    const fields = doc.fields ?? {};
    const ids    = [];
    const flat   = fields.supabase_property_id?.stringValue;
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

  const agentUrl = process.env.CHAKRIO_AGENT_URL;
  const secret   = process.env.ONBOARD_SECRET;
  if (!agentUrl || !secret) return res.status(503).json({ error: 'Wallet not configured' });

  // ── GET — balance + transactions, or geo-tile data ───────────────
  if (req.method === 'GET') {
    const { propertyId, action } = req.query;
    if (!propertyId || !UUID_RE.test(propertyId)) {
      return res.status(400).json({ error: 'propertyId required' });
    }
    const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
    if (!ownedIds.includes(propertyId)) return res.status(403).json({ error: 'Forbidden' });

    if (action === 'geo-tile') {
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

  // ── POST — create topup ────────────────────────────────────────
  if (req.method === 'POST') {
    const { property_uuid, amount } = req.body ?? {};
    if (!property_uuid || !UUID_RE.test(property_uuid)) {
      return res.status(400).json({ error: 'property_uuid required' });
    }
    if (!amount || typeof amount !== 'number' || amount < 10) {
      return res.status(400).json({ error: 'Minimum topup is ₹10' });
    }
    const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
    if (!ownedIds.includes(property_uuid)) return res.status(403).json({ error: 'Forbidden' });

    try {
      const upstream = await fetch(`${agentUrl}/properties/${property_uuid}/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type':     'application/json',
          'X-Onboard-Secret': secret,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return res.status(upstream.status).json({ error: data.detail ?? 'Failed to create topup' });
      return res.status(200).json(data);
    } catch {
      return res.status(502).json({ error: 'Could not reach wallet server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

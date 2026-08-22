/**
 * Vercel Serverless Function — /api/geo-tile
 *
 * GET /api/geo-tile?propertyId=UUID — local rank-tracking grid + AI-citation
 * trend for one property, sourced from Sitrelio via chakrio-agent. Feature-
 * flagged per property (geo_tracking_enabled) — most properties will get
 * { enabled: false } back, which the dashboard tile treats as "not shown".
 *
 * Security: identical to /api/wallet — verify Firebase ID token, confirm
 * the caller owns propertyId (Firestore), then proxy to bot.chakrio.com
 * with the shared secret. The browser never talks to chakrio-agent or
 * Sitrelio directly.
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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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
  if (!agentUrl || !secret) return res.status(503).json({ error: 'Geo tile not configured' });

  const { propertyId } = req.query;
  if (!propertyId || !UUID_RE.test(propertyId)) {
    return res.status(400).json({ error: 'propertyId required' });
  }
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

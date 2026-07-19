/**
 * Vercel Serverless Function — /api/media
 *
 * GET  /api/media?propertyId=UUID                                    → list media
 * GET  /api/media?propertyId=UUID&action=signed-upload&filename=...  → signed upload URL
 * POST /api/media?propertyId=UUID  body:{storage_path, media_type}   → record after upload
 * DELETE /api/media?propertyId=UUID&mediaId=UUID                     → delete
 *
 * Security: Firebase ID token → Firestore ownership check → proxy to bot.chakrio.com
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
  if (!agentUrl || !secret) return res.status(503).json({ error: 'Service not configured' });

  const { propertyId, mediaId, action, filename, contentType } = req.query;
  if (!propertyId || !UUID_RE.test(propertyId)) {
    return res.status(400).json({ error: 'propertyId required' });
  }

  const ownedIds = await getOwnerPropertyIds(uid, token, projectId);
  if (!ownedIds.includes(propertyId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    if (req.method === 'GET' && action === 'signed-upload') {
      const params = new URLSearchParams({ property_id: propertyId });
      if (filename) params.set('filename', filename);
      if (contentType) params.set('content_type', contentType);
      const up = await fetch(`${agentUrl}/media/signed-upload?${params}`, {
        headers: { 'X-Onboard-Secret': secret },
      });
      const data = await up.json().catch(() => ({}));
      if (!up.ok) return res.status(up.status).json({ error: data.detail ?? 'Failed' });
      return res.status(200).json(data);
    }

    if (req.method === 'GET') {
      const up = await fetch(`${agentUrl}/media/${propertyId}`, {
        headers: { 'X-Onboard-Secret': secret },
      });
      const data = await up.json().catch(() => ({}));
      if (!up.ok) return res.status(up.status).json({ error: data.detail ?? 'Failed' });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const up = await fetch(`${agentUrl}/media/record?property_id=${propertyId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-Onboard-Secret': secret },
        body:    JSON.stringify(req.body),
      });
      const data = await up.json().catch(() => ({}));
      if (!up.ok) return res.status(up.status).json({ error: data.detail ?? 'Failed' });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      if (!mediaId || !UUID_RE.test(mediaId)) return res.status(400).json({ error: 'mediaId required' });
      const up = await fetch(`${agentUrl}/media/${mediaId}`, {
        method:  'DELETE',
        headers: { 'X-Onboard-Secret': secret },
      });
      const data = await up.json().catch(() => ({}));
      if (!up.ok) return res.status(up.status).json({ error: data.detail ?? 'Failed' });
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch {
    return res.status(502).json({ error: 'Could not reach service' });
  }
}

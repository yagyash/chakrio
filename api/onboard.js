/**
 * Vercel Serverless Function — POST /api/onboard
 *
 * Proxies the onboarding request to the chakrio-agent backend.
 * No auth required — the form is publicly accessible.
 * Rate-limiting / abuse protection is left to Vercel's infra.
 *
 * Env vars required (Vercel Dashboard):
 *   CHAKRIO_AGENT_URL   https://bot.chakrio.com  (no trailing slash)
 *   ONBOARD_SECRET      shared secret matching agent's .env
 */

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const agentUrl    = process.env.CHAKRIO_AGENT_URL;
  const secret      = process.env.ONBOARD_SECRET;

  if (!agentUrl || !secret) {
    return res.status(503).json({ error: 'Onboarding is not configured on this server.' });
  }

  let upstream;
  try {
    upstream = await fetch(`${agentUrl}/onboard`, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'X-Onboard-Secret': secret,
      },
      body: JSON.stringify(req.body),
    });
  } catch {
    return res.status(502).json({ error: 'Could not reach onboarding server. Please try again.' });
  }

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return res.status(upstream.status).json({ error: data.detail ?? 'Onboarding failed.' });
  }

  return res.status(200).json(data);
}

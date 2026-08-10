/**
 * Vercel Serverless Function — POST /api/leads
 *
 * Proxies a free-tool lead (name + WhatsApp + which tool) to the chakrio-agent
 * backend, which stores it, alerts the admin on Telegram, and sends the
 * WhatsApp thank-you. No auth required — the free tool pages are public.
 *
 * Env vars required (Vercel Dashboard, same ones api/onboard.js already uses):
 *   CHAKRIO_AGENT_URL   https://bot.chakrio.com  (no trailing slash)
 *   ONBOARD_SECRET      shared secret matching agent's .env
 */

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const agentUrl = process.env.CHAKRIO_AGENT_URL;
  const secret   = process.env.ONBOARD_SECRET;

  if (!agentUrl || !secret) {
    return res.status(503).json({ error: 'Lead capture is not configured on this server.' });
  }

  let upstream;
  try {
    upstream = await fetch(`${agentUrl}/leads`, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'X-Onboard-Secret': secret,
      },
      body: JSON.stringify(req.body),
    });
  } catch {
    return res.status(502).json({ error: 'Could not reach lead capture server.' });
  }

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return res.status(upstream.status).json({ error: data.detail ?? 'Lead capture failed.' });
  }

  return res.status(200).json(data);
}

/**
 * Vercel Serverless Function — POST /api/log-error
 *
 * Receives frontend JS error payloads and forwards them to Telegram.
 * Env vars required (Vercel dashboard, NO VITE_ prefix):
 *   TELEGRAM_BOT_TOKEN
 *   ADMIN_CHAT_ID
 */

const RATE_MS = 5 * 60 * 1000  // 5 minutes
const _cache = new Map()        // signature → last_sent_ms (resets on cold start)

function _sig(p) {
  const key = (p.message ?? '') + String(p.stack ?? '').slice(0, 60)
  let h = 5381
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h) ^ key.charCodeAt(i)
  return (h >>> 0).toString(16).slice(0, 8)
}

function _limited(sig) {
  const now = Date.now()
  if (now - (_cache.get(sig) ?? 0) < RATE_MS) return true
  _cache.set(sig, now)
  return false
}

function _esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function _format(p) {
  const icon = p.type === 'onerror' ? '🔴' : '🟠'
  const label = p.type === 'onerror' ? 'JS Error' : 'Unhandled Rejection'
  const src = p.source
    ? `\n<b>Source:</b> ${_esc(p.source)}${p.lineno ? `:${p.lineno}:${p.colno}` : ''}`
    : ''
  const stack = p.stack ? `\n\n<code>${_esc(p.stack)}</code>` : ''
  return (
    `${icon} <b>Chakrio Web — ${label}</b>\n` +
    `<b>Time:</b> ${p.timestamp ?? new Date().toISOString()}\n` +
    `<b>Message:</b> ${_esc(p.message).slice(0, 300)}` +
    src +
    `\n<b>URL:</b> ${_esc(p.url).slice(0, 150)}` +
    stack
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.ADMIN_CHAT_ID
  if (!token || !chatId) return res.status(204).end()

  let payload
  try {
    // navigator.sendBeacon sends Content-Type: text/plain — parse manually
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    payload = JSON.parse(raw)
  } catch {
    return res.status(400).end()
  }

  if (!payload?.message) return res.status(400).end()
  if (_limited(_sig(payload))) return res.status(429).end()

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: _format(payload), parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch { /* best-effort — don't surface Telegram errors to browser */ }

  return res.status(204).end()
}

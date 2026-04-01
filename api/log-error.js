/**
 * Vercel Serverless Function — POST /api/log-error
 *
 * Receives frontend JS error payloads and forwards them to Telegram.
 * Env vars required (Vercel dashboard, NO VITE_ prefix):
 *   TELEGRAM_BOT_TOKEN
 *   ADMIN_CHAT_ID
 *   ALLOWED_ORIGINS  (comma-separated, e.g. "https://chakrio.com,https://chakrio.vercel.app")
 */

const RATE_MS = 5 * 60 * 1000   // 5 minutes per error signature
const IP_RATE_MS = 60 * 1000     // 1 minute per IP
const IP_MAX_REQS = 5            // max 5 requests per IP per minute
const _sigCache = new Map()      // signature → last_sent_ms
const _ipCache  = new Map()      // ip → { count, window_start }

// Allowed origins: your production domain(s). Requests from other origins are rejected.
function _getAllowedOrigins() {
  const env = process.env.ALLOWED_ORIGINS ?? 'https://chakrio.com,https://chakrio.vercel.app'
  return env.split(',').map(s => s.trim()).filter(Boolean)
}

function _isOriginAllowed(req) {
  const origin = req.headers['origin'] ?? ''
  if (!origin) return false  // sendBeacon always sends Origin; absent = server-side caller
  return _getAllowedOrigins().some(o => origin === o)
}

function _getClientIp(req) {
  // Vercel sets x-forwarded-for; take the first (leftmost = client) IP
  const xff = req.headers['x-forwarded-for'] ?? ''
  return xff.split(',')[0].trim() || 'unknown'
}

function _isIpRateLimited(ip) {
  const now = Date.now()
  const entry = _ipCache.get(ip) ?? { count: 0, window_start: now }
  if (now - entry.window_start > IP_RATE_MS) {
    // New window
    _ipCache.set(ip, { count: 1, window_start: now })
    return false
  }
  if (entry.count >= IP_MAX_REQS) return true
  entry.count++
  _ipCache.set(ip, entry)
  return false
}

function _isSigRateLimited(sig) {
  const now = Date.now()
  if (now - (_sigCache.get(sig) ?? 0) < RATE_MS) return true
  _sigCache.set(sig, now)
  return false
}

function _sig(p) {
  const key = (p.message ?? '') + String(p.stack ?? '').slice(0, 60)
  let h = 5381
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h) ^ key.charCodeAt(i)
  return (h >>> 0).toString(16).slice(0, 8)
}

function _esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function _format(p) {
  const icon  = p.type === 'onerror' ? '🔴' : '🟠'
  const label = p.type === 'onerror' ? 'JS Error' : 'Unhandled Rejection'
  const src   = p.source
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
  // Only allow POST
  if (req.method !== 'POST') return res.status(405).end()

  // ── Origin check — must come from our own domain ──────────────────────────
  if (!_isOriginAllowed(req)) return res.status(403).end()

  // ── IP rate limit — prevent rapid-fire from a single IP ───────────────────
  const ip = _getClientIp(req)
  if (_isIpRateLimited(ip)) return res.status(429).end()

  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.ADMIN_CHAT_ID
  if (!token || !chatId) return res.status(204).end()

  // ── Parse body (sendBeacon sends Content-Type: text/plain) ────────────────
  let payload
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    payload = JSON.parse(raw)
  } catch {
    return res.status(400).end()
  }

  // ── Basic payload validation ───────────────────────────────────────────────
  if (!payload?.message || typeof payload.message !== 'string') return res.status(400).end()
  if (!['onerror', 'unhandledrejection'].includes(payload.type)) return res.status(400).end()

  // ── Signature-based rate limit — deduplicate identical errors ─────────────
  if (_isSigRateLimited(_sig(payload))) return res.status(429).end()

  // ── Forward to Telegram ───────────────────────────────────────────────────
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

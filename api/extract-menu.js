/**
 * Vercel Serverless Function — POST /api/extract-menu
 *
 * Accepts a multipart/form-data POST with a single file field ("file").
 * Supported types: image/jpeg, image/png, application/pdf
 * Max size: 4 MB (Vercel body limit is 4.5 MB)
 *
 * Auth: requires Firebase ID token in Authorization: Bearer <token> header.
 *
 * Flow:
 *   1. Verify Firebase ID token
 *   2. Parse raw multipart body — extract file bytes + MIME type
 *   3. For images: call GPT-4o vision with base64 data URL
 *      For PDFs: extract text via pdf-parse, call GPT-4o with extracted text
 *   4. Parse JSON from GPT-4o response
 *   5. Return { items: [...] }
 *
 * Env vars (Vercel dashboard, no VITE_ prefix):
 *   OPENAI_API_KEY         OpenAI API key
 *   FIREBASE_PROJECT_ID    Firebase project ID
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const VALID_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts', 'Specials'];

const EXTRACTION_PROMPT = `Extract ALL menu items from this menu.

Return ONLY a valid JSON object in this exact format — no markdown, no explanation:
{
  "items": [
    {
      "name": "Item Name",
      "category": "one of: Breakfast, Lunch, Dinner, Snacks, Beverages, Desserts, Specials",
      "price": 150,
      "isVeg": true,
      "description": "brief description or empty string"
    }
  ]
}

Rules:
- category MUST be exactly one of: Breakfast, Lunch, Dinner, Snacks, Beverages, Desserts, Specials. If the section doesn't map clearly, use "Specials".
- price MUST be a number (integer or decimal). If price is not visible or unclear, use 0.
- isVeg MUST be true or false. Infer from item name and description (words like Chicken, Mutton, Fish, Egg, Prawn, Meat → false). Default to false if uncertain.
- description should be a short plain-text description. If none is on the menu, use "".
- Include every item you can read. Do not skip items.
- If no items can be found, return { "items": [] }.`;

// ---------------------------------------------------------------------------
// Multipart parser — zero dependencies
// ---------------------------------------------------------------------------

function parseMultipart(bodyBuffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/i);
  if (!boundaryMatch) throw new Error('No boundary in Content-Type');
  const boundary = boundaryMatch[1] ?? boundaryMatch[2];

  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = 0;

  while (start < bodyBuffer.length) {
    const delimIdx = bodyBuffer.indexOf(delimiter, start);
    if (delimIdx === -1) break;
    const afterDelim = delimIdx + delimiter.length;
    // Final boundary ends with --
    if (bodyBuffer[afterDelim] === 45 && bodyBuffer[afterDelim + 1] === 45) break;
    const headerStart = afterDelim + 2; // skip \r\n
    const headerEnd = bodyBuffer.indexOf(Buffer.from('\r\n\r\n'), headerStart);
    if (headerEnd === -1) break;
    const headerStr = bodyBuffer.slice(headerStart, headerEnd).toString('utf8');
    const bodyStart = headerEnd + 4;
    const nextDelim = bodyBuffer.indexOf(delimiter, bodyStart);
    const bodyEnd = nextDelim === -1 ? bodyBuffer.length : nextDelim - 2; // strip trailing \r\n
    parts.push({ headers: headerStr, body: bodyBuffer.slice(bodyStart, bodyEnd) });
    start = nextDelim === -1 ? bodyBuffer.length : nextDelim;
  }

  for (const part of parts) {
    if (!part.headers.includes('name="file"')) continue;
    const ctMatch = part.headers.match(/Content-Type:\s*([^\r\n]+)/i);
    if (!ctMatch) continue;
    const mimeType = ctMatch[1].trim();
    return { mimeType, fileBytes: part.body };
  }
  throw new Error('No file field found in multipart body');
}

// ---------------------------------------------------------------------------
// Read full request body as Buffer
// ---------------------------------------------------------------------------

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > MAX_BYTES) {
        req.destroy();
        reject(new Error('File too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Build OpenAI request body
// ---------------------------------------------------------------------------

function buildOpenAIRequest(mimeType, fileBytes) {
  if (mimeType === 'application/pdf') {
    // PDF: text will be extracted and sent separately — this path is not used directly
    // (handled inline in handler)
    return null;
  }

  const base64Data = fileBytes.toString('base64');
  return {
    model: 'gpt-4o',
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Data}` },
          },
          {
            type: 'text',
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Parse and sanitise Claude/GPT response text → items array
// ---------------------------------------------------------------------------

function parseItems(rawText) {
  // Strip accidental markdown fences
  const jsonStr = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed.items)) throw new Error('No items array in response');

  return parsed.items
    .map(item => ({
      name:        String(item.name        ?? '').trim(),
      category:    CATEGORIES.includes(item.category) ? item.category : 'Specials',
      price:       isFinite(Number(item.price)) ? Number(item.price) : 0,
      isVeg:       typeof item.isVeg === 'boolean' ? item.isVeg : false,
      description: String(item.description ?? '').trim(),
    }))
    .filter(item => item.name.length > 0);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Verify Firebase ID token ──────────────────────────────────────────
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const projectId  = process.env.FIREBASE_PROJECT_ID;
  const openAIKey  = process.env.OPENAI_API_KEY;

  if (!projectId || !openAIKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    await jwtVerify(token, FIREBASE_JWKS, {
      issuer:   `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── 2. Read + parse multipart body ───────────────────────────────────────
  let fileBytes, mimeType;
  try {
    const bodyBuffer = await readBody(req);
    const contentType = req.headers['content-type'] ?? '';
    ({ fileBytes, mimeType } = parseMultipart(bodyBuffer, contentType));
  } catch (e) {
    const msg = e.message === 'File too large'
      ? 'File exceeds 4 MB limit'
      : `Upload error: ${e.message}`;
    return res.status(400).json({ error: msg });
  }

  if (!VALID_MIME_TYPES.has(mimeType)) {
    return res.status(400).json({ error: `Unsupported file type: ${mimeType}. Use JPG, PNG, or PDF.` });
  }

  // ── 3. Build + send OpenAI request ───────────────────────────────────────
  let openAIBody;

  if (mimeType === 'application/pdf') {
    // Extract text from PDF, send as plain text to GPT-4o
    let pdfText;
    try {
      const result = await pdfParse(fileBytes);
      pdfText = result.text?.trim();
    } catch (e) {
      return res.status(400).json({ error: 'Could not read PDF. Try uploading a JPG or PNG photo of the menu instead.' });
    }
    if (!pdfText) {
      return res.status(400).json({ error: 'PDF has no extractable text. Try uploading a JPG or PNG photo of the menu instead.' });
    }
    openAIBody = {
      model: 'gpt-4o',
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `Here is the text extracted from a menu PDF:\n\n${pdfText}\n\n${EXTRACTION_PROMPT}`,
        },
      ],
    };
  } else {
    openAIBody = buildOpenAIRequest(mimeType, fileBytes);
  }

  let openAIRes;
  try {
    openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify(openAIBody),
      signal: AbortSignal.timeout(55_000),
    });
  } catch (e) {
    return res.status(504).json({ error: 'AI extraction timed out. Try a smaller or clearer image.' });
  }

  if (!openAIRes.ok) {
    const errText = await openAIRes.text().catch(() => '');
    console.error('OpenAI API error', openAIRes.status, errText);
    return res.status(502).json({ error: 'AI extraction failed. Please try again.' });
  }

  // ── 4. Parse response ─────────────────────────────────────────────────────
  let items;
  try {
    const data = await openAIRes.json();
    const rawText = data.choices?.[0]?.message?.content ?? '';
    items = parseItems(rawText);
  } catch (e) {
    console.error('Menu parse error:', e.message);
    return res.status(422).json({ error: 'Could not parse menu items from the image. Try a clearer photo.' });
  }

  return res.status(200).json({ items });
}

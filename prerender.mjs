/**
 * prerender.mjs — Runs on Vercel (and locally) after `vite build`.
 *
 * Reads pre-captured snapshots from prerender-cache/ (committed to git) and
 * injects each route's Helmet head + React body into the Vite build output.
 * Asset link/script tags come from the current build's dist/index.html so
 * hashed filenames are always correct for the deployed build.
 *
 * dist/app-shell.html is written first, as a copy of the pristine (empty)
 * vite build output — this is the file vercel.json's catch-all rewrite
 * points unmatched deep links (e.g. /dashboard, /bookings) at. index.html
 * itself is then prerendered like every other route, so `/` gets real
 * content instead of doubling as the SPA fallback.
 *
 * No Puppeteer required here. To regenerate snapshots: node prerender-capture.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const cacheDir = path.join(__dirname, 'prerender-cache');

if (!fs.existsSync(cacheDir) || fs.readdirSync(cacheDir).filter(f => f.endsWith('.json')).length === 0) {
  console.log('prerender-cache/ is empty — run node prerender-capture.mjs locally to generate snapshots.');
  process.exit(0);
}

// Build's dist/index.html has the correct hashed asset link/script tags.
// Strip the few page-specific tags that come from snapshots instead.
const distIndexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// Preserve the pristine empty shell as the SPA-fallback target before
// index.html itself gets overwritten with real homepage content below.
fs.writeFileSync(path.join(distDir, 'app-shell.html'), distIndexHtml, 'utf-8');
console.log('✓ Wrote SPA fallback: app-shell.html');

const headMatch = distIndexHtml.match(/<head>([\s\S]*?)<\/head>/);
const baseHead = (headMatch ? headMatch[1] : '')
  .replace(/<title>[^<]*<\/title>/g, '')
  .replace(/<meta\s[^>]*name="description"[^>]*>/g, '')
  .replace(/<link\s[^>]*rel="canonical"[^>]*>/g, '')
  .replace(/<meta\s[^>]*property="og:title"[^>]*>/g, '')
  .replace(/<meta\s[^>]*property="og:description"[^>]*>/g, '')
  .replace(/<meta\s[^>]*property="og:url"[^>]*>/g, '')
  .replace(/<meta\s[^>]*property="og:type"[^>]*>/g, '')
  .replace(/<meta\s[^>]*name="twitter:title"[^>]*>/g, '')
  .replace(/<meta\s[^>]*name="twitter:description"[^>]*>/g, '');

const cacheFiles = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
let count = 0;

for (const file of cacheFiles) {
  const { urlPath, outFile, helmetHead, bodyHtml } = JSON.parse(
    fs.readFileSync(path.join(cacheDir, file), 'utf-8'),
  );

  const html = `<!doctype html>\n<html lang="en">\n<head>\n${helmetHead}\n${baseHead}\n</head>\n<body>${bodyHtml}</body>\n</html>`;

  const outPath = path.join(distDir, outFile);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`✓ Prerendered: ${urlPath}`);
  count++;
}

console.log(`\nPrerender complete — ${count} routes injected from prerender-cache/.`);
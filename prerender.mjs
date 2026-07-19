/**
 * prerender.mjs — Runs on Vercel (and locally) after `vite build`.
 *
 * Reads pre-captured snapshots from prerender-cache/ (committed to git) and
 * injects each route's Helmet head + React body into the Vite build output.
 * Asset link/script tags come from the current build's dist/index.html so
 * hashed filenames are always correct for the deployed build.
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

  // Skip root route: dist/index.html is the SPA fallback served by the Vercel
  // catch-all rewrite for every path. Prerendering it with landing page content
  // causes every hard-refreshed dashboard URL to flash the landing page briefly.
  if (outFile === 'index.html') {
    console.log(`⏭  Skipped (SPA fallback): ${urlPath}`);
    continue;
  }

  const html = `<!doctype html>\n<html lang="en">\n<head>\n${helmetHead}\n${baseHead}\n</head>\n<body>${bodyHtml}</body>\n</html>`;

  const outPath = path.join(distDir, outFile);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`✓ Prerendered: ${urlPath}`);
  count++;
}

console.log(`\nPrerender complete — ${count} routes injected from prerender-cache/.`);
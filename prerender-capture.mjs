/**
 * prerender-capture.mjs — LOCAL ONLY. Run after `npm run build`.
 *
 * Uses Puppeteer to render each public route and saves two things per route:
 *   - helmetHead: Helmet-managed <head> tags (title, meta, JSON-LD)
 *   - bodyHtml:   React-rendered body content
 *
 * Output: prerender-cache/{slug}.json — commit these files to git.
 * Vercel's build then injects them via prerender.mjs (no Puppeteer needed there).
 *
 * Run: node prerender-capture.mjs
 * Requires: npm install puppeteer --save-dev
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.join(__dirname, 'prerender-cache');
const PORT = 4174; // different port from preview (4173) to avoid conflict

// Homepage last — dist/index.html is the SPA fallback for other routes
const ROUTES = [
  ['/dharmshala', 'dharmshala/index.html'],
  ['/privacy', 'privacy/index.html'],
  ['/terms', 'terms/index.html'],
  ['/refund-policy', 'refund-policy/index.html'],
  ['/tools/occupancy-calculator', 'tools/occupancy-calculator/index.html'],
  ['/tools/rental-income-calculator', 'tools/rental-income-calculator/index.html'],
  ['/tools/cancellation-policy', 'tools/cancellation-policy/index.html'],
  ['/tools/invoice-generator', 'tools/invoice-generator/index.html'],
  ['/', 'index.html'],
];

async function waitForServer(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {}
    await new Promise(r => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} did not start in ${timeoutMs}ms`);
}

const viteEntry = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');

// Always build a CLEAN SPA shell before capturing.
// Without this, dist/index.html may contain a previous prerender (homepage HTML),
// which would contaminate other routes' <head> with stale meta/JSON-LD.
console.log('Building fresh SPA shell for capture...');
const buildResult = await new Promise(resolve => {
  const p = spawn(process.execPath, [viteEntry, 'build'], { stdio: 'inherit', cwd: __dirname });
  p.on('close', code => resolve(code));
});
if (buildResult !== 0) throw new Error('vite build failed');

const serverProcess = spawn(
  process.execPath,
  [viteEntry, 'preview', '--port', String(PORT), '--strictPort'],
  { stdio: 'pipe', cwd: __dirname },
);
serverProcess.stderr.on('data', d => process.stderr.write(d));

try {
  console.log('Starting preview server...');
  await waitForServer(`http://localhost:${PORT}/`);

  fs.mkdirSync(cacheDir, { recursive: true });
  const browser = await puppeteer.launch({ headless: true });

  for (const [urlPath, outFile] of ROUTES) {
    const page = await browser.newPage();
    page.on('pageerror', () => {});

    await page.goto(`http://localhost:${PORT}${urlPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page
      .waitForFunction(() => document.getElementById('root')?.children?.length > 0, { timeout: 10000 })
      .catch(() => {});

    // Extract Helmet-managed head tags and body content.
    // react-helmet-async PREPENDS its tags, so querySelector returns Helmet's version first
    // — this correctly deduplicates even when dist/index.html has stale tags below.
    const { helmetHead, bodyHtml } = await page.evaluate(() => {
      const sel = (s) => { const el = document.querySelector(s); return el ? el.outerHTML : ''; };
      const tags = [
        sel('title'),
        sel('meta[name="description"]'),
        sel('link[rel="canonical"]'),
        sel('meta[property="og:title"]'),
        sel('meta[property="og:description"]'),
        sel('meta[property="og:url"]'),
        sel('meta[property="og:type"]'),
        sel('meta[name="twitter:title"]'),
        sel('meta[name="twitter:description"]'),
      ].filter(Boolean);
      // JSON-LD: multiple schemas are valid; grab all but deduplicate by @type
      const seen = new Set();
      document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
        try { const t = JSON.parse(el.textContent)['@type']; if (!seen.has(t)) { seen.add(t); tags.push(el.outerHTML); } }
        catch { tags.push(el.outerHTML); }
      });
      return { helmetHead: tags.join('\n'), bodyHtml: document.body.innerHTML };
    });

    await page.close();

    const slug = outFile.replace(/\//g, '_').replace('.html', '');
    fs.writeFileSync(
      path.join(cacheDir, `${slug}.json`),
      JSON.stringify({ urlPath, outFile, helmetHead, bodyHtml }, null, 2),
      'utf-8',
    );
    console.log(`✓ Captured: ${urlPath}`);
  }

  await browser.close();
} finally {
  serverProcess.kill();
}

console.log(`\nCapture complete — snapshots in prerender-cache/ (commit these to git)`);

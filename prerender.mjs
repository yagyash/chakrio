/**
 * prerender.mjs — Post-build SSG prerender script
 *
 * Runs after `vite build`. Launches the built SPA in a headless browser,
 * navigates to each public route, waits for React to render, then saves
 * the full HTML (body content + Helmet-managed meta) to dist/{route}/index.html.
 *
 * Requires: npm install puppeteer --save-dev (one-time)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const PORT = 4173;

// [urlPath, outputFile relative to dist/]
// Homepage MUST be last — other routes use dist/index.html as SPA fallback,
// so overwriting it before they render would contaminate their <head>.
const ROUTES = [
  ['/dharmshala', 'dharmshala/index.html'],
  ['/privacy', 'privacy/index.html'],
  ['/terms', 'terms/index.html'],
  ['/refund-policy', 'refund-policy/index.html'],
  ['/tools/occupancy-calculator', 'tools/occupancy-calculator/index.html'],
  ['/tools/rental-income-calculator', 'tools/rental-income-calculator/index.html'],
  ['/tools/cancellation-policy', 'tools/cancellation-policy/index.html'],
  ['/tools/invoice-generator', 'tools/invoice-generator/index.html'],
  ['/', 'index.html'], // last: overwrites the SPA fallback template
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
  throw new Error(`Preview server at ${url} did not start within ${timeoutMs}ms`);
}

const viteEntry = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
const serverProcess = spawn(
  process.execPath,
  [viteEntry, 'preview', '--port', String(PORT), '--strictPort'],
  { stdio: 'pipe', cwd: __dirname },
);
serverProcess.stderr.on('data', d => process.stderr.write(d));

try {
  console.log('Starting preview server...');
  await waitForServer(`http://localhost:${PORT}/`);

  const browser = await puppeteer.launch({ headless: true });

  for (const [urlPath, outFile] of ROUTES) {
    // New tab per route: prevents Helmet state from previous pages contaminating <head>
    const page = await browser.newPage();
    page.on('pageerror', () => {});

    await page.goto(`http://localhost:${PORT}${urlPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for React to mount (root div gets children populated)
    await page
      .waitForFunction(() => document.getElementById('root')?.children?.length > 0, { timeout: 10000 })
      .catch(() => {});

    const html = await page.content();
    await page.close();

    const outPath = path.join(distDir, outFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf-8');
    console.log(`✓ Prerendered: ${urlPath}`);
  }

  await browser.close();
} finally {
  serverProcess.kill();
}

console.log(`\nPrerender complete — ${ROUTES.length} routes with full body HTML.`);
/**
 * prerender.mjs — Post-build SEO prerender script
 *
 * Runs after `vite build`. Reads dist/index.html (which already has
 * correct hashed bundle references injected by Vite) and writes
 * route-specific copies with hardcoded meta tags for each public page.
 *
 * Vercel serves real static files before evaluating rewrites, so each
 * path gets its own prerendered HTML — no extra npm packages needed.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

const ROUTES = [
  {
    outPath: 'index.html',
    title: 'Chakrio — Manage Property Bookings by Message',
    description:
      'Automate property bookings, cancellations & expenses with an AI chatbot. Chakrio records everything in your dashboard automatically. Free tools for property managers.',
    canonical: 'https://chakrio.com/',
    ogUrl: 'https://chakrio.com/',
  },
  {
    outPath: 'tools/occupancy-calculator/index.html',
    title: 'Hotel Occupancy Rate Calculator — Free Tool | Chakrio',
    description:
      'Calculate your hotel or homestay occupancy rate for any period. Free online tool for property managers — no sign-up required.',
    canonical: 'https://chakrio.com/tools/occupancy-calculator',
    ogUrl: 'https://chakrio.com/tools/occupancy-calculator',
  },
  {
    outPath: 'tools/rental-income-calculator/index.html',
    title: 'Rental Income Calculator for Property — Free Tool | Chakrio',
    description:
      'Estimate gross and net rental income from your property. Enter rooms, nightly rate, occupancy and expenses to see your profit. Free tool for property managers.',
    canonical: 'https://chakrio.com/tools/rental-income-calculator',
    ogUrl: 'https://chakrio.com/tools/rental-income-calculator',
  },
  {
    outPath: 'tools/cancellation-policy/index.html',
    title: 'Hotel Cancellation Policy Generator — Free Template | Chakrio',
    description:
      'Generate a professional hotel cancellation policy in seconds. Customise deposit %, refund windows, and no-show rules. Free template for property managers.',
    canonical: 'https://chakrio.com/tools/cancellation-policy',
    ogUrl: 'https://chakrio.com/tools/cancellation-policy',
  },
];

const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

for (const route of ROUTES) {
  const metaBlock = [
    `    <title>${route.title}</title>`,
    `    <meta name="description" content="${route.description}" />`,
    `    <link rel="canonical" href="${route.canonical}" />`,
    `    <meta property="og:title" content="${route.title}" />`,
    `    <meta property="og:description" content="${route.description}" />`,
    `    <meta property="og:url" content="${route.ogUrl}" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta name="twitter:card" content="summary" />`,
    `    <meta name="twitter:title" content="${route.title}" />`,
    `    <meta name="twitter:description" content="${route.description}" />`,
  ].join('\n');

  const html = baseHtml.replace(/<title>[^<]*<\/title>/, metaBlock);

  const outPath = path.join(distDir, route.outPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`✓ Prerendered: /${route.outPath}`);
}

console.log('\nPrerender complete — 4 routes with unique meta tags.');

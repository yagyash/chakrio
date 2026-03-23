/**
 * prerender.mjs — Post-build SEO prerender script
 *
 * Runs after `vite build`. Reads dist/index.html (which already has
 * correct hashed bundle references injected by Vite) and writes
 * route-specific copies with hardcoded meta tags + JSON-LD structured data
 * for each public page.
 *
 * Vercel serves real static files before evaluating rewrites, so each
 * path gets its own prerendered HTML — no extra npm packages needed.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

const ORG_SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Chakrio',
  url: 'https://chakrio.com',
  logo: { '@type': 'ImageObject', url: 'https://chakrio.com/og-image.png', width: 1200, height: 630 },
  description: 'Chakrio is an AI-powered property booking automation tool for homestays, villas, and guesthouses in India.',
  areaServed: 'IN',
  serviceType: 'Property Management Software',
});

const ROUTES = [
  {
    outPath: 'index.html',
    title: 'Chakrio — Manage Property Bookings by Message',
    description:
      'Automate property bookings, cancellations & expenses with an AI chatbot. Chakrio records everything in your dashboard automatically. Free tools for property managers.',
    canonical: 'https://chakrio.com/',
    ogUrl: 'https://chakrio.com/',
    schemas: [
      ORG_SCHEMA,
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Chakrio', url: 'https://chakrio.com', description: 'AI-powered property booking automation for homestays, villas, and guesthouses' }),
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Chakrio', description: 'AI-powered property booking automation. Record bookings, expenses, and cancellations by sending a chat message.', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: 'https://chakrio.com', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } }),
    ],
  },
  {
    outPath: 'tools/occupancy-calculator/index.html',
    title: 'Hotel Occupancy Rate Calculator — Free Tool | Chakrio',
    description:
      'Calculate your hotel or homestay occupancy rate for any period. Free online tool for property managers — no sign-up required.',
    canonical: 'https://chakrio.com/tools/occupancy-calculator',
    ogUrl: 'https://chakrio.com/tools/occupancy-calculator',
    schemas: [
      ORG_SCHEMA,
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Hotel Occupancy Rate Calculator — Free Tool | Chakrio', url: 'https://chakrio.com/tools/occupancy-calculator', description: 'Free hotel occupancy rate calculator. Enter your rooms, period, and booked nights — get your occupancy % instantly. No sign-up required.', datePublished: '2025-01-01', dateModified: '2026-03-23', author: { '@type': 'Organization', name: 'Chakrio', url: 'https://chakrio.com' }, publisher: { '@type': 'Organization', name: 'Chakrio', logo: { '@type': 'ImageObject', url: 'https://chakrio.com/og-image.png' } } }),
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://chakrio.com/' }, { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://chakrio.com/#tools' }, { '@type': 'ListItem', position: 3, name: 'Hotel Occupancy Rate Calculator', item: 'https://chakrio.com/tools/occupancy-calculator' }] }),
    ],
  },
  {
    outPath: 'tools/rental-income-calculator/index.html',
    title: 'Rental Income Calculator for Property — Free Tool | Chakrio',
    description:
      'Estimate gross and net rental income from your property. Enter rooms, nightly rate, occupancy and expenses to see your profit. Free tool for property managers.',
    canonical: 'https://chakrio.com/tools/rental-income-calculator',
    ogUrl: 'https://chakrio.com/tools/rental-income-calculator',
    schemas: [
      ORG_SCHEMA,
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Rental Income Calculator for Property — Free Tool | Chakrio', url: 'https://chakrio.com/tools/rental-income-calculator', description: 'Estimate gross and net rental income from your property. Enter rooms, nightly rate, and occupancy % — see your monthly or annual income instantly. Free tool.', datePublished: '2025-01-01', dateModified: '2026-03-23', author: { '@type': 'Organization', name: 'Chakrio', url: 'https://chakrio.com' }, publisher: { '@type': 'Organization', name: 'Chakrio', logo: { '@type': 'ImageObject', url: 'https://chakrio.com/og-image.png' } } }),
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://chakrio.com/' }, { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://chakrio.com/#tools' }, { '@type': 'ListItem', position: 3, name: 'Rental Income Calculator', item: 'https://chakrio.com/tools/rental-income-calculator' }] }),
    ],
  },
  {
    outPath: 'tools/cancellation-policy/index.html',
    title: 'Hotel Cancellation Policy Generator — Free Template | Chakrio',
    description:
      'Generate a professional hotel cancellation policy in seconds. Customise deposit %, refund windows, and no-show rules. Free template for property managers.',
    canonical: 'https://chakrio.com/tools/cancellation-policy',
    ogUrl: 'https://chakrio.com/tools/cancellation-policy',
    schemas: [
      ORG_SCHEMA,
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Hotel Cancellation Policy Generator — Free Template | Chakrio', url: 'https://chakrio.com/tools/cancellation-policy', description: 'Generate a professional hotel cancellation policy in seconds. Customise refund windows, advance deposits, and no-show terms. Free, no sign-up needed.', datePublished: '2025-01-01', dateModified: '2026-03-23', author: { '@type': 'Organization', name: 'Chakrio', url: 'https://chakrio.com' }, publisher: { '@type': 'Organization', name: 'Chakrio', logo: { '@type': 'ImageObject', url: 'https://chakrio.com/og-image.png' } } }),
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://chakrio.com/' }, { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://chakrio.com/#tools' }, { '@type': 'ListItem', position: 3, name: 'Hotel Cancellation Policy Generator', item: 'https://chakrio.com/tools/cancellation-policy' }] }),
    ],
  },
];

const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

for (const route of ROUTES) {
  const schemaScripts = route.schemas
    .map(s => `    <script type="application/ld+json">${s}</script>`)
    .join('\n');

  const metaBlock = [
    `    <title>${route.title}</title>`,
    `    <meta name="description" content="${route.description}" />`,
    `    <link rel="canonical" href="${route.canonical}" />`,
    `    <meta property="og:title" content="${route.title}" />`,
    `    <meta property="og:description" content="${route.description}" />`,
    `    <meta property="og:url" content="${route.ogUrl}" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:image" content="https://chakrio.com/og-image.png" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${route.title}" />`,
    `    <meta name="twitter:description" content="${route.description}" />`,
    `    <meta name="twitter:image" content="https://chakrio.com/og-image.png" />`,
    `    <meta name="robots" content="index, follow" />`,
    schemaScripts,
  ].join('\n');

  const html = baseHtml.replace(/<title>[^<]*<\/title>/, metaBlock);

  const outPath = path.join(distDir, route.outPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`✓ Prerendered: /${route.outPath}`);
}

console.log('\nPrerender complete — 4 routes with unique meta tags + JSON-LD.');

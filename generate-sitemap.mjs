/**
 * generate-sitemap.mjs — Runs on Vercel (and locally) after `vite build`,
 * alongside prerender.mjs.
 *
 * Replaces the old hand-maintained public/sitemap.xml (which drifted out of
 * sync with prerender-capture.mjs's route list more than once) with one
 * generated from prerender-cache/ — the same source of truth prerender.mjs
 * already uses, so a route can never be prerendered-but-missing-from-sitemap
 * again.
 *
 * <priority>/<changefreq> are dropped — Google ignores both.
 *
 * <lastmod> is each route's own dateModified/datePublished, read straight out
 * of the page-specific JSON-LD already captured in prerender-cache/ (the
 * WebPage block each page's own Helmet renders) — not the build run's date.
 * Routes with no page-specific date yet (e.g. the homepage) fall back to
 * today so lastmod is never left blank.
 *
 * fetchActiveProperties() below is ready but NOT yet wired in: there is no
 * /book/:propertySlug page live yet (separate, larger build). Once that
 * page ships, call it and merge the results into `routes` before writing —
 * adding property URLs to the sitemap before the page exists would just add
 * 404s, which is exactly the kind of GSC issue already flagged as a problem
 * to fix, not create more of.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const cacheDir = path.join(__dirname, 'prerender-cache');
const BASE_URL = 'https://chakrio.com';
const today = new Date().toISOString().slice(0, 10);

// Not called yet — see file header. Uses the same Supabase REST pattern
// already used in api/data.js (no supabase-js dependency needed).
async function fetchActiveProperties() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return [];

  const res = await fetch(
    `${supabaseUrl}/rest/v1/properties?select=property_id,property_name&is_active=eq.true`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  if (!res.ok) return [];
  return res.json();
}

// Pull dateModified (falling back to datePublished) out of the page's own
// WebPage JSON-LD block — there can be several ld+json scripts per page
// (WebSite, SoftwareApplication, WebPage, BreadcrumbList, FAQPage...), only
// the WebPage one describes this specific route.
function pageLastmod(helmetHead) {
  const blocks = helmetHead.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  for (const [, json] of blocks) {
    try {
      const data = JSON.parse(json);
      if (data['@type'] === 'WebPage' && (data.dateModified || data.datePublished)) {
        return data.dateModified || data.datePublished;
      }
    } catch {
      // Malformed block — skip it rather than guess.
    }
  }
  return null;
}

function buildSitemap(entries) {
  const urls = entries
    .map(({ path: p, lastmod }) => `  <url>\n    <loc>${BASE_URL}${p}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

if (!fs.existsSync(cacheDir)) {
  console.log('prerender-cache/ not found — leaving dist/sitemap.xml as copied from public/.');
  process.exit(0);
}

const routes = fs
  .readdirSync(cacheDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    const { urlPath, helmetHead } = JSON.parse(fs.readFileSync(path.join(cacheDir, f), 'utf-8'));
    return urlPath ? { path: urlPath, lastmod: pageLastmod(helmetHead) || today } : null;
  })
  .filter(Boolean);

const homepage = routes.find((r) => r.path === '/') || { path: '/', lastmod: today };
const allRoutes = [homepage, ...routes.filter((r) => r.path !== '/')].sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), buildSitemap(allRoutes), 'utf-8');
console.log(`✓ sitemap.xml generated from prerender-cache/ — ${allRoutes.length} URLs.`);

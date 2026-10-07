/**
 * First-touch attribution: the utm_*, gclid and fbclid a visitor landed with,
 * kept for the session and sent with every lead form and demo click, so the
 * backend records which campaign a lead came from (plan E10).
 * Storage can be blocked (private mode, previews): every access is guarded and
 * the site works the same without it.
 */
const KEY = 'chakrio_first_touch';
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

export function captureFirstTouch() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const query = new URLSearchParams(window.location.search);
    const touch = {};
    for (const p of PARAMS) {
      const v = query.get(p);
      if (v) touch[p] = v.slice(0, 200);
    }
    if (!Object.keys(touch).length) return;
    touch.landing_page = window.location.pathname;
    sessionStorage.setItem(KEY, JSON.stringify(touch));
  } catch {
    // storage unavailable: no attribution, nothing else changes
  }
}

export function firstTouch() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

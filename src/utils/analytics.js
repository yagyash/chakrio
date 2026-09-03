/**
 * Thin GA4 event wrapper — Phase 0.2 of the lead-generation plan.
 *
 * gtag is loaded in index.html (G-8RRL1Y00KN). This file only fires events;
 * it never loads or configures gtag.
 *
 * Events:
 *   tool_used         — a free tool's primary action ran (calculate / generate / download)
 *   lead_captured     — a WhatsApp number was submitted   ← mark as KEY EVENT in GA4
 *   whatsapp_click    — any wa.me / WhatsApp link clicked (auto-tracked, see initAnalytics)
 *   demo_started      — message sent to the demo number   ← PENDING: no demo number exists yet (plan Phase 1.4)
 *   booking_page_view — a /book/* page was viewed
 *   booking_enquiry   — availability checked on a /book/* page   ← mark as KEY EVENT in GA4
 *
 * Marking key events is a GA4 dashboard action (Admin → Events), not code.
 */
export function track(name, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

/**
 * One delegated click listener covers every WhatsApp link on the site —
 * present and future — so individual CTAs don't each need an onClick.
 * Call once, on app mount.
 */
export function initAnalytics() {
  if (typeof document === 'undefined' || document.__chakrioAnalyticsInit) return;
  document.__chakrioAnalyticsInit = true;

  document.addEventListener(
    'click',
    (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (/(wa\.me|(api|web|chat)\.whatsapp\.com)/i.test(href)) {
        track('whatsapp_click', {
          link_url: href,
          link_text: (a.textContent || '').trim().slice(0, 80),
        });
      }
    },
    true, // capture — fire even if a handler below calls stopPropagation
  );
}
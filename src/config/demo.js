/**
 * The "Book a demo" WhatsApp CTA: one place for the number and the prefill
 * texts. The backend's inbound qualifier (chakrio-agent plan A04) routes on
 * these exact prefills, so change them together with its copy, never alone.
 * Demo links carry data-demo="…" so analytics fires demo_requested on click.
 */

// ponytail: still the sales phone a person answers. Switch to the Chakrio bot
// number (919929895703) only once A04's inbound qualifier is live (planned
// 21 Nov 2026); before that, the bot would treat a prospect as a guest.
export const DEMO_WA_NUMBER = '919461888529';

export const DEMO_PREFILL_DHARMSHALA_HI = 'नमस्ते, Chakrio डेमो चाहिए – धर्मशाला';
export const DEMO_PREFILL_DHARMSHALA_EN = 'Hello, I want a Chakrio demo – dharmshala';
export const DEMO_PREFILL_PROPERTY = 'Hi, I want to see Chakrio for my property';

export function demoHref(prefill) {
  return `https://wa.me/${DEMO_WA_NUMBER}?text=${encodeURIComponent(prefill)}`;
}

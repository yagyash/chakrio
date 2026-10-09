/**
 * Plans and prices: one source of truth. plans.json is generated from the
 * backend's plans table (chakrio-agent scripts/export_plans.py); never edit
 * prices in components. tier = dashboard feature level (0 starter .. 4 advance).
 */
import plans from './plans.json';

export default plans;

export const PLAN_TIER = Object.fromEntries(plans.map((p) => [p.key, p.tier]));
export const planTier = (key) => PLAN_TIER[key] ?? 0;
export const planByKey = (key) => plans.find((p) => p.key === key);
export const publicPlans = (segment) => plans.filter((p) => p.is_public && (!segment || p.segment === segment));

export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export function roomsLabel(p) {
  if (p.rooms_max == null) return `${p.rooms_min}+ rooms`;
  return p.rooms_min <= 1 ? `Up to ${p.rooms_max} rooms` : `${p.rooms_min}–${p.rooms_max} rooms`;
}

/** Headline price for the Monthly / Yearly switch. Plans without a fixed yearly
 *  price (Advance, Dham) keep showing their monthly price. */
export function priceFor(p, yearly) {
  if (yearly && p.annual_inr) return { amount: inr(p.annual_inr), unit: '/yr' };
  return { amount: `${p.price_is_from ? 'From ' : ''}${inr(p.monthly_inr)}`, unit: '/mo' };
}

/** Yearly: "2 months free · save ₹4,398 · one-time setup ₹4,399"; monthly: setup only. */
export function termsLine(p, yearly = false) {
  const parts = [];
  if (yearly) parts.push(p.annual_inr ? `2 months free · save ${inr(p.monthly_inr * 12 - p.annual_inr)}` : 'yearly price on request');
  if (p.setup_inr) parts.push(`one-time setup ${p.price_is_from ? 'from ' : ''}${inr(p.setup_inr)}`);
  return parts.join(' · ');
}

// Colour by feature tier, so a new plan in plans.json needs no change here.
export const TIER_COLORS = {
  0: { bg: 'rgba(255,255,255,0.06)', text: '#8c8a9e' },
  1: { bg: 'rgba(0,212,255,0.12)',   text: '#00D4FF' },
  2: { bg: 'rgba(72,199,142,0.15)',  text: '#48c78e' },
  3: { bg: 'rgba(108,99,255,0.18)',  text: '#a89ef5' },
  4: { bg: 'rgba(201,162,75,0.15)',  text: '#C9A24B' },
};

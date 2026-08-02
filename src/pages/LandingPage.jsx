import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  CalendarCheck, Undo2, Receipt, BarChart3,
  Globe, BellRing, MessageSquare, Megaphone, Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: CalendarCheck,
    title: 'Instant Booking Records',
    body: 'Send a message like "Rahul, 3 nights from 15 June, ₹8,000 total, ₹3,000 advance" — Chakrio parses it and logs the booking automatically.',
  },
  {
    Icon: Undo2,
    title: 'Cancellation Tracking',
    body: 'Chakrio extracts refund amounts and advance retained from cancellation messages and updates your records in real time.',
  },
  {
    Icon: Receipt,
    title: 'Expense Logging',
    body: 'Type "pool service ₹500" or "plumber ₹1,200" — Chakrio logs the expense instantly. No dropdowns, no category hunting.',
  },
  {
    Icon: BarChart3,
    title: 'Monthly P&L Reports',
    body: 'On the 1st of each month, get a full P&L — total revenue, all expenses, and net profit — sent straight to your phone.',
  },
  {
    Icon: Globe,
    title: 'OTA Calendar Sync',
    body: 'Connect iCal feeds from any OTA. Blocked dates flow in automatically — your availability is always accurate, double bookings eliminated.',
  },
  {
    Icon: BellRing,
    title: 'Guest Experience Automation',
    body: 'Chakrio auto-sends booking confirmations, pre-arrival payment reminders, mid-stay care messages, and post-checkout review requests.',
  },
  {
    Icon: MessageSquare,
    title: 'WhatsApp & Telegram',
    body: 'Your team keeps using WhatsApp or Telegram. No new app required. Chakrio works inside the chat tool you already have open all day.',
  },
  {
    Icon: Megaphone,
    title: 'Guest Re-engagement Campaigns',
    body: 'Send WhatsApp broadcasts to past guests — seasonal offers, festival availability, or a personalised "we miss you" message. Track delivery in real time.',
  },
  {
    Icon: Users,
    title: 'Direct WhatsApp Bookings',
    body: 'Guests book you directly on WhatsApp — no OTA, no 15–20% commission. Every enquiry is tracked: dates requested, outcome, and source.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Send a message',
    body: 'Type a booking, expense, or cancellation in plain language — exactly how you would say it to someone. No forms, no fields, no formatting.',
    example: '"Rahul, 3 nights from 15 June, ₹8,000 total, ₹3,000 advance"',
  },
  {
    step: '02',
    title: 'Chakrio parses it',
    body: "AI pulls out the guest name, dates, room, and advance — and logs the booking in under a second.",
    example: 'Extracted: Guest · Rahul | Check-in · 15 Jun | Nights · 3 | Advance · ₹3,000',
  },
  {
    step: '03',
    title: 'Auto-recorded',
    body: 'Your dashboard, calendar, and monthly P&L update themselves. No spreadsheets, ever.',
    example: 'Dashboard updated: 1 new booking · Balance ₹5,000 due · Revenue +₹8,000',
  },
];

const TESTIMONIALS = [
  {
    initials: 'KS',
    quote: 'Chakrio completely changed how we manage our bookings. What used to take an hour of writing in our register now happens automatically the moment we send a message. We can track expenses through the reports and check room availability quite easily.',
    name: 'Koustubh Sharma',
    title: 'Owner, Raghuleela Dham',
    location: 'Goverdhan, Uttar Pradesh',
    stats: [
      { value: '60 rooms', label: 'Property size' },
      { value: 'Physical register', label: 'Was using before' },
      { value: '1 hr/day', label: 'Saved on record-keeping' },
    ],
  },
  {
    initials: 'NC',
    quote: 'Managing a villa used to mean constant back-and-forth just to keep records straight. With Chakrio, everything is logged the moment I send a message — no effort, no errors.',
    name: 'Nupur Choubisa',
    title: 'Owner, Niva — The Rooted Heaven',
    location: 'Udaipur, Rajasthan',
  },
];

const TOOLS = [
  { title: 'Hotel Occupancy Rate Calculator', desc: "Calculate your property's occupancy % for any period.", href: '/tools/occupancy-calculator' },
  { title: 'Rental Income Calculator', desc: 'Estimate gross and net income from your rooms.', href: '/tools/rental-income-calculator' },
  { title: 'Cancellation Policy Generator', desc: 'Generate a professional cancellation policy in seconds.', href: '/tools/cancellation-policy' },
  { title: 'Villa & Homestay Invoice Generator', desc: 'Generate a clean PDF invoice for your guests in seconds. No sign-up required.', href: '/tools/invoice-generator' },
  { title: 'WhatsApp Booking Confirmation Generator', desc: 'Generate a professional booking confirmation message for WhatsApp instantly.', href: '/tools/whatsapp-booking-confirmation' },
  { title: 'Hotel GST Calculator', desc: "Calculate the correct GST on your room tariff under India's updated 2025 rules.", href: '/tools/gst-calculator-hotel' },
];

const CAPABILITIES = [
  { Icon: CalendarCheck, label: 'Booking Automation' },
  { Icon: Users, label: 'Direct Bookings' },
  { Icon: MessageSquare, label: 'WhatsApp & Telegram' },
  { Icon: BarChart3, label: 'Real-time Dashboard' },
  { Icon: Globe, label: 'OTA Calendar Sync' },
  { Icon: Megaphone, label: 'Guest Campaigns' },
  { Icon: Receipt, label: 'Monthly P&L Reports' },
];

const GUEST_JOURNEY = [
  {
    color: '#48c78e',
    timing: 'Instant',
    title: 'Booking Confirmed',
    message: '"Hi Alex, your booking at The Olive Villa is confirmed for 15–18 June. We look forward to welcoming you!"',
  },
  {
    color: '#f59e0b',
    timing: 'Day before check-in',
    title: 'Payment Reminder',
    message: '"Hi Alex, just a reminder that your balance is due before arrival tomorrow. Please let us know once it\'s settled."',
  },
  {
    color: '#C9A24B',
    timing: 'Day 2 of stay',
    title: 'Mid-Stay Care',
    message: '"Hi Alex, hope you\'re settling in wonderfully! Let us know if there\'s anything we can do to make your stay better."',
  },
  {
    color: '#a896f8',
    timing: 'Day after check-out',
    title: 'Review Request',
    message: '"Hi Alex, thank you for staying with us! If you enjoyed your time, we\'d love a quick review — it means the world to small properties like ours."',
  },
];

const TRUST_STATS = [
  { value: '1,000+', label: 'Bookings logged' },
  { value: '5–8 hrs', label: 'Saved per week', note: 'client-reported estimate' },
  { value: '5–10 sec', label: 'Bot response time' },
  { value: '24 hrs', label: 'Avg setup time', note: 'client-reported estimate' },
];

const PRICING_TIERS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '₹499',
    sub: 'Up to 4 rooms · small villas & homestays',
    featured: false,
    features: [
      'WhatsApp or Telegram bot',
      'Bookings — add / update / cancel / settle',
      'Expenses — 10 auto-categories',
      'Monthly P&L report (auto + on-demand)',
      'GST invoice PDF via bot',
      'Web dashboard',
    ],
  },
  {
    key: 'lite',
    name: 'Lite',
    price: '₹999',
    sub: 'Up to 8 rooms · growing homestays',
    featured: false,
    features: [
      'Everything in Starter, plus:',
      'Guest experience layer (pre / mid / post-stay)',
      'Direct booking link + QR code',
      'UPI advance payment link to guest',
      'Guest CRM — VIP / DND flags',
      'OTA iCal sync (Airbnb, Booking.com)',
      'Marketing campaigns — 60/mo',
    ],
  },
  {
    key: 'growth',
    name: 'Growth',
    price: '₹2,199',
    sub: 'Up to 15 rooms · boutique hotels & homestays',
    badge: '★ Most popular',
    featured: true,
    features: [
      'Everything in Lite, plus:',
      'Enquiry tracking + auto follow-up nudge',
      'Marketing campaigns — 125/mo',
      'Channel Manager add-on available',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '₹3,999',
    sub: 'Up to 30 rooms · hotels & dharamshalas',
    featured: false,
    features: [
      'Everything in Growth, plus:',
      'Room-level hotel management',
      'Multi-room + bulk booking',
      'Food orders + table management',
      'Digital menu — AI extraction + guest QR',
      'Marketing campaigns — 250/mo',
    ],
  },
  {
    key: 'advance',
    name: 'Advance',
    price: 'From ₹4,999',
    sub: '30+ rooms · large hotels & multi-property groups',
    cta: 'Contact for quote →',
    ctaHref: 'https://wa.me/919461888529',
    ctaExternal: true,
    featured: false,
    features: [
      'Everything in Pro, plus:',
      'Dedicated onboarding manager',
      'Custom integrations & SLA',
      'Multi-property group management',
    ],
  },
];

const FAQS = [
  {
    q: 'I already use a spreadsheet — why do I need this?',
    a: 'Spreadsheets work, but they require you to open them, find the right tab, and type every field manually — every single booking. With Chakrio, you just send a message in plain language and the record is created automatically. No switching apps, no formatting, no errors from fat-fingering a date.',
  },
  {
    q: 'What if I have multiple properties?',
    a: 'Chakrio supports multiple properties under one account. Each property has its own booking records and dashboard. You can switch between them instantly from the same login.',
  },
  {
    q: 'What types of properties can use Chakrio?',
    a: 'Chakrio is built for dharmshalas (built for pilgrim-town operations — group arrivals, festival rush, and high-volume bookings), boutique hotels, villas, homestays, guesthouses, B&Bs, and vacation rentals. It works for single-property owners and those managing multiple properties. Our first clients include Raghuleela Dham (60 rooms, Goverdhan) and Niva — The Rooted Heaven (Udaipur).',
  },
  {
    q: 'Does Chakrio work outside India?',
    a: 'WhatsApp works globally, so the bot can receive messages from any country. However, payments (Razorpay), phone number handling, and our onboarding team are currently India-first. If you\'re based outside India, contact us and we\'ll advise.',
  },
  {
    q: 'Do I need technical knowledge to use Chakrio?',
    a: 'None at all. If you can send a text message, you can use Chakrio. You simply type bookings in natural language — the AI handles the rest.',
  },
  {
    q: 'How do I get started?',
    a: 'We onboard every property personally. Contact us via WhatsApp and we\'ll get your booking bot live — usually within 24 hours.',
  },
  {
    q: 'How long does setup take?',
    a: 'Most properties are live within 24 hours of contacting us. We handle the entire setup — bot configuration, dashboard access, and a walkthrough with your team. You don\'t need to do anything technical.',
  },
  {
    q: 'What if I send a wrong message or make a mistake?',
    a: 'Just send a correction. For example: "Update Alex check-out to 18th June." Chakrio will find the booking and update it. If you need to cancel, just say so — the bot handles updates, cancellations, and corrections the same way it handles new bookings.',
  },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroChatPanel() {
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,.08)',
      background: '#0b141a', minHeight: 300,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* WhatsApp-style header */}
      <div style={{ background: '#1f2c33', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a1a2e', border: '1px solid rgba(201,162,75,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          <img src="/chakrio.svg" alt="Chakrio" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#eaf2ee', fontFamily: "'Hanken Grotesk', sans-serif" }}>Chakrio</div>
          <div style={{ fontSize: 10.5, color: '#7fa890' }}>online</div>
        </div>
      </div>
      {/* Chat bubbles */}
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 9, background: 'repeating-linear-gradient(45deg,#0d161c 0 16px,#0b141a 16px 32px)' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: '#056162', color: '#eafff4', fontSize: 12.5, lineHeight: 1.45, borderRadius: '10px 10px 2px 10px', padding: '9px 11px' }}>
          Rahul, 3 nights from 15 June, ₹8,000 total, ₹3,000 advance, Sea View room
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#1f2c33', color: '#dfe9e4', fontSize: 12, lineHeight: 1.5, borderRadius: '10px 10px 10px 2px', padding: '10px 11px' }}>
          ✅ Logged: <b>Rahul</b> · Sea View · 15–18 Jun (3 nights) · advance <b>₹3,000</b>. Added to calendar &amp; P&amp;L.
        </div>
        <div style={{ alignSelf: 'flex-start', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#5e7a6b', paddingLeft: 4 }}>
          parsed in 5–10s
        </div>
        <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: '#056162', color: '#eafff4', fontSize: 12.5, lineHeight: 1.45, borderRadius: '10px 10px 2px 10px', padding: '9px 11px' }}>
          Pool maintenance bill — ₹3,500
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#1f2c33', color: '#dfe9e4', fontSize: 12, lineHeight: 1.5, borderRadius: '10px 10px 10px 2px', padding: '10px 11px' }}>
          ✅ Expense logged: Pool maintenance · ₹3,500. Dashboard updated.
        </div>
      </div>
    </div>
  );
}

function GuestExperienceSection() {
  return (
    <section style={{ borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="reveal text-center mb-14">
          <p className="text-xs font-mono font-medium uppercase tracking-widest mb-2" style={{ color: '#C9A24B' }}>Guest Experience</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 mb-3 tracking-tight">Keep guests engaged — automatically</h2>
          <p className="text-text-2 max-w-lg mx-auto">Chakrio sends the right message at the right moment, without you lifting a finger.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-10 items-start max-w-4xl mx-auto">
          <div className="reveal reveal-delay-1 space-y-4">
            <p className="text-text-2 text-sm leading-relaxed">
              Every guest who books through Chakrio is automatically enrolled in a touchpoint sequence — from the instant confirmation to the post-checkout review ask.
            </p>
            <p className="text-text-2 text-sm leading-relaxed">
              No templates to set up. No scheduling. No extra app. You just log the booking and Chakrio handles every message at exactly the right time.
            </p>
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(201,162,75,.06)', border: '1px solid rgba(201,162,75,.15)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#C9A24B' }}>Result</p>
              <p className="text-text-1 text-sm font-medium">Guests feel looked after. Reviews go up. Repeat bookings increase.</p>
            </div>
          </div>

          <div className="reveal reveal-delay-2 relative pl-6">
            <div className="absolute left-2 top-3 bottom-3 w-px" style={{ background: 'linear-gradient(to bottom, rgba(201,162,75,0.5), rgba(168,150,248,0.2))' }} />
            <div className="space-y-7">
              {GUEST_JOURNEY.map((node) => (
                <div key={node.title} className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: node.color, boxShadow: `0 0 6px ${node.color}60` }} />
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-display font-extrabold text-sm text-text-1">{node.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${node.color}15`, color: node.color, border: `1px solid ${node.color}30` }}>
                      {node.timing}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-text-2 px-3 py-2.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {node.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DirectBookingsSection() {
  const [videoActive, setVideoActive] = useState(false);
  const steps = [
    { n: '1', text: 'Guest scans your QR code or taps your wa.me link' },
    { n: '2', text: 'Bot asks for dates — guest replies naturally' },
    { n: '3', text: 'Dates held while you approve with one reply' },
    { n: '4', text: 'Booking confirmed automatically, guest notified' },
  ];
  return (
    <section style={{ borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="reveal text-center mb-12">
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: '#C9A24B', marginBottom: 12 }}>Direct bookings</p>
          <h2 className="font-display font-extrabold tracking-tight text-text-1" style={{ fontSize: 'clamp(26px,4vw,44px)', letterSpacing: '-.03em', marginBottom: 16 }}>
            Your guests book you directly on WhatsApp —{' '}
            <span style={{ color: '#25D366' }}>0% commission.</span>
          </h2>
          <p className="text-text-2 max-w-2xl mx-auto" style={{ fontSize: 16, lineHeight: 1.6 }}>
            Every property gets a shareable wa.me link and QR code — print it on your visiting card, add it to your Google Business profile, or put it in your Instagram bio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-10 items-center mb-12">
          {/* Step strip */}
          <div className="reveal reveal-delay-1 space-y-4">
            {steps.map(s => (
              <div key={s.n} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display font-extrabold text-sm"
                  style={{ background: 'rgba(37,211,102,.12)', border: '1px solid rgba(37,211,102,.3)', color: '#25D366' }}>
                  {s.n}
                </div>
                <p className="text-text-2 text-sm leading-relaxed pt-1">{s.text}</p>
              </div>
            ))}
            <p className="text-text-3 text-xs pt-2">
              Every enquiry is tracked: dates requested, outcome, and source — so you know which channel drives direct bookings.
            </p>
            <p className="text-text-3 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 12 }}>
              OTA bookings still sync automatically — direct bookings just stop costing you 15–20%.
            </p>
          </div>

          {/* Video slot (L7) */}
          <div className="reveal reveal-delay-2" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)', aspectRatio: '16/9', position: 'relative', cursor: 'pointer', background: '#0b141a' }}
            onClick={() => setVideoActive(true)}>
            {videoActive ? (
              <iframe
                src="https://www.youtube.com/embed/rSviz7BZdBE?autoplay=1"
                allow="autoplay; fullscreen"
                title="See Chakrio in 60 seconds"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <>
                <img src="/screenshot.png" alt="See Chakrio in 60 seconds — click to play" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.35)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0E0B14"><polygon points="5,3 19,12 5,21" /></svg>
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 4 }}>See Chakrio in 60 seconds</div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
      <div className="reveal text-center mb-10">
        <p className="text-xs font-mono font-medium uppercase tracking-widest mb-2" style={{ color: '#C9A24B' }}>Pricing</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 mb-3 tracking-tight">Simple, transparent pricing.</h2>
        <p className="text-text-2 mt-2 max-w-xl mx-auto">14-day free trial on all plans. Real prices, per property. Cancel anytime.</p>
      </div>

      <div className="reveal grid sm:grid-cols-2 xl:grid-cols-5 gap-4 items-stretch">
        {PRICING_TIERS.map((tier) => {
          return (
            <div key={tier.key} style={{
              border: tier.featured ? '1.5px solid #C9A24B' : '1px solid rgba(255,255,255,.1)',
              background: tier.featured
                ? 'linear-gradient(180deg,rgba(201,162,75,.1),rgba(255,255,255,.02))'
                : 'rgba(255,255,255,.025)',
              borderRadius: 18, padding: 24, position: 'relative',
              boxShadow: tier.featured ? '0 30px 70px -34px #C9A24B' : 'none',
              display: 'flex', flexDirection: 'column',
            }}>
              {tier.badge && (
                <div style={{
                  position: 'absolute', top: -13, left: 34,
                  background: '#C9A24B', color: '#0E0B14',
                  font: "700 11px 'Hanken Grotesk', sans-serif",
                  padding: '5px 11px', borderRadius: 7, whiteSpace: 'nowrap',
                }}>
                  {tier.badge}
                </div>
              )}
              <div style={{ fontWeight: 600, color: tier.featured ? '#C9A24B' : '#CFCAD9', fontSize: 15, marginBottom: 14 }}>{tier.name}</div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                <span className="font-display font-extrabold" style={{ fontSize: 36, letterSpacing: '-.03em', color: '#F4F1EA', lineHeight: 1 }}>
                  {tier.price}
                </span>
                <span style={{ fontSize: 14, color: '#9D98AC' }}>/mo</span>
              </div>
              <div style={{ fontSize: 13, color: '#9D98AC', marginBottom: 22 }}>{tier.sub}</div>

              {/* CTA — fixed-height zone so features start at same vertical position across all cards */}
              <div style={{ marginBottom: 20 }}>
                {tier.ctaExternal ? (
                  <>
                    <a href={tier.ctaHref} target="_blank" rel="noopener noreferrer" style={{
                      display: 'block', textAlign: 'center', width: '100%',
                      padding: '13px 0', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none',
                      fontFamily: "'Hanken Grotesk', sans-serif",
                      background: '#C9A24B', color: '#0E0B14', border: 'none',
                      marginBottom: 8, boxSizing: 'border-box',
                    }}>
                      {tier.cta}
                    </a>
                    <div style={{ height: 46 }} />
                  </>
                ) : (
                  <>
                    <a href="https://wa.me/919461888529?text=Hi%2C+I+want+to+see+Chakrio+for+my+property" target="_blank" rel="noopener noreferrer" style={{
                      display: 'block', textAlign: 'center', width: '100%',
                      padding: '13px 0', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none',
                      fontFamily: "'Hanken Grotesk', sans-serif",
                      background: '#C9A24B', color: '#0E0B14', border: 'none',
                      marginBottom: 8,
                    }}>
                      Chat with us on WhatsApp
                    </a>
                    <Link to="/onboard" style={{
                      display: 'block', textAlign: 'center', width: '100%',
                      padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                      fontFamily: "'Hanken Grotesk', sans-serif",
                      background: 'transparent', color: '#9D98AC',
                      border: '1px solid rgba(255,255,255,.12)',
                    }}>
                      Start 14-day Free Trial →
                    </Link>
                  </>
                )}
              </div>

              {/* Features */}
              <div style={{ fontSize: 14, color: '#CFCAD9', lineHeight: 2.1, flex: 1 }}>
                {tier.features.map((f, i) => (
                  <div key={i} style={{ color: i === 0 && f.endsWith(':') ? '#9D98AC' : '#CFCAD9' }}>{f}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Setup fee note */}
      <div className="reveal mt-8 rounded-xl p-5" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)' }}>
        <p className="text-center text-sm text-text-2 mb-1">
          <span style={{ color: '#C9A24B', fontWeight: 600 }}>One-time setup fee: ₹999–₹2,999</span> — waived for launch &amp; reference properties
        </p>
        <p className="text-center text-xs text-text-3 mt-1">Add-ons: Channel Manager ₹2,000/property/mo (Growth &amp; Pro) · Marketing overage ₹1/delivered msg</p>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { profileStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profileStatus === 'ready') navigate('/dashboard', { replace: true });
  }, [profileStatus, navigate]);

  useScrollReveal();

  return (
    <div className="min-h-screen text-text-1 flex flex-col" style={{ background: '#0E0B14' }}>
      <Helmet>
        <title>Chakrio — WhatsApp Booking Automation for Dharmshalas, Villas &amp; Homestays</title>
        <meta name="description" content="Automate bookings, track expenses, and manage room availability by WhatsApp or Telegram. Built for dharmshalas, villas, and boutique hotels. Auto-send guest confirmations, payment reminders, and re-engagement campaigns. Setup in 24 hours. Free 14-day trial." />
        <link rel="canonical" href="https://chakrio.com/" />
        <meta property="og:title" content="Chakrio — WhatsApp Booking Automation for Dharmshalas, Villas &amp; Homestays" />
        <meta property="og:description" content="Automate bookings, track expenses, and manage room availability by WhatsApp or Telegram. Built for dharmshalas, villas, and boutique hotels. Setup in 24 hours. Free 14-day trial." />
        <meta property="og:url" content="https://chakrio.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://chakrio.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chakrio — WhatsApp Booking Automation for Dharmshalas, Villas &amp; Homestays" />
        <meta name="twitter:description" content="Automate bookings, track expenses, and manage room availability by WhatsApp or Telegram. Built for dharmshalas, villas, and boutique hotels." />
        <meta name="twitter:image" content="https://chakrio.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Chakrio",
          "url": "https://chakrio.com",
          "logo": { "@type": "ImageObject", "url": "https://chakrio.com/og-image.png", "width": 1200, "height": 630 },
          "description": "Chakrio is an AI-powered property booking automation tool for dharmshalas, villas, homestays, and boutique hotels.",
          "serviceType": "Property Management Software",
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Chakrio",
          "description": "Chakrio is an AI-powered property booking automation tool. Property managers send plain-language messages via WhatsApp or Telegram and Chakrio automatically records bookings, cancellations, and expenses to a real-time dashboard.",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://chakrio.com",
          "featureList": "Instant booking records via WhatsApp, Expense logging, Monthly P&L reports, Guest experience automation, OTA Calendar Sync (add-on), Direct WhatsApp guest booking with hold and manager approval, Guest re-engagement campaigns",
          "offers": { "@type": "Offer", "price": "0", "description": "14-day free trial" },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQS.map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": { "@type": "Answer", "text": a },
          })),
        })}</script>
      </Helmet>

      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="max-w-5xl mx-auto px-6 pt-20 pb-10 w-full text-center">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm mb-8"
          style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#CFCAD9' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#25D366', boxShadow: '0 0 9px #25D366', display: 'inline-block', flexShrink: 0 }} />
          Automate your property bookings with an AI chatbot
        </div>

        <h1 className="font-display font-extrabold tracking-tight text-text-1" style={{ fontSize: 'clamp(40px,7vw,88px)', lineHeight: .97, letterSpacing: '-.035em', maxWidth: '15ch', margin: '0 auto 24px' }}>
          WhatsApp booking automation for{' '}
          <span style={{ color: '#C9A24B' }}>dharmshalas, villas, homestays &amp; boutique hotels</span>
        </h1>

        <p className="text-text-2 leading-relaxed mx-auto mb-8" style={{ fontSize: 19, maxWidth: '54ch' }}>
          Just send a message —{' '}
          <span className="text-text-1 font-semibold">"Rahul, 3 nights from 15 June, ₹8,000 total, ₹3,000 advance"</span>
          {' '}— and Chakrio logs the booking instantly. No spreadsheets, no missed records.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <a href="https://wa.me/919461888529?text=Hi%2C+I+want+to+see+Chakrio+for+my+property" target="_blank" rel="noopener noreferrer" style={{
            background: '#C9A24B', color: '#0E0B14', border: 'none', borderRadius: 11,
            padding: '15px 28px', fontWeight: 600, fontSize: 16, textDecoration: 'none',
            fontFamily: "'Hanken Grotesk', sans-serif",
            boxShadow: '0 14px 34px -14px #C9A24B',
          }}>
            Chat with us on WhatsApp
          </a>
          <Link to="/onboard" style={{
            background: 'rgba(255,255,255,.06)', color: '#F4F1EA',
            border: '1px solid rgba(255,255,255,.14)', borderRadius: 11,
            padding: '15px 28px', fontWeight: 600, fontSize: 16, textDecoration: 'none',
            fontFamily: "'Hanken Grotesk', sans-serif",
          }}>
            Start Free Trial →
          </Link>
        </div>
        <p style={{ color: '#9D98AC', fontSize: 13.5 }}>14-day free trial · No credit card required · <a href="#how-it-works" style={{ color: '#9D98AC', textDecoration: 'underline' }}>See how it works</a></p>
      </header>

      {/* ── Hero Product Visual ───────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-4 w-full">
        <div style={{
          position: 'relative', borderRadius: 20,
          border: '1px solid rgba(255,255,255,.1)',
          background: 'linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015))',
          padding: 14,
          boxShadow: '0 50px 120px -50px #C9A24B55',
        }}>
          {/* Glow pulse */}
          <div style={{
            position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
            width: '60%', height: '120%', pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center,#C9A24B,transparent 70%)',
            opacity: .12, filter: 'blur(40px)',
          }} />
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 14 }}>
            <HeroChatPanel />
            {/* Live dashboard screenshot */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)', minHeight: 300 }}>
              <img src="/screenshot.png" alt="Chakrio live dashboard" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Strip ───────────────────────────────────────── */}
      <section className="reveal max-w-5xl mx-auto px-6 py-14 w-full">
        <p className="text-center text-sm text-text-3 mb-8">Running daily operations at a 60-room dharmshala in Goverdhan and a boutique villa in Udaipur.</p>
        <div className="flex flex-wrap justify-center gap-12">
          {TRUST_STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="font-display font-extrabold" style={{ fontSize: 34, color: '#C9A24B' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#B6B1C4', marginTop: 4 }}>{s.label}</div>
              {s.note && <div style={{ fontSize: 10.5, color: '#6D6880', marginTop: 2 }}>{s.note}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* dharmshala internal link */}
      <div className="text-center pb-4">
        <Link to="/dharmshala" style={{ fontSize: 13, color: '#C9A24B', textDecoration: 'underline' }}>
          Managing a dharmshala? See how Chakrio handles pilgrim-town operations →
        </Link>
      </div>

      {/* ── How It Works — light section ─────────────────────── */}
      <section id="how-it-works" style={{ background: '#F4F1EA', color: '#16121d' }}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="reveal text-center mb-12">
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9a7d2e', marginBottom: 12 }}>How it works</p>
            <h2 className="font-display font-extrabold tracking-tight" style={{ fontSize: 'clamp(28px,4vw,48px)', letterSpacing: '-.03em', color: '#16121d' }}>
              From WhatsApp message to recorded booking.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <div key={s.step} className={`reveal reveal-delay-${i + 1}`} style={{
                background: '#fff', border: '1px solid rgba(0,0,0,.07)',
                borderRadius: 18, padding: 32,
                boxShadow: '0 20px 40px -32px rgba(0,0,0,.5)',
              }}>
                <div className="font-display font-extrabold" style={{ fontSize: 38, color: '#C9A24B', marginBottom: 14 }}>{s.step}</div>
                <h3 className="font-display font-extrabold" style={{ fontSize: 20, color: '#16121d', marginBottom: 8, letterSpacing: '-.01em' }}>{s.title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#55505f', margin: '0 0 14px' }}>{s.body}</p>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, background: 'rgba(201,162,75,.1)', color: '#9a7d2e', border: '1px solid rgba(201,162,75,.2)', borderRadius: 8, padding: '8px 10px' }}>
                  {s.example}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Direct Bookings Section (L3) ─────────────────────── */}
      <DirectBookingsSection />

      {/* ── Capabilities Strip ───────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-center text-xs font-mono font-medium uppercase tracking-widest mb-5 text-text-3">Everything you need, in one bot</p>
          <div className="flex flex-wrap justify-center gap-3">
            {CAPABILITIES.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ border: '1px solid rgba(201,162,75,.3)', background: 'rgba(201,162,75,.06)', color: '#CFCAD9' }}>
                <Icon size={13} style={{ color: '#C9A24B' }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 w-full">
        <div className="reveal text-center mb-12">
          <p className="text-xs font-mono font-medium uppercase tracking-widest mb-2" style={{ color: '#C9A24B' }}>Everything you need</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 tracking-tight">One quiet app that runs the back office.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`reveal reveal-delay-${(i % 3) + 1}`} style={{
              border: '1px solid rgba(255,255,255,.09)',
              background: 'rgba(255,255,255,.025)',
              borderRadius: 16, padding: 28,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'rgba(201,162,75,.12)',
                border: '1px solid rgba(201,162,75,.3)',
                marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.Icon size={20} style={{ color: '#C9A24B' }} />
              </div>
              <h3 className="font-display font-extrabold text-text-1" style={{ fontSize: 17, marginBottom: 8, letterSpacing: '-.01em' }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#B6B1C4', margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Guest Experience Timeline ─────────────────────────── */}
      <GuestExperienceSection />

      {/* ── Before / After ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 w-full">
        <div className="reveal text-center mb-10">
          <p className="text-xs font-mono font-medium uppercase tracking-widest mb-2" style={{ color: '#C9A24B' }}>Why Chakrio</p>
          <h2 className="font-display font-extrabold text-3xl text-text-1 tracking-tight">Before vs After</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="reveal reveal-delay-1 rounded-2xl border p-7" style={{ background: 'rgba(255,255,255,.025)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>✕</span>
              <p className="text-sm font-semibold" style={{ color: '#f87171' }}>Before Chakrio</p>
            </div>
            <ul className="space-y-4 text-text-2 text-sm">
              <li>• WhatsApp screenshots piling up — no organised record</li>
              <li>• Writing bookings in a register after every call</li>
              <li>• Forgot to log a booking? Guest arrived, no record found</li>
              <li>• End-of-month P&amp;L takes hours to compile</li>
              <li>• No visibility into cancellations or refunds</li>
              <li>• Expenses written on paper, lost by month-end</li>
            </ul>
          </div>
          <div className="reveal reveal-delay-2 rounded-2xl border p-7" style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(201,162,75,.08) 0%,rgba(255,255,255,.02) 70%)', borderColor: 'rgba(201,162,75,0.35)' }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold"
                style={{ background: 'rgba(201,162,75,.15)', color: '#C9A24B', border: '1px solid rgba(201,162,75,.4)' }}>✓</span>
              <p className="text-sm font-semibold" style={{ color: '#C9A24B' }}>After Chakrio</p>
            </div>
            <ul className="space-y-4 text-text-2 text-sm">
              <li>• Send a message → booking is recorded in seconds</li>
              <li>• Dashboard updates automatically — no manual entry</li>
              <li>• Every booking, cancellation, and refund logged</li>
              <li>• Monthly P&amp;L report delivered on the 1st — automatically</li>
              <li>• Full refund and advance-retained tracking</li>
              <li>• Expense logged with one line: "pool service ₹500"</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Free Tools ───────────────────────────────────────── */}
      <section id="tools" style={{ borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="reveal flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-mono font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A24B' }}>Free resources</p>
              <h2 className="font-display font-extrabold text-2xl text-text-1 tracking-tight">Free Tools for Property Managers</h2>
            </div>
            <p className="text-text-3 text-sm">No sign-up required.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map(t => (
              <Link key={t.href} to={t.href} className="reveal group" style={{
                background: 'rgba(255,255,255,.025)', borderRadius: 16,
                border: '1px solid rgba(255,255,255,.09)',
                padding: 24, textDecoration: 'none', display: 'block',
                transition: 'border-color .2s',
              }}>
                <h3 className="font-display font-extrabold text-base text-text-1 mb-2" style={{ letterSpacing: '-.01em' }}>{t.title}</h3>
                <p className="text-text-2 text-sm leading-relaxed mb-4">{t.desc}</p>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#C9A24B' }}>Use free tool →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <PricingSection />

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="reveal text-xs font-mono font-medium uppercase tracking-widest mb-10 text-center" style={{ color: '#C9A24B' }}>From our clients</p>
          <div className="grid md:grid-cols-2 gap-6 items-start">

            {/* Primary — Koustubh */}
            <div className="reveal reveal-delay-1 rounded-2xl border p-8 flex flex-col" style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(201,162,75,.1) 0%,rgba(255,255,255,.02) 70%)', borderColor: 'rgba(201,162,75,.35)', borderTop: '2px solid #C9A24B' }}>
              <blockquote className="text-sm text-text-2 leading-relaxed mb-6">"{TESTIMONIALS[0].quote}"</blockquote>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {TESTIMONIALS[0].stats.map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(201,162,75,.07)', border: '1px solid rgba(201,162,75,.15)' }}>
                    <p className="font-display font-extrabold text-sm text-text-1 mb-0.5">{s.value}</p>
                    <p className="text-text-3 text-xs leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-display font-extrabold text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#C9A24B,#b8934a)', color: '#0E0B14' }}>
                  {TESTIMONIALS[0].initials}
                </div>
                <div>
                  <p className="font-display font-extrabold text-base text-text-1">{TESTIMONIALS[0].name}</p>
                  <p className="text-sm font-medium" style={{ color: '#C9A24B' }}>{TESTIMONIALS[0].title}</p>
                  <p className="text-text-3 text-xs mt-0.5">{TESTIMONIALS[0].location}</p>
                </div>
              </div>
            </div>

            {/* Secondary — Nupur */}
            <div className="reveal reveal-delay-2 rounded-2xl border border-surface3 p-8 flex flex-col" style={{ background: 'rgba(255,255,255,.025)', borderTop: '2px solid rgba(201,162,75,.4)' }}>
              <blockquote className="text-sm text-text-2 leading-relaxed mb-6">"{TESTIMONIALS[1].quote}"</blockquote>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-display font-extrabold text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#C9A24B,#b8934a)', color: '#0E0B14' }}>
                  {TESTIMONIALS[1].initials}
                </div>
                <div>
                  <p className="font-display font-extrabold text-base text-text-1">{TESTIMONIALS[1].name}</p>
                  <p className="text-sm font-medium" style={{ color: '#C9A24B' }}>{TESTIMONIALS[1].title}</p>
                  <p className="text-text-3 text-xs mt-0.5">{TESTIMONIALS[1].location}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20 w-full">
        <div className="reveal text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl text-text-1 mb-3 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-text-2 max-w-xl mx-auto">Everything you need to know about Chakrio.</p>
        </div>
        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 16 }}>
              <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none select-none">
                <span className="font-medium text-text-1 pr-4">{q}</span>
                <span className="text-text-3 text-lg flex-shrink-0 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-6 pb-5 text-text-2 text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
        <div className="reveal rounded-2xl p-10 sm:p-16 text-center" style={{
          border: '1px solid rgba(201,162,75,.3)',
          background: 'radial-gradient(ellipse at 50% 0%,rgba(201,162,75,.16),transparent 70%), rgba(255,255,255,.02)',
          borderRadius: 24,
        }}>
          <h2 className="font-display font-extrabold tracking-tight text-text-1" style={{ fontSize: 'clamp(28px,4.5vw,56px)', letterSpacing: '-.03em', marginBottom: 16, lineHeight: 1.05 }}>
            We onboard every property personally.
          </h2>
          <p className="text-text-2 max-w-lg mx-auto mb-8" style={{ fontSize: 17, lineHeight: 1.6 }}>
            No setup forms, no waiting room. Book a 20-minute call and we'll have your bookings flowing through WhatsApp the same week.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="https://wa.me/919461888529?text=Hi%2C+I+want+to+see+Chakrio+for+my+property" target="_blank" rel="noopener noreferrer" style={{
              background: '#C9A24B', color: '#0E0B14', border: 'none', borderRadius: 11,
              padding: '16px 32px', fontWeight: 600, fontSize: 16, textDecoration: 'none',
              fontFamily: "'Hanken Grotesk', sans-serif",
              boxShadow: '0 14px 34px -14px #C9A24B',
            }}>
              Chat with us on WhatsApp
            </a>
            <Link to="/onboard" style={{
              background: 'rgba(255,255,255,.06)', color: '#F4F1EA',
              border: '1px solid rgba(255,255,255,.14)', borderRadius: 11,
              padding: '16px 32px', fontWeight: 600, fontSize: 16, textDecoration: 'none',
              fontFamily: "'Hanken Grotesk', sans-serif",
            }}>
              Start Free Trial →
            </Link>
          </div>
          <p className="text-text-3 text-sm mt-6">
            Prefer a call?{' '}
            <a href="https://calendar.google.com/calendar/u/0?cid=eWFneWEuc2hhcm1hMTRAZ21haWwuY29t" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A24B', textDecoration: 'underline' }}>
              Book a 20-minute slot
            </a>
            {' '}· Already have an account?{' '}
            <Link to="/login" style={{ color: '#C9A24B', textDecoration: 'underline' }}>
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

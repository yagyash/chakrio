import { useEffect, useState, useRef } from 'react';

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CalendarCheck, Undo2, Receipt, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

const FEATURES = [
  {
    Icon: CalendarCheck,
    color: '#c8a96e',
    title: 'Instant Booking Records',
    body: 'Send a message like "Rajan, 3 nights from 5th April, ₹4500 advance" — Chakrio parses it and logs the booking automatically.',
  },
  {
    Icon: Undo2,
    color: '#60a5fa',
    title: 'Cancellation Tracking',
    body: 'Chakrio extracts refund amounts and advance retained from cancellation messages and updates your records in real time.',
  },
  {
    Icon: Receipt,
    color: '#4ecdc4',
    title: 'Expense Logging',
    body: 'Type "chlorine ₹850" or "plumber ₹2200" — Chakrio logs the expense instantly. No dropdowns, no category hunting.',
  },
  {
    Icon: BarChart3,
    color: '#a896f8',
    title: 'Monthly Reports',
    body: 'On the 1st of each month, get a full P&L — total revenue, all expenses, and net profit — sent straight to your phone.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Send a message',
    body: 'Type a booking, expense, or cancellation in plain language — exactly how you would say it to someone. No forms, no fields, no formatting.',
    example: '"Rajan, 3 nights from 5th April, ₹4,500 advance"',
  },
  {
    step: '02',
    title: 'AI parses it',
    body: "Chakrio's AI reads your message and extracts every detail — guest name, dates, amounts, booking type — without you lifting another finger.",
    example: 'Extracted: Guest · Rajan | Check-in · 5 Apr | Nights · 3 | Advance · ₹4,500',
  },
  {
    step: '03',
    title: 'Auto-recorded',
    body: 'The record is saved instantly. Your dashboard reflects the change in real time — bookings, revenue, balance — always accurate, always current.',
    example: 'Dashboard updated: 1 new booking · Balance ₹0 due · Revenue +₹4,500',
  },
];

const TESTIMONIALS = [
  {
    initials: 'KS',
    quote: 'Chakrio completely changed how we manage our bookings. What used to take an hour of writing in our register now happens automatically the moment we send a message.',
    name: 'Koustubh Sharma',
    property: 'Raghuleela Dham',
    location: 'Goverdhan, Uttar Pradesh',
  },
  {
    initials: 'NC',
    quote: 'Managing a villa used to mean constant back-and-forth just to keep records straight. With Chakrio, everything is logged the moment I send a message — no effort, no errors.',
    name: 'Nupur Choubisa',
    property: 'Niva The Rooted Heaven',
    location: 'Morwaniya, Udaipur',
  },
];

const TOOLS = [
  { title: 'Hotel Occupancy Rate Calculator', desc: "Calculate your property's occupancy % for any period.", href: '/tools/occupancy-calculator' },
  { title: 'Rental Income Calculator', desc: 'Estimate gross and net income from your rooms.', href: '/tools/rental-income-calculator' },
  { title: 'Cancellation Policy Generator', desc: 'Generate a professional cancellation policy in seconds.', href: '/tools/cancellation-policy' },
  { title: 'Villa & Homestay Invoice Generator', desc: 'Generate a clean PDF invoice for your guests in seconds. No sign-up required.', href: '/tools/invoice-generator' },
];

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(null); // 'forward' | 'backward'
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const goTo = (next, direction) => {
    if (animating || next === current) return;
    setDir(direction);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(next);
      setAnimating(false);
    }, 420);
  };

  const next = () => goTo((current + 1) % TESTIMONIALS.length, 'forward');
  const prev = () => goTo((current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length, 'backward');

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [current, animating]);

  const t = TESTIMONIALS[current];

  const slideStyle = animating ? {
    opacity: 0,
    transform: `translateX(${dir === 'forward' ? '-48px' : '48px'})`,
    transition: 'opacity 0.38s ease, transform 0.38s cubic-bezier(0.22,1,0.36,1)',
  } : {
    opacity: 1,
    transform: 'translateX(0)',
    transition: 'opacity 0.38s ease, transform 0.38s cubic-bezier(0.22,1,0.36,1)',
  };

  return (
    <section className="bg-surface border-y border-surface3">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="reveal text-xs font-medium uppercase tracking-widest mb-10 text-center" style={{ color: '#c8a96e' }}>From our clients</p>

        <div className="overflow-hidden">
          <div style={slideStyle} className="text-center">
            <blockquote className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-text-1 leading-snug mb-8">
              "{t.quote}"
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-display font-extrabold text-base flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #c8a96e, #b8934a)', color: '#0f0e17' }}>
                {t.initials}
              </div>
              <div className="text-left">
                <p className="font-display font-extrabold text-lg text-text-1">{t.name}</p>
                <p className="text-base font-medium" style={{ color: '#c8a96e' }}>Owner, {t.property}</p>
                <p className="text-text-3 text-xs mt-0.5">{t.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <button onClick={prev} className="w-9 h-9 rounded-full border border-surface3 flex items-center justify-center text-text-3 transition-colors hover:border-[rgba(200,169,110,0.4)] hover:text-text-1"
            style={{ background: 'transparent', cursor: 'pointer' }}>
            ←
          </button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => goTo(i, i > current ? 'forward' : 'backward')}
                className="rounded-full transition-all"
                style={{ width: i === current ? '20px' : '6px', height: '6px', background: i === current ? '#c8a96e' : 'rgba(200,169,110,0.25)', border: 'none', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
          <button onClick={next} className="w-9 h-9 rounded-full border border-surface3 flex items-center justify-center text-text-3 transition-colors hover:border-[rgba(200,169,110,0.4)] hover:text-text-1"
            style={{ background: 'transparent', cursor: 'pointer' }}>
            →
          </button>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { profileStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profileStatus === 'ready') navigate('/dashboard', { replace: true });
  }, [profileStatus, navigate]);

  useScrollReveal();

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>Chakrio — Property Bookings, Auto-Recorded</title>
        <meta name="description" content="Record property bookings, expenses & cancellations by message. Chakrio's AI logs everything instantly. Free dashboard for homestay and villa managers." />
        <link rel="canonical" href="https://chakrio.com/" />
        <meta property="og:title" content="Chakrio — Property Bookings, Auto-Recorded" />
        <meta property="og:description" content="Send a message, your booking is logged. Chakrio's AI records everything automatically — no spreadsheets, no manual entry." />
        <meta property="og:url" content="https://chakrio.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://chakrio.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chakrio — Property Bookings, Auto-Recorded" />
        <meta name="twitter:description" content="Send a message, your booking is logged. Chakrio's AI records everything automatically." />
        <meta name="twitter:image" content="https://chakrio.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Chakrio",
          "url": "https://chakrio.com",
          "logo": {
            "@type": "ImageObject",
            "url": "https://chakrio.com/og-image.png",
            "width": 1200,
            "height": 630
          },
          "description": "Chakrio is an AI-powered property booking automation tool for homestays, villas, and guesthouses in India. Property managers record bookings, cancellations, and expenses by sending plain-language chat messages.",
          "areaServed": "IN",
          "serviceType": "Property Management Software"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Chakrio",
          "url": "https://chakrio.com",
          "description": "AI-powered property booking automation for homestays, villas, and guesthouses"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Chakrio",
          "description": "Chakrio is an AI-powered property booking automation tool. Property managers send plain-language messages via chatbot and Chakrio automatically records bookings, cancellations, and expenses to a real-time dashboard.",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://chakrio.com",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" }
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How Chakrio automates property booking records",
          "description": "Three steps to automate your property booking records using Chakrio's AI chatbot.",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Send a message", "text": "You type a booking or expense in plain language to the Chakrio chatbot — exactly how you would say it out loud." },
            { "@type": "HowToStep", "position": 2, "name": "AI parses it", "text": "Chakrio's AI extracts guest name, dates, amounts, and booking type — no structured input needed." },
            { "@type": "HowToStep", "position": 3, "name": "Auto-recorded", "text": "The data is recorded automatically and your dashboard updates in real time." }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "I already use a spreadsheet — why do I need Chakrio?",
              "acceptedAnswer": { "@type": "Answer", "text": "Spreadsheets require you to open them, find the right tab, and type every field manually for every booking. With Chakrio, you send a message in plain language and the record is created automatically — no switching apps, no formatting, no errors." }
            },
            {
              "@type": "Question",
              "name": "What if I have multiple properties?",
              "acceptedAnswer": { "@type": "Answer", "text": "Chakrio supports multiple properties under one account. Each property has its own booking records and dashboard. You can switch between them instantly from the same login." }
            },
            {
              "@type": "Question",
              "name": "What types of properties can use Chakrio?",
              "acceptedAnswer": { "@type": "Answer", "text": "Chakrio is built for owner-operators running homestays, villas, guesthouses, and small hotels. It works for single-property owners as well as those managing multiple properties." }
            },
            {
              "@type": "Question",
              "name": "Do I need technical knowledge to use Chakrio?",
              "acceptedAnswer": { "@type": "Answer", "text": "None at all. If you can send a text message, you can use Chakrio. You simply type bookings in natural language — the AI handles the rest." }
            },
            {
              "@type": "Question",
              "name": "How do I get started with Chakrio?",
              "acceptedAnswer": { "@type": "Answer", "text": "We onboard every property personally. WhatsApp us at +91 94618 88529 and we'll get your booking bot live — usually within 24 hours." }
            }
          ]
        })}</script>
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden grain-overlay">
        {/* Gold glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px]"
            style={{ background: 'radial-gradient(ellipse, rgba(200,169,110,0.18) 0%, transparent 70%)' }} />
        </div>
        {/* Decorative rings — echoing Chakrio logo motif */}
        <div className="absolute top-0 right-0 pointer-events-none overflow-hidden w-[480px] h-[480px] opacity-[0.045]">
          {[380, 280, 190, 100].map(r => (
            <div key={r} className="absolute rounded-full border"
              style={{ width: r, height: r, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', borderColor: '#c8a96e' }} />
          ))}
        </div>
        {/* Mirror rings left */}
        <div className="absolute bottom-0 left-0 pointer-events-none overflow-hidden w-[300px] h-[300px] opacity-[0.025]">
          {[240, 160, 80].map(r => (
            <div key={r} className="absolute rounded-full border"
              style={{ width: r, height: r, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', borderColor: '#c8a96e' }} />
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center">
          <div className="animate-fade-in-up stagger-1 inline-flex items-center gap-2 bg-surface2 border border-surface3 rounded-full px-4 py-1.5 text-xs text-text-2 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-ch-green inline-block" />
            Automate your property bookings with an AI chatbot
          </div>

          <h1 className="animate-fade-in-up stagger-2 font-display font-extrabold text-4xl sm:text-6xl text-text-1 mb-6 tracking-tight leading-tight">
            Your bookings.
            <br />
            <span style={{ background: 'linear-gradient(135deg, #c8a96e, #e8c98a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Auto-recorded.
            </span>
          </h1>

          <p className="animate-fade-in-up stagger-3 text-text-2 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Just send a message — <span className="text-text-1 font-medium">"Rajan, 3 nights from 5th April, ₹4500 advance"</span> — and Chakrio logs the booking instantly. No spreadsheets, no missed records.
          </p>

          <div className="animate-fade-in-up stagger-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              style={{ background: 'linear-gradient(135deg, #c8a96e, #b8934a)', color: '#0f0e17', fontWeight: 600, padding: '14px 32px', borderRadius: '12px', fontSize: '14px', textDecoration: 'none' }}
            >
              Get Started Free →
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl font-medium text-text-2 bg-surface hover:bg-surface2 transition-colors border border-surface3 text-sm"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="reveal text-center mb-10">
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#c8a96e' }}>Why Chakrio</p>
          <h2 className="font-display font-extrabold text-3xl text-text-1">Before vs After</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="reveal reveal-delay-1 bg-surface rounded-2xl border p-7" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>✕</span>
              <p className="text-sm font-semibold" style={{ color: '#f87171' }}>Before Chakrio</p>
            </div>
            <ul className="space-y-4 text-text-2 text-base">
              <li>• WhatsApp screenshots piling up — no organised record</li>
              <li>• Writing bookings in a register after every call</li>
              <li>• Forgot to log a booking? Guest arrived, no record found</li>
              <li>• End-of-month P&L takes hours to compile</li>
              <li>• No visibility into cancellations or refunds</li>
              <li>• Expenses written on paper, lost by month-end</li>
            </ul>
          </div>
          <div className="reveal reveal-delay-2 rounded-2xl border p-7" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.08) 0%, #16151f 70%)', borderColor: 'rgba(200,169,110,0.35)' }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold"
                style={{ background: 'rgba(200,169,110,0.15)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.4)' }}>✓</span>
              <p className="text-sm font-semibold" style={{ color: '#c8a96e' }}>After Chakrio</p>
            </div>
            <ul className="space-y-4 text-text-2 text-base">
              <li>• Send a message → booking is recorded in seconds</li>
              <li>• Dashboard updates automatically — no manual entry</li>
              <li>• Every booking, cancellation, and refund logged</li>
              <li>• Monthly P&L report delivered on the 1st — automatically</li>
              <li>• Full refund and advance-retained tracking</li>
              <li>• Expense logged with one line: "chlorine ₹850"</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 rounded-2xl overflow-hidden border border-surface3 aspect-video">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/aLTnEKfp_7c"
            title="Chakrio demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* Free Tools — trust builder, above the fold */}
      <section id="tools" className="border-y border-surface3 bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="reveal flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#c8a96e' }}>Free resources</p>
              <h2 className="font-display font-extrabold text-2xl text-text-1">Free Tools for Property Managers</h2>
            </div>
            <p className="text-text-3 text-sm">No sign-up required.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TOOLS.map(t => (
              <Link
                key={t.href}
                to={t.href}
                className="card-hover bg-bg-app rounded-2xl border border-surface3 p-6 group reveal"
                style={{ textDecoration: 'none' }}
              >
                <h3 className="font-display font-extrabold text-base text-text-1 mb-2 transition-colors group-hover:text-accent">
                  {t.title}
                </h3>
                <p className="text-text-2 text-sm leading-relaxed mb-4">{t.desc}</p>
                <span className="text-sm font-medium" style={{ color: '#c8a96e' }}>Use free tool →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
        <div className="reveal text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl text-text-1 mb-3">How it works</h2>
          <p className="text-text-2 max-w-xl mx-auto">Three steps from a chat message to a recorded booking.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.step} className={`reveal reveal-delay-${i + 1} bg-surface rounded-2xl border border-surface3 p-7`}>
              <div className="relative">
                <div className="absolute -top-2 -left-2 w-16 h-16 rounded-full blur-xl pointer-events-none"
                  style={{ background: 'rgba(200,169,110,0.12)' }} />
                <div className="font-display font-extrabold text-4xl mb-4 relative" style={{ color: 'rgba(200,169,110,0.7)' }}>{s.step}</div>
              </div>
              <h3 className="font-display font-extrabold text-lg text-text-1 mb-2">{s.title}</h3>
              <p className="text-text-2 text-sm leading-relaxed mb-4">{s.body}</p>
              <p className="text-xs px-3 py-2 rounded-lg font-mono" style={{ background: 'rgba(200,169,110,0.07)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.15)' }}>
                {s.example}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface border-y border-surface3">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="reveal text-center mb-12">
            <h2 className="font-display font-extrabold text-3xl text-text-1 mb-3">Everything you need</h2>
            <p className="text-text-2 max-w-xl mx-auto">Built for small property managers who handle everything on their phone.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`reveal reveal-delay-${(i % 2) + 1} bg-bg-app rounded-2xl border border-surface3 p-7 flex gap-4`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}35` }}>
                  <f.Icon size={20} style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-text-1 mb-2">{f.title}</h3>
                  <p className="text-text-2 text-base leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Screenshot */}
      <section className="bg-surface border-y border-surface3">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="reveal text-center mb-10">
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#c8a96e' }}>The dashboard</p>
            <h2 className="font-display font-extrabold text-3xl text-text-1">See your property at a glance</h2>
            <p className="text-text-2 mt-3 max-w-xl mx-auto text-sm">Revenue, bookings, expenses, and upcoming guests — all in one view, always up to date.</p>
          </div>
          <div className="reveal reveal-delay-1 rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(200,169,110,0.2)' }}>
            <img
              src="/screenshot.png"
              alt="Chakrio property dashboard showing bookings, revenue, and expenses"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-20">
        <div className="reveal text-center mb-12">
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#c8a96e' }}>Pricing</p>
          <h2 className="font-display font-extrabold text-3xl text-text-1">Simple, transparent pricing</h2>
          <p className="text-text-2 mt-3 max-w-xl mx-auto text-sm">No hidden fees. Pay for the rooms you operate.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-0 max-w-3xl mx-auto">
          {/* Setup card — first */}
          <div className="flex-1 bg-surface rounded-2xl sm:rounded-r-none border border-surface3 p-8 flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-3 mb-3">One-time setup</p>
            <div className="mb-1">
              <span className="font-display font-extrabold text-4xl text-text-1">Custom</span>
            </div>
            <p className="text-text-3 text-sm mb-6">Depends on property type &amp; room count</p>
            <ul className="space-y-2 text-text-2 text-sm mb-8 flex-1">
              <li>✓ Bot configuration &amp; testing</li>
              <li>✓ Dashboard onboarding</li>
              <li>✓ WhatsApp / Telegram setup</li>
              <li>✓ Team walkthrough</li>
              <li>✓ 30-day handholding</li>
            </ul>
            <a
              href="https://wa.me/919461888529"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center border border-surface3 rounded-xl py-3 text-sm font-medium text-text-2 transition-colors"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'; e.currentTarget.style.color = '#f0eee8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
            >
              Contact for quote →
            </a>
          </div>

          {/* Plus divider */}
          <div className="hidden sm:flex items-center justify-center px-4 py-0 text-2xl font-display font-extrabold flex-shrink-0" style={{ color: 'rgba(200,169,110,0.5)' }}>
            +
          </div>

          {/* Subscription card — second */}
          <div className="flex-1 rounded-2xl sm:rounded-l-none border p-8 flex flex-col" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.08) 0%, #16151f 70%)', borderColor: 'rgba(200,169,110,0.3)' }}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 self-start"
              style={{ background: 'rgba(200,169,110,0.15)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.35)' }}>
              ★ Most Popular
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#c8a96e' }}>Monthly subscription</p>
            <div className="mb-1">
              <span className="font-display font-extrabold text-5xl text-text-1">₹2,000</span>
              <span className="text-text-2 text-sm ml-1">/month</span>
            </div>
            <p className="text-sm font-semibold mb-6" style={{ color: '#c8a96e' }}>+ ₹100 per room / month</p>
            <ul className="space-y-2 text-text-2 text-sm mb-8 flex-1">
              <li>✓ AI booking &amp; expense logging</li>
              <li>✓ Real-time dashboard</li>
              <li>✓ Monthly P&amp;L reports</li>
              <li>✓ Multi-property support</li>
              <li>✓ Telegram &amp; WhatsApp bot access</li>
            </ul>
            <a
              href="https://wa.me/919461888529"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center border border-surface3 rounded-xl py-3 text-sm font-medium text-text-2 transition-colors"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'; e.currentTarget.style.color = '#f0eee8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
            >
              Contact for quote →
            </a>
          </div>
        </div>
        <p className="text-center text-text-3 text-sm mt-8 max-w-lg mx-auto">
          Month 1: one-time setup cost + ₹2,000 + ₹100/room. &nbsp;Month 2 onwards: ₹2,000 + ₹100/room only.
        </p>
      </section>

      {/* Testimonials — carousel */}
      <TestimonialCarousel />

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20 w-full">
        <div className="reveal text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl text-text-1 mb-3">Frequently Asked Questions</h2>
          <p className="text-text-2 max-w-xl mx-auto">Everything you need to know about Chakrio.</p>
        </div>
        <div className="space-y-3">
          {[
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
              a: 'Chakrio is built for owner-operators running homestays, villas, guesthouses, and small hotels. It works for single-property owners as well as those managing two or more properties.',
            },
            {
              q: 'Do I need technical knowledge to use Chakrio?',
              a: 'None at all. If you can send a text message, you can use Chakrio. You simply type bookings in natural language — the AI handles the rest.',
            },
            {
              q: 'How do I get started?',
              a: 'We onboard every property personally. WhatsApp us at +91 94618 88529 and we\'ll get your booking bot live — usually within 24 hours.',
            },
            {
              q: 'How long does setup take?',
              a: 'Most properties are live within 24 hours of contacting us. We handle the entire setup — bot configuration, dashboard access, and a walkthrough with your team. You don\'t need to do anything technical.',
            },
            {
              q: 'Which OTAs does Chakrio work with?',
              a: 'Chakrio works alongside any OTA — MakeMyTrip, Booking.com, Airbnb, or direct bookings. You simply forward or retype the booking into the chat and Chakrio logs it. It doesn\'t require API access to any OTA.',
            },
            {
              q: 'What if I send a wrong message or make a mistake?',
              a: 'Just send a correction. For example: "Update Rajan check-out to 8th April." Chakrio will find the booking and update it. If you need to cancel, just say so — the bot handles updates, cancellations, and corrections the same way it handles new bookings.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="bg-surface border border-surface3 rounded-2xl group">
              <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none select-none">
                <span className="font-medium text-text-1 pr-4">{q}</span>
                <span className="text-text-3 text-lg flex-shrink-0 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-6 pb-5 text-text-2 text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Strip */}
      <section className="max-w-4xl mx-auto px-6 pb-20 w-full">
        <div className="reveal rounded-2xl p-8 sm:p-12 text-center border" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(37,211,102,0.07) 0%, rgba(200,169,110,0.05) 50%, transparent 70%), #16151f', borderColor: 'rgba(37,211,102,0.25)' }}>
          <div className="w-16 h-px mx-auto mb-6" style={{ background: 'linear-gradient(90deg, transparent, #c8a96e, transparent)' }} />
          <h2 className="font-display font-extrabold text-3xl text-text-1 mb-4">
            We onboard every property personally.
          </h2>
          <p className="text-text-2 mb-8 max-w-lg mx-auto">
            WhatsApp us and we'll have your booking bot live within 24 hours — no setup on your end.
          </p>
          <a
            href="https://wa.me/919461888529"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'linear-gradient(135deg, #c8a96e, #b8934a)', color: '#0f0e17', fontWeight: 600, padding: '14px 32px', borderRadius: '12px', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
          >
            WhatsApp us to get set up →
          </a>
          <p className="text-text-3 text-sm mt-6">
            Or{' '}
            <Link
              to="/login"
              style={{ color: '#c8a96e' }}
              className="hover:underline"
            >
              sign in
            </Link>
            {' '}if you already have an account.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

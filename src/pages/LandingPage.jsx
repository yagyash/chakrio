import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

const FEATURES = [
  {
    icon: '📅',
    title: 'Instant Booking Records',
    body: 'Send a message like "Rajan, 3 nights from 5th April, ₹4500 advance" — Chakrio parses it and logs the booking automatically.',
  },
  {
    icon: '❌',
    title: 'Cancellation Tracking',
    body: 'Chakrio extracts refund amounts and advance retained from cancellation messages and updates your sheet in real time.',
  },
  {
    icon: '💸',
    title: 'Expense Logging',
    body: 'Log chlorine, maintenance, or staff costs via Telegram. No spreadsheet entry, no manual errors.',
  },
  {
    icon: '📊',
    title: 'Monthly Reports',
    body: 'Get automated monthly P&L summaries — revenue, expenses, and net profit — sent directly to you.',
  },
];

const STEPS = [
  { step: '01', title: 'Send a message', body: 'Your property manager types a booking or expense in plain language on Telegram.' },
  { step: '02', title: 'AI parses it', body: "Chakrio's AI extracts guest name, dates, amounts, and booking type — no structured input needed." },
  { step: '03', title: 'Auto-recorded', body: 'The data is instantly written to your Google Sheet. Your dashboard updates in real time.' },
];

const TOOLS = [
  { title: 'Hotel Occupancy Rate Calculator', desc: "Calculate your property's occupancy % for any period.", href: '/tools/occupancy-calculator' },
  { title: 'Rental Income Calculator', desc: 'Estimate gross and net income from your rooms.', href: '/tools/rental-income-calculator' },
  { title: 'Cancellation Policy Generator', desc: 'Generate a professional cancellation policy in seconds.', href: '/tools/cancellation-policy' },
];

export default function LandingPage() {
  const { profileStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profileStatus === 'ready') navigate('/dashboard', { replace: true });
  }, [profileStatus, navigate]);

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>Chakrio — Manage Property Bookings via Telegram</title>
        <meta name="description" content="Automate property bookings, cancellations & expenses via Telegram. Chakrio records everything in your Google Sheet automatically. Free tools for property managers." />
        <link rel="canonical" href="https://chakrio.com/" />
        <meta property="og:title" content="Chakrio — Manage Property Bookings via Telegram" />
        <meta property="og:description" content="Automate property bookings, cancellations & expenses via Telegram. Chakrio records everything in your Google Sheet automatically." />
        <meta property="og:url" content="https://chakrio.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Chakrio — Manage Property Bookings via Telegram" />
        <meta name="twitter:description" content="Automate property bookings, cancellations & expenses via Telegram." />
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow — gold */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(ellipse, rgba(200,169,110,0.12) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-surface2 border border-surface3 rounded-full px-4 py-1.5 text-xs text-text-2 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-ch-green inline-block" />
            Automate your property bookings via Telegram
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-text-1 mb-6 tracking-tight leading-tight">
            Manage your property
            <br />
            <span style={{ background: 'linear-gradient(135deg, #c8a96e, #e8c98a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              bookings by message
            </span>
          </h1>

          <p className="text-text-2 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Chakrio connects to Telegram and auto-records bookings, cancellations, and expenses
            into your Google Sheet — no spreadsheet entry, no manual work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl text-text-1 mb-3">How it works</h2>
          <p className="text-text-2 max-w-xl mx-auto">Three steps from a Telegram message to a recorded booking.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map(s => (
            <div key={s.step} className="bg-surface rounded-2xl border border-surface3 p-7">
              <div className="font-display font-extrabold text-4xl mb-4" style={{ color: 'rgba(200,169,110,0.3)' }}>{s.step}</div>
              <h3 className="font-display font-extrabold text-lg text-text-1 mb-2">{s.title}</h3>
              <p className="text-text-2 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface border-y border-surface3">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display font-extrabold text-3xl text-text-1 mb-3">Everything you need</h2>
            <p className="text-text-2 max-w-xl mx-auto">Built for small property managers who handle everything on their phone.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-bg-app rounded-2xl border border-surface3 p-7 flex gap-4">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-display font-extrabold text-base text-text-1 mb-2">{f.title}</h3>
                  <p className="text-text-2 text-sm leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Tools */}
      <section id="tools" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl text-text-1 mb-3">Free Tools for Property Managers</h2>
          <p className="text-text-2 max-w-xl mx-auto">
            Handy calculators and generators — free, no sign-up required.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {TOOLS.map(t => (
            <Link
              key={t.href}
              to={t.href}
              className="bg-surface rounded-2xl border border-surface3 p-7 transition-colors group"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}
            >
              <h3 className="font-display font-extrabold text-base text-text-1 mb-2 transition-colors group-hover:text-accent">
                {t.title}
              </h3>
              <p className="text-text-2 text-sm leading-relaxed mb-4">{t.desc}</p>
              <span className="text-sm font-medium" style={{ color: '#c8a96e' }}>Use free tool →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Strip */}
      <section className="max-w-4xl mx-auto px-6 pb-20 w-full">
        <div className="rounded-2xl p-12 text-center border" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.12) 0%, transparent 70%), #16151f', borderColor: 'rgba(200,169,110,0.2)' }}>
          <h2 className="font-display font-extrabold text-3xl text-text-1 mb-4">
            Ready to automate your bookings?
          </h2>
          <p className="text-text-2 mb-8 max-w-lg mx-auto">
            Join property managers who run their bookings entirely via Telegram — no spreadsheet entry, no missed records.
          </p>
          <Link
            to="/login"
            style={{ background: 'linear-gradient(135deg, #c8a96e, #b8934a)', color: '#0f0e17', fontWeight: 600, padding: '14px 32px', borderRadius: '12px', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
          >
            Get Started →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

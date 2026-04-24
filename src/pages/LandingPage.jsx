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
    body: 'Chakrio extracts refund amounts and advance retained from cancellation messages and updates your records in real time.',
  },
  {
    icon: '💸',
    title: 'Expense Logging',
    body: 'Type "chlorine ₹850" or "plumber ₹2200" — Chakrio logs the expense instantly. No dropdowns, no category hunting.',
  },
  {
    icon: '📊',
    title: 'Monthly Reports',
    body: 'On the 1st of each month, get a full P&L — total revenue, all expenses, and net profit — sent straight to your phone.',
  },
];

const STEPS = [
  { step: '01', title: 'Send a message', body: 'You type a booking or expense in plain language to the chatbot — exactly how you would say it out loud.' },
  { step: '02', title: 'AI parses it', body: "Chakrio's AI extracts guest name, dates, amounts, and booking type — no structured input needed." },
  { step: '03', title: 'Auto-recorded', body: 'The data is recorded automatically and your dashboard updates in real time.' },
];

const TOOLS = [
  { title: 'Hotel Occupancy Rate Calculator', desc: "Calculate your property's occupancy % for any period.", href: '/tools/occupancy-calculator' },
  { title: 'Rental Income Calculator', desc: 'Estimate gross and net income from your rooms.', href: '/tools/rental-income-calculator' },
  { title: 'Cancellation Policy Generator', desc: 'Generate a professional cancellation policy in seconds.', href: '/tools/cancellation-policy' },
  { title: 'Villa & Homestay Invoice Generator', desc: 'Generate a clean PDF invoice for your guests in seconds. No sign-up required.', href: '/tools/invoice-generator' },
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
      <section className="relative overflow-hidden">
        {/* Background glow — gold */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(ellipse, rgba(200,169,110,0.12) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-surface2 border border-surface3 rounded-full px-4 py-1.5 text-xs text-text-2 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-ch-green inline-block" />
            Automate your property bookings with an AI chatbot
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-text-1 mb-6 tracking-tight leading-tight">
            Your bookings.
            <br />
            <span style={{ background: 'linear-gradient(135deg, #c8a96e, #e8c98a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Auto-recorded.
            </span>
          </h1>

          <p className="text-text-2 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Just send a message — <span className="text-text-1 font-medium">"Rajan, 3 nights from 5th April, ₹4500 advance"</span> — and Chakrio logs the booking instantly. No spreadsheets, no missed records.
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

      {/* Free Tools — trust builder, above the fold */}
      <section id="tools" className="border-y border-surface3 bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#c8a96e' }}>Free resources</p>
              <h2 className="font-display font-extrabold text-2xl text-text-1">Free Tools for Property Managers</h2>
            </div>
            <p className="text-text-3 text-sm">No sign-up required.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TOOLS.map(t => (
              <Link
                key={t.href}
                to={t.href}
                className="bg-bg-app rounded-2xl border border-surface3 p-6 transition-colors group"
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
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl text-text-1 mb-3">How it works</h2>
          <p className="text-text-2 max-w-xl mx-auto">Three steps from a chat message to a recorded booking.</p>
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

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-12">
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
        <div className="rounded-2xl p-12 text-center border" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.12) 0%, transparent 70%), #16151f', borderColor: 'rgba(200,169,110,0.2)' }}>
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

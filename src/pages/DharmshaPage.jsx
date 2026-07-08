import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

const DHARMSHALA_FAQS = [
  {
    q: 'Is Chakrio designed for dharmshalas specifically?',
    a: 'Yes. Our first client is Raghuleela Dham in Goverdhan — a 60-room dharmshala that used to manage everything in a physical register. Chakrio handles high-volume group bookings, festival rushes, and bulk arrivals in plain Hindi or English messages.',
  },
  {
    q: 'Can we log group bookings for 10–20 pilgrims at once?',
    a: 'Yes. You can send a single message like "Sharma group, 15 people, 3 nights from Purnima" and Chakrio logs it as one booking. Each booking holds arrival dates, group size, room, advance, and balance.',
  },
  {
    q: 'Does it work in Hindi?',
    a: 'The AI understands natural language — if your team types in Hindi or a mix of Hindi and English, Chakrio parses it correctly. No need to switch to English or fill in fields.',
  },
  {
    q: 'Can I track prasad and maintenance expenses?',
    a: 'Yes. Type any expense in WhatsApp — prasad, maintenance, repairs — and Chakrio records it instantly. Your monthly P&L report breaks it down by category.',
  },
];

export default function DharmshaPage() {
  return (
    <div className="min-h-screen text-text-1 flex flex-col" style={{ background: '#0E0B14' }}>
      <Helmet>
        <title>Dharmshala Booking &amp; Management Software — WhatsApp Based | Chakrio</title>
        <meta name="description" content="Manage your dharmshala's bookings, rooms, and expenses entirely by WhatsApp. Bulk group bookings, festival campaigns, monthly P&L. Trusted at Raghuleela Dham, Goverdhan." />
        <link rel="canonical" href="https://chakrio.com/dharmshala" />
        <meta property="og:title" content="Dharmshala Booking & Management Software — WhatsApp Based | Chakrio" />
        <meta property="og:description" content="Manage your dharmshala's bookings, rooms, and expenses entirely by WhatsApp. Bulk group bookings, festival campaigns, monthly P&L." />
        <meta property="og:url" content="https://chakrio.com/dharmshala" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://chakrio.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Dharmshala Booking & Management Software | Chakrio" />
        <meta name="twitter:description" content="Manage your dharmshala's bookings, rooms, and expenses entirely by WhatsApp." />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Dharmshala Booking & Management Software — WhatsApp Based | Chakrio',
          url: 'https://chakrio.com/dharmshala',
          description: "Manage your dharmshala's bookings, rooms, and expenses entirely by WhatsApp.",
          author: { '@type': 'Organization', name: 'Chakrio', url: 'https://chakrio.com' },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: DHARMSHALA_FAQS.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        })}</script>
      </Helmet>

      <Navbar />

      {/* Hero */}
      <header className="max-w-4xl mx-auto px-6 pt-20 pb-14 w-full text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm mb-8"
          style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#CFCAD9' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#25D366', boxShadow: '0 0 9px #25D366', display: 'inline-block' }} />
          Trusted at Raghuleela Dham, Goverdhan
        </div>
        <h1 className="font-display font-extrabold tracking-tight text-text-1" style={{ fontSize: 'clamp(34px,6vw,72px)', lineHeight: .97, letterSpacing: '-.035em', marginBottom: 20 }}>
          WhatsApp booking system{' '}
          <span style={{ color: '#C9A24B' }}>built for dharmshalas</span>
        </h1>
        <p className="text-text-2 leading-relaxed mx-auto mb-10" style={{ fontSize: 18, maxWidth: '52ch' }}>
          Group arrivals, festival rush, bulk bookings in Hindi or English — log everything by WhatsApp message. No register, no spreadsheet.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="https://wa.me/919461888529?text=Hi%2C+I+want+to+see+Chakrio+for+my+dharmshala" target="_blank" rel="noopener noreferrer" style={{
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
      </header>

      {/* Testimonial — Koustubh */}
      <section className="max-w-4xl mx-auto px-6 pb-16 w-full">
        <div className="rounded-2xl border p-8" style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(201,162,75,.1) 0%,rgba(255,255,255,.02) 70%)', borderColor: 'rgba(201,162,75,.35)', borderTop: '2px solid #C9A24B' }}>
          <blockquote className="text-sm text-text-2 leading-relaxed mb-6">
            "Chakrio completely changed how we manage our bookings. What used to take an hour of writing in our register now happens automatically the moment we send a message. We can track expenses through the reports and check room availability quite easily."
          </blockquote>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[{ value: '60 rooms', label: 'Property size' }, { value: 'Physical register', label: 'Was using before' }, { value: '1 hr/day', label: 'Saved on record-keeping' }].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(201,162,75,.07)', border: '1px solid rgba(201,162,75,.15)' }}>
                <p className="font-display font-extrabold text-sm text-text-1 mb-0.5">{s.value}</p>
                <p className="text-text-3 text-xs leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-display font-extrabold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#C9A24B,#b8934a)', color: '#0E0B14' }}>
              KS
            </div>
            <div>
              <p className="font-display font-extrabold text-base text-text-1">Koustubh Sharma</p>
              <p className="text-sm font-medium" style={{ color: '#C9A24B' }}>Owner, Raghuleela Dham</p>
              <p className="text-text-3 text-xs mt-0.5">Goverdhan, Uttar Pradesh</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20 w-full">
        <h2 className="font-display font-extrabold text-2xl text-text-1 mb-8 tracking-tight text-center">Built for how dharmshalas actually work</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Group & bulk bookings', body: 'Log a group of 20 pilgrims in one message — name, room type, dates, advance. No separate entries per person.' },
            { title: 'Hindi-friendly natural language', body: 'Type as you speak — Hindi, English, or mixed. The AI understands context and extracts booking details correctly.' },
            { title: 'Festival-season campaigns', body: 'Send a WhatsApp broadcast to previous guests ahead of Holi, Diwali, or Janmashtami. Personalised, tracked, and ₹1/message.' },
            { title: 'Monthly P&L reports', body: 'On the 1st of each month, get a full P&L on WhatsApp — total revenue, expenses by category, and net surplus. Auto-sent.' },
            { title: 'Google review funnel', body: 'After checkout, Chakrio sends a polite message asking guests to leave a review. No manual follow-up required.' },
            { title: 'Expense tracking for all costs', body: 'Log maintenance costs, prasad expenses, and repair bills in one WhatsApp message. Categorised automatically in your monthly P&L.' },
          ].map(f => (
            <div key={f.title} className="rounded-2xl border p-6" style={{ background: 'rgba(255,255,255,.025)', borderColor: 'rgba(255,255,255,.09)' }}>
              <h3 className="font-display font-extrabold text-text-1 text-base mb-2">{f.title}</h3>
              <p className="text-text-2 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-20 w-full">
        <h2 className="font-display font-extrabold text-2xl text-text-1 mb-8 tracking-tight text-center">Questions from dharmshala managers</h2>
        <div className="space-y-3">
          {DHARMSHALA_FAQS.map(({ q, a }) => (
            <details key={q} style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 16 }}>
              <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none select-none">
                <span className="font-medium text-text-1 pr-4">{q}</span>
                <span className="text-text-3 text-lg flex-shrink-0">+</span>
              </summary>
              <p className="px-6 pb-5 text-text-2 text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Back to homepage */}
      <div className="text-center pb-10">
        <Link to="/" style={{ fontSize: 14, color: '#C9A24B', textDecoration: 'underline' }}>← Back to Chakrio homepage</Link>
      </div>

      <Footer />
    </div>
  );
}

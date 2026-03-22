import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import CTABox from '../../components/tools/CTABox';

const DEFAULT_WINDOWS = [
  { days: 7, refund: 100 },
  { days: 3, refund: 50 },
  { days: 1, refund: 0 },
];

export default function CancellationPolicyGenerator() {
  const [propertyName, setPropertyName] = useState('');
  const [depositPct, setDepositPct] = useState('30');
  const [windows, setWindows] = useState(DEFAULT_WINDOWS);
  const [noShow, setNoShow] = useState('No refund will be provided for no-shows.');
  const [policy, setPolicy] = useState('');
  const [copied, setCopied] = useState(false);

  function updateWindow(i, field, value) {
    setWindows(w => w.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function generate() {
    const name = propertyName.trim() || 'Our Property';
    const sorted = [...windows].sort((a, b) => b.days - a.days);

    const lines = [
      `CANCELLATION POLICY — ${name.toUpperCase()}`,
      '',
      `ADVANCE DEPOSIT`,
      `A ${depositPct}% advance deposit is required to confirm your booking.`,
      '',
      `CANCELLATION TERMS`,
    ];

    sorted.forEach((w, i) => {
      const next = sorted[i + 1];
      if (i === 0) {
        lines.push(`• Cancellations made ${w.days}+ days before check-in: ${w.refund}% refund of total booking amount.`);
      } else if (next) {
        lines.push(`• Cancellations made ${next.days + 1}–${w.days - 1} days before check-in: ${w.refund}% refund of total booking amount.`);
      } else {
        lines.push(`• Cancellations made within ${w.days} day(s) of check-in: ${w.refund}% refund of total booking amount.`);
      }
    });

    lines.push('');
    lines.push('NO-SHOW POLICY');
    lines.push(noShow.trim() || 'No refund will be provided for no-shows.');
    lines.push('');
    lines.push(`This policy is effective as of ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`);

    setPolicy(lines.join('\n'));
    setCopied(false);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(policy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Clipboard access denied — fall back to selecting the text
      const el = document.querySelector('pre');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    });
  }

  function reset() {
    setPropertyName(''); setDepositPct('30');
    setWindows(DEFAULT_WINDOWS); setNoShow('No refund will be provided for no-shows.');
    setPolicy(''); setCopied(false);
  }

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>Hotel Cancellation Policy Generator — Free Template | Chakrio</title>
        <meta name="description" content="Generate a professional hotel cancellation policy in seconds. Customise refund windows, advance deposits, and no-show terms. Free, no sign-up needed." />
        <link rel="canonical" href="https://chakrio.com/tools/cancellation-policy" />
        <meta property="og:title" content="Hotel Cancellation Policy Generator — Free Template | Chakrio" />
        <meta property="og:description" content="Generate a professional hotel cancellation policy in seconds. Customise refund windows, advance deposits, and no-show terms." />
        <meta property="og:url" content="https://chakrio.com/tools/cancellation-policy" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://chakrio.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hotel Cancellation Policy Generator — Free Template | Chakrio" />
        <meta name="twitter:description" content="Generate a professional hotel cancellation policy in seconds. Free, no sign-up needed." />
        <meta name="twitter:image" content="https://chakrio.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://chakrio.com/" },
            { "@type": "ListItem", "position": 2, "name": "Free Tools", "item": "https://chakrio.com/#tools" },
            { "@type": "ListItem", "position": 3, "name": "Hotel Cancellation Policy Generator", "item": "https://chakrio.com/tools/cancellation-policy" }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What should a hotel cancellation policy include?",
              "acceptedAnswer": { "@type": "Answer", "text": "A hotel cancellation policy should include: the advance deposit required to confirm a booking (typically 20–30%), cancellation windows with corresponding refund percentages (e.g. 100% refund if cancelled 7+ days before check-in, 50% if 3–6 days, 0% within 48 hours), and a no-show policy (usually no refund). The policy should be clearly communicated at booking time." }
            },
            {
              "@type": "Question",
              "name": "What is a standard hotel advance deposit?",
              "acceptedAnswer": { "@type": "Answer", "text": "A standard hotel or homestay advance deposit is 20–30% of the total booking amount. This secures the reservation and compensates the property if the guest cancels late. Some properties in peak season or high-demand locations require up to 50% advance." }
            },
            {
              "@type": "Question",
              "name": "What is a fair cancellation window for a hotel?",
              "acceptedAnswer": { "@type": "Answer", "text": "A fair cancellation window for a hotel, homestay, or villa is typically 7 days before check-in for a full refund, 3 days before for a partial refund (50%), and no refund within 48–72 hours of check-in. Stricter policies (shorter windows, lower refunds) are common during peak seasons and long weekends." }
            }
          ]
        })}</script>
      </Helmet>
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-3 mb-8 flex items-center gap-2">
          <Link to="/" className="hover:text-text-2 transition-colors">Home</Link>
          <span>›</span>
          <span className="text-text-2">Free Tools</span>
          <span>›</span>
          <span className="text-text-1">Cancellation Policy Generator</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 mb-3 tracking-tight">
            Hotel Cancellation Policy Generator
          </h1>
          <p className="text-text-2 text-base leading-relaxed max-w-2xl">
            Create a professional cancellation policy for your hotel, homestay, or guesthouse in seconds.
            Fill in your terms — we'll generate clean, guest-ready policy text you can copy and share.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface rounded-2xl border border-surface3 p-8 mb-8">
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Property Name</label>
              <input
                type="text" value={propertyName}
                onChange={e => setPropertyName(e.target.value)} placeholder="e.g. Sunrise Villa"
                className="w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Advance Deposit Required (%)</label>
              <input
                type="number" min="0" max="100" value={depositPct}
                onChange={e => setDepositPct(e.target.value)} placeholder="e.g. 30"
                className="w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Cancellation Windows */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-text-2 mb-4">Cancellation Windows</h3>
            <div className="space-y-3">
              {windows.map((w, i) => (
                <div key={i} className="flex items-center gap-3 bg-surface2 rounded-lg p-4">
                  <span className="text-text-3 text-sm w-4">{i + 1}.</span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-text-2 text-sm whitespace-nowrap">Cancel</span>
                    <input
                      type="number" min="1" value={w.days}
                      onChange={e => updateWindow(i, 'days', e.target.value)}
                      className="w-20 bg-surface3 border border-surface3 rounded-lg px-3 py-2 text-text-1 text-sm focus:outline-none focus:border-accent transition-colors text-center"
                    />
                    <span className="text-text-2 text-sm whitespace-nowrap">+ days before →</span>
                    <input
                      type="number" min="0" max="100" value={w.refund}
                      onChange={e => updateWindow(i, 'refund', e.target.value)}
                      className="w-20 bg-surface3 border border-surface3 rounded-lg px-3 py-2 text-text-1 text-sm focus:outline-none focus:border-accent transition-colors text-center"
                    />
                    <span className="text-text-2 text-sm">% refund</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* No-show */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-text-2 mb-2">No-Show Policy</label>
            <textarea
              value={noShow}
              onChange={e => setNoShow(e.target.value)}
              rows={2}
              className="w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={generate}
              style={{ background: 'linear-gradient(135deg, #c8a96e, #b8934a)', color: '#0f0e17', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Generate Policy
            </button>
            {policy && (
              <button onClick={reset} className="px-6 py-3 rounded-xl font-medium text-sm text-text-2 bg-surface2 hover:bg-surface3 transition-colors">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Output */}
        {policy && (
          <div className="bg-surface rounded-2xl border border-brand/30 p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-extrabold text-lg text-text-1">Your Policy</h2>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${copied ? 'bg-ch-green/20 text-ch-green' : 'bg-surface2 text-text-2 hover:bg-surface3'}`}
              >
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre className="text-text-2 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {policy}
            </pre>
          </div>
        )}

        {/* What makes a good cancellation policy */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">What makes a good cancellation policy?</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            A good cancellation policy balances protecting your revenue against being guest-friendly. Overly strict policies deter bookings; overly lenient policies leave you with last-minute empty rooms.
          </p>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            <strong className="text-text-1">Standard structure:</strong> Require a <strong className="text-text-1">20–30% advance deposit</strong> to confirm. Offer a full refund for cancellations 7+ days before check-in, a partial refund (50%) for 3–6 days, and no refund within 48–72 hours.
          </p>
          <p className="text-text-2 text-sm leading-relaxed">
            <strong className="text-text-1">Peak season tip:</strong> It is standard practice to apply stricter cancellation terms during long weekends, holidays, and festival seasons — shorter refund windows and lower refund percentages are widely accepted by guests booking during high-demand periods.
          </p>
        </div>

        {/* CTA */}
        <CTABox
          headline="Chakrio auto-handles cancellations for you"
          body="When a cancellation comes in, Chakrio's AI extracts the refund amount and advance retained — and records it in your dashboard automatically."
          buttonText="See How Chakrio Works →"
          gold
        />

        {/* Related tools */}
        <div className="mt-10">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">More Free Tools</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/tools/occupancy-calculator" className="bg-surface rounded-xl border border-surface3 hover:border-accent/40 p-5 transition-colors group">
              <p className="font-medium text-text-1 group-hover:text-accent transition-colors mb-1">Occupancy Rate Calculator</p>
              <p className="text-text-2 text-sm">Calculate your property's occupancy rate for any period.</p>
            </Link>
            <Link to="/tools/rental-income-calculator" className="bg-surface rounded-xl border border-surface3 hover:border-accent/40 p-5 transition-colors group">
              <p className="font-medium text-text-1 group-hover:text-accent transition-colors mb-1">Rental Income Calculator</p>
              <p className="text-text-2 text-sm">Estimate gross and net income from your property.</p>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

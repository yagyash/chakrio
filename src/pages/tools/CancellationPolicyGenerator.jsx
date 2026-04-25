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
          "@type": "WebPage",
          "name": "Hotel Cancellation Policy Generator — Free Template | Chakrio",
          "url": "https://chakrio.com/tools/cancellation-policy",
          "description": "Generate a professional hotel cancellation policy in seconds. Customise refund windows, advance deposits, and no-show terms. Free, no sign-up needed.",
          "datePublished": "2025-01-01",
          "dateModified": "2026-03-23",
          "author": { "@type": "Organization", "name": "Chakrio", "url": "https://chakrio.com" },
          "publisher": { "@type": "Organization", "name": "Chakrio", "logo": { "@type": "ImageObject", "url": "https://chakrio.com/og-image.png" } },
          "isPartOf": { "@type": "WebSite", "name": "Chakrio", "url": "https://chakrio.com" }
        })}</script>
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
              "name": "How do I create a cancellation policy for my homestay or villa?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Use Chakrio's free Cancellation Policy Generator — select your refund terms, notice period, and advance conditions, and the tool instantly generates a professional policy you can share with guests."
              }
            },
            {
              "@type": "Question",
              "name": "Is this cancellation policy generator free to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, the Cancellation Policy Generator is completely free. No sign-up required. Generate as many policies as you need."
              }
            },
            {
              "@type": "Question",
              "name": "Can I customise the refund terms and notice period?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. You can set your own cancellation window (e.g. 48 hours, 7 days), specify what percentage of the advance is refunded, and define conditions for peak vs off-season bookings."
              }
            }
          ]
        })}</script>
      </Helmet>
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-3 mb-8 flex items-center gap-2">
          <a href="/" className="hover:text-text-2 transition-colors">Home</a>
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
            Generate a professional cancellation policy in seconds. Customise your refund windows,
            advance deposit terms, and no-show conditions — then copy and paste directly into your listing.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface rounded-2xl border border-surface3 p-8 mb-8">

          {/* Property name + deposit */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Property Name</label>
              <input type="text" value={propertyName} onChange={e => setPropertyName(e.target.value)}
                placeholder="e.g. Lakeside Villa"
                className="w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none transition-colors"
                onFocus={e => e.target.style.borderColor = '#c8a96e'} onBlur={e => e.target.style.borderColor = ''} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Advance Deposit (%)</label>
              <input type="number" min="0" max="100" value={depositPct} onChange={e => setDepositPct(e.target.value)}
                placeholder="e.g. 30"
                className="w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none transition-colors"
                onFocus={e => e.target.style.borderColor = '#c8a96e'} onBlur={e => e.target.style.borderColor = ''} />
            </div>
          </div>

          {/* Cancellation windows */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-text-2">Cancellation Windows</label>
              <button onClick={() => setWindows(w => [...w, { days: 2, refund: 25 }])}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{ background: 'rgba(200,169,110,0.12)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.25)' }}>
                + Add Window
              </button>
            </div>
            <div className="space-y-3">
              {windows.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-text-3 text-sm w-24 shrink-0">Cancel {i === 0 ? '≥' : '<'}</span>
                  <input type="number" min="1" value={w.days} onChange={e => updateWindow(i, 'days', Number(e.target.value))}
                    className="w-20 bg-surface2 border border-surface3 rounded-lg px-3 py-2 text-text-1 text-sm focus:outline-none transition-colors text-center"
                    onFocus={e => e.target.style.borderColor = '#c8a96e'} onBlur={e => e.target.style.borderColor = ''} />
                  <span className="text-text-3 text-sm shrink-0">days → </span>
                  <input type="number" min="0" max="100" value={w.refund} onChange={e => updateWindow(i, 'refund', Number(e.target.value))}
                    className="w-20 bg-surface2 border border-surface3 rounded-lg px-3 py-2 text-text-1 text-sm focus:outline-none transition-colors text-center"
                    onFocus={e => e.target.style.borderColor = '#c8a96e'} onBlur={e => e.target.style.borderColor = ''} />
                  <span className="text-text-3 text-sm shrink-0">% refund</span>
                  {windows.length > 1 && (
                    <button onClick={() => setWindows(w => w.filter((_, idx) => idx !== i))}
                      className="ml-auto text-text-3 hover:text-ch-red transition-colors text-lg leading-none">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* No-show */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-text-2 mb-2">No-Show Policy</label>
            <textarea value={noShow} onChange={e => setNoShow(e.target.value)} rows={2}
              className="w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none transition-colors resize-none text-sm"
              onFocus={e => e.target.style.borderColor = '#c8a96e'} onBlur={e => e.target.style.borderColor = ''} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={generate}
              style={{ background: 'linear-gradient(135deg, #c8a96e, #b8934a)', color: '#0f0e17', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
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
          <div className="bg-surface rounded-2xl border border-surface3 p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text-1">Your Cancellation Policy</h2>
              <button onClick={copyToClipboard}
                style={{ background: copied ? 'rgba(76,175,80,0.15)' : 'rgba(200,169,110,0.12)', color: copied ? '#4CAF50' : '#c8a96e', border: `1px solid ${copied ? 'rgba(76,175,80,0.3)' : 'rgba(200,169,110,0.25)'}`, borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
            <pre className="text-text-2 text-sm leading-relaxed whitespace-pre-wrap font-sans">{policy}</pre>
          </div>
        )}

        <CTABox />
        <div className='trust-signals text-center py-8 text-text-3 text-sm'><p>Free to Use — No Sign-Up Required. Generate as many policies as you need.</p></div>
      </main>

      <div className='intro hidden'><h2>About Chakrio</h2><p>Chakrio optimizes property management with AI-powered automation tools tailored for homestays, villas, and guesthouses. Our platform streamlines booking management, ensuring operational efficiency and ease for property managers.</p></div>
      <div className='entity-clarity hidden'><p>As a Software as a Service (SaaS) platform, Chakrio specifically targets property managers looking to simplify and enhance their booking and management processes for homestays, villas, and guesthouses.</p></div>
      <div className='use-cases hidden'><h3>Use Case Examples</h3><p>Utilize this tool to effortlessly generate customized cancellation policies for both peak season and off-season bookings, adjusting refund terms to optimize bookings and customer satisfaction.</p></div>

      {/* Related tools */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">More Free Tools</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/tools/occupancy-calculator"
            className="bg-surface rounded-xl border border-surface3 p-5 transition-colors"
            style={{ textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
            <p className="font-medium text-text-1 mb-1">Occupancy Rate Calculator</p>
            <p className="text-text-2 text-sm">Calculate your property's occupancy rate and compare to industry benchmarks.</p>
          </Link>
          <Link to="/tools/rental-income-calculator"
            className="bg-surface rounded-xl border border-surface3 p-5 transition-colors"
            style={{ textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
            <p className="font-medium text-text-1 mb-1">Rental Income Calculator</p>
            <p className="text-text-2 text-sm">Estimate gross and net income from your property.</p>
          </Link>
          <Link to="/tools/invoice-generator"
            className="bg-surface rounded-xl border border-surface3 p-5 transition-colors"
            style={{ textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
            <p className="font-medium text-text-1 mb-1">Villa & Homestay Invoice Generator</p>
            <p className="text-text-2 text-sm">Generate a professional PDF invoice for your guests. No sign-up required.</p>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

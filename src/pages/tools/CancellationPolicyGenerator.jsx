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
      <div className='intro text-center py-8'><h2>About Chakrio</h2><p>Chakrio optimizes property management with AI-powered automation tools tailored for homestays, villas, and guesthouses. Our platform streamlines booking management, ensuring operational efficiency and ease for property managers.</p></div>
      <div className='entity-clarity py-4'><p>As a Software as a Service (SaaS) platform, Chakrio specifically targets property managers looking to simplify and enhance their booking and management processes for homestays, villas, and guesthouses.</p></div>
      {/* Insertion point for content */}
      <div className='use-cases py-4'><h3>Use Case Examples</h3><p>Utilize this tool to effortlessly generate customized cancellation policies for both peak season and off-season bookings, adjusting refund terms to optimize bookings and customer satisfaction.</p></div>
      <CTABox />
      <div className='trust-signals text-center py-8'><h3>Free to Use — No Sign-Up Required</h3><p>This tool is provided free by Chakrio for property managers across India. Generate a professional cancellation policy in seconds and paste it directly into your listing, guest messages, or booking confirmation. No account needed.</p></div>
      <Footer />
    </div>
  );
}

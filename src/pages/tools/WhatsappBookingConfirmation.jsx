import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import CTABox from '../../components/tools/CTABox';
import ToolConversionHook from '../../components/tools/ToolConversionHook';
import LeadCaptureBox from '../../components/shared/LeadCaptureBox';
import { track } from '../../utils/analytics';

const inputCls = 'w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none transition-colors';

function formatDate(val) {
  if (!val) return '';
  return new Date(val + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmt(n) {
  return '₹' + Math.round(parseFloat(n) || 0).toLocaleString('en-IN');
}

export default function WhatsappBookingConfirmation() {
  const [propertyName, setPropertyName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [total, setTotal] = useState('');
  const [advance, setAdvance] = useState('');
  const [upiId, setUpiId] = useState('');
  const [copied, setCopied] = useState(false);

  const balance = Math.max(0, (parseFloat(total) || 0) - (parseFloat(advance) || 0));
  const hasMinFields = propertyName.trim() && guestName.trim() && checkIn && checkOut && total;

  function buildMessage() {
    const lines = [
      `✅ Booking Confirmed — ${propertyName.trim()}`,
      '',
      `Guest: ${guestName.trim()}`,
      `Check-in: ${formatDate(checkIn)}`,
      `Check-out: ${formatDate(checkOut)}`,
    ];
    if (roomNo.trim()) lines.push(`Room: ${roomNo.trim()}`);
    lines.push('');
    lines.push(`Total: ${fmt(total)}`);
    if (advance) {
      lines.push(`Advance Paid: ${fmt(advance)}`);
      lines.push(`Balance Due at Checkout: ${fmt(balance)}`);
    }
    if (upiId.trim()) {
      lines.push('');
      lines.push(`Pay advance via UPI: ${upiId.trim()}`);
    }
    lines.push('');
    lines.push('Thank you for booking with us! We look forward to welcoming you. 🙏');
    lines.push(`— ${propertyName.trim()}`);
    return lines.join('\n');
  }

  function handleCopy() {
    if (!hasMinFields) return;
    navigator.clipboard.writeText(buildMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    track('tool_used', { tool: 'whatsapp-booking-confirmation' });
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'cta_click', { tool_name: 'whatsapp-booking-confirmation' });
    }
  }

  const fh = e => { e.target.style.borderColor = '#C9A24B'; };
  const fb = e => { e.target.style.borderColor = ''; };

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>WhatsApp Booking Confirmation Message Generator — Free Tool | Chakrio</title>
        <meta name="description" content="Generate a professional WhatsApp booking confirmation message for your hotel, homestay, or villa in seconds. Free tool — no sign-up required." />
        <link rel="canonical" href="https://chakrio.com/tools/whatsapp-booking-confirmation" />
        <meta property="og:title" content="WhatsApp Booking Confirmation Message Generator — Free Tool | Chakrio" />
        <meta property="og:description" content="Generate a professional WhatsApp booking confirmation message for your hotel, homestay, or villa in seconds. Free tool — no sign-up required." />
        <meta property="og:url" content="https://chakrio.com/tools/whatsapp-booking-confirmation" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://chakrio.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="WhatsApp Booking Confirmation Message Generator — Free Tool | Chakrio" />
        <meta name="twitter:description" content="Generate a professional WhatsApp booking confirmation message for your hotel or homestay. Free, no sign-up." />
        <meta name="twitter:image" content="https://chakrio.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "WhatsApp Booking Confirmation Message Generator — Free Tool | Chakrio",
          "url": "https://chakrio.com/tools/whatsapp-booking-confirmation",
          "description": "Generate a professional WhatsApp booking confirmation message for your hotel, homestay, or villa in seconds.",
          "datePublished": "2026-07-28",
          "dateModified": "2026-07-28",
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
            { "@type": "ListItem", "position": 3, "name": "WhatsApp Booking Confirmation Generator", "item": "https://chakrio.com/tools/whatsapp-booking-confirmation" }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What should a WhatsApp booking confirmation include?",
              "acceptedAnswer": { "@type": "Answer", "text": "A WhatsApp booking confirmation should include: guest name, check-in and check-out dates, room number (if applicable), total booking amount, advance paid, balance due at checkout, and a UPI payment ID if you accept digital advances. Property name and a warm closing message make it professional." }
            },
            {
              "@type": "Question",
              "name": "Why send a booking confirmation on WhatsApp?",
              "acceptedAnswer": { "@type": "Answer", "text": "WhatsApp confirmations reach guests instantly, have near-100% read rates, and create a written record the guest can refer to at check-in. Email confirmations often go to spam or are missed. For Indian homestays and villas, WhatsApp is the primary communication channel for most guests." }
            },
            {
              "@type": "Question",
              "name": "Should I include a UPI ID in the booking confirmation?",
              "acceptedAnswer": { "@type": "Answer", "text": "Yes — if you require an advance payment, including the UPI ID in the confirmation message reduces the number of follow-up messages and lets the guest pay immediately after reading the confirmation." }
            },
            {
              "@type": "Question",
              "name": "How do I automate WhatsApp booking confirmations?",
              "acceptedAnswer": { "@type": "Answer", "text": "Chakrio automates WhatsApp booking confirmations entirely. When a property manager records a booking via WhatsApp or Telegram, Chakrio instantly sends a formatted confirmation to the guest — including check-in/out dates, amounts, and a UPI payment link for the advance. No manual typing required." }
            },
            {
              "@type": "Question",
              "name": "Can I use this generator for hotels, homestays, and villas?",
              "acceptedAnswer": { "@type": "Answer", "text": "Yes. The generator works for any property type — boutique hotel, homestay, villa, guesthouse, or dharamshala. The message format is professional and clear for any hospitality context." }
            },
            {
              "@type": "Question",
              "name": "What is the balance due in a booking confirmation?",
              "acceptedAnswer": { "@type": "Answer", "text": "Balance due is the remaining amount the guest pays at checkout after their advance is deducted. For example, if the total is ₹8,000 and the guest paid ₹2,000 as an advance, the balance due at checkout is ₹6,000. Stating this clearly in the confirmation prevents disputes at checkout." }
            }
          ]
        })}</script>
      </Helmet>
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <nav className="text-sm text-text-3 mb-8 flex items-center gap-2">
          <Link to="/" className="hover:text-text-2 transition-colors">Home</Link>
          <span>›</span>
          <span className="text-text-2">Free Tools</span>
          <span>›</span>
          <span className="text-text-1">WhatsApp Booking Confirmation Generator</span>
        </nav>

        <div className="mb-10">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 mb-3 tracking-tight">
            WhatsApp Booking Confirmation Generator
          </h1>
          <p className="text-text-2 text-base leading-relaxed max-w-2xl">
            Generate a professional booking confirmation message to send your guests on WhatsApp.
            Fill in the details — the message is ready to copy and paste instantly.
          </p>
          <p className="text-text-3 text-xs mt-3">Page last updated: 28 July 2026</p>
        </div>

        {/* Generator Card */}
        <div className="bg-surface rounded-2xl border border-surface3 p-8 mb-8">
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Property Name <span style={{ color: '#b06060' }}>*</span></label>
              <input type="text" value={propertyName} onChange={e => setPropertyName(e.target.value)} placeholder="e.g. Niva Villa Udaipur"
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Guest Name <span style={{ color: '#b06060' }}>*</span></label>
              <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="e.g. Rahul Sharma"
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Check-in Date <span style={{ color: '#b06060' }}>*</span></label>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Check-out Date <span style={{ color: '#b06060' }}>*</span></label>
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Total Amount (₹) <span style={{ color: '#b06060' }}>*</span></label>
              <input type="number" min="0" value={total} onChange={e => setTotal(e.target.value)} placeholder="e.g. 8000"
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Advance Paid (₹) <span className="text-text-3 font-normal">(optional)</span></label>
              <input type="number" min="0" value={advance} onChange={e => setAdvance(e.target.value)} placeholder="e.g. 2000"
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Room Number <span className="text-text-3 font-normal">(optional)</span></label>
              <input type="text" value={roomNo} onChange={e => setRoomNo(e.target.value)} placeholder="e.g. 3 or Cottage A"
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">UPI ID <span className="text-text-3 font-normal">(optional)</span></label>
              <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. yourname@upi"
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-2 mb-2">Message Preview</label>
            <pre className="bg-surface2 rounded-xl p-5 text-sm text-text-1 whitespace-pre-wrap leading-relaxed border border-surface3 min-h-40"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {hasMinFields
                ? buildMessage()
                : <span className="text-text-3">Fill in the required fields above to generate your message.</span>
              }
            </pre>
          </div>

          <button
            onClick={handleCopy}
            disabled={!hasMinFields}
            style={{
              background: !hasMinFields ? 'rgba(255,255,255,0.06)' : copied ? '#3a7a5a' : 'linear-gradient(135deg, #C9A24B, #b8934a)',
              color: !hasMinFields ? 'rgba(255,255,255,0.25)' : '#0E0B14',
              border: 'none', borderRadius: '12px', padding: '12px 24px',
              fontSize: '14px', fontWeight: 600,
              cursor: hasMinFields ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}>
            {copied ? '✓ Copied to clipboard!' : 'Copy to WhatsApp'}
          </button>
        </div>

        {/* Why WA confirmations matter */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">Why send a WhatsApp booking confirmation?</h2>
          <div className="space-y-3">
            {[
              { title: 'Near-100% open rate', body: "WhatsApp messages are opened within minutes. Email confirmations frequently land in spam or go unread — especially for guests booking personal stays." },
              { title: 'Written record that prevents disputes', body: "The guest has exact dates, amount, and advance details on their phone. “I didn’t know” conversations at check-in become rare when everything is in writing." },
              { title: 'UPI payment in the same message', body: 'Including your UPI ID lets guests pay the advance immediately after reading the confirmation — cutting collection time from days to minutes.' },
              { title: 'Professional first impression', body: 'A structured confirmation builds trust before arrival — particularly important for first-time guests who haven\'t visited your property before.' },
            ].map(({ title, body }) => (
              <div key={title} className="bg-surface2 rounded-lg p-4">
                <p className="font-medium text-text-1 text-sm mb-1">{title}</p>
                <p className="text-text-2 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What to include */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">What every booking confirmation should include</h2>
          <div className="space-y-2">
            {[
              ['Guest name', 'Personalises the message and confirms you have the right guest on file.'],
              ['Check-in and check-out dates', 'The single biggest source of booking disputes — always confirm both in writing.'],
              ['Total amount and advance paid', 'Prevents surprise conversations at checkout about what was agreed.'],
              ['Balance due at checkout', 'Auto-calculated as Total − Advance. Sets clear expectations upfront.'],
              ['Room or cottage number', 'Helps the guest know exactly where to go on arrival.'],
              ['UPI ID (if advance required)', 'Enables immediate digital payment without a follow-up message.'],
            ].map(([term, def]) => (
              <div key={term} className="flex gap-3 bg-surface2 rounded-lg px-4 py-3">
                <span style={{ color: '#C9A24B', flexShrink: 0, marginTop: 2 }}>✓</span>
                <div>
                  <span className="font-medium text-text-1 text-sm">{term}</span>
                  <span className="text-text-2 text-sm"> — {def}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">Tips for better booking confirmations</h2>
          <div className="space-y-3">
            {[
              { step: '01', title: 'Send within 10 minutes of booking', body: 'Guests are most engaged immediately after booking. A quick confirmation locks in the advance payment while intent is high.' },
              { step: '02', title: 'Always state the balance — even if zero', body: '"Balance: ₹0" confirms the guest is fully paid up and eliminates any checkout ambiguity.' },
              { step: '03', title: 'Follow up if advance not received in 24 hours', body: 'A polite "Just checking — did you get a chance to transfer the advance?" recovers most pending payments.' },
              { step: '04', title: 'Save as a WhatsApp Business quick reply', body: 'WhatsApp Business allows saved message templates. Save this format as a quick reply so you can personalise and send in under 30 seconds each time.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-4 bg-surface2 rounded-lg p-4">
                <span className="font-display font-extrabold text-lg flex-shrink-0" style={{ color: 'rgba(201,162,75,0.4)' }}>{step}</span>
                <div>
                  <p className="font-medium text-text-1 text-sm mb-1">{title}</p>
                  <p className="text-text-2 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <CTABox
          headline="Still typing booking confirmations manually?"
          body="Chakrio sends this message automatically the moment a booking is confirmed — over WhatsApp, in seconds, without you typing a single word."
          buttonText="Automate My Confirmations →"
          toolName="whatsapp-booking-confirmation"
        />

        <LeadCaptureBox sourcePage="whatsapp-booking-confirmation" />

        <div className="mt-10">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">More Free Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { to: '/tools/invoice-generator', title: 'Villa & Homestay Invoice Generator', desc: 'Generate a PDF invoice for your guests. No sign-up required.' },
              { to: '/tools/gst-calculator-hotel', title: 'Hotel GST Calculator', desc: "Calculate the correct GST on your room tariff under India's 2025 rules." },
              { to: '/tools/occupancy-calculator', title: 'Hotel Occupancy Rate Calculator', desc: "Calculate your property's occupancy % for any period." },
              { to: '/tools/rental-income-calculator', title: 'Rental Income Calculator', desc: 'Estimate gross and net revenue from your rooms across any period.' },
              { to: '/tools/cancellation-policy', title: 'Cancellation Policy Generator', desc: 'Generate a professional cancellation policy for your property in seconds.' },
            ].map(({ to, title, desc }) => (
              <Link key={to} to={to}
                className="bg-surface rounded-xl border border-surface3 p-5 transition-colors"
                style={{ textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,162,75,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                <p className="font-medium text-text-1 mb-1">{title}</p>
                <p className="text-text-2 text-sm">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <div className="max-w-2xl mx-auto px-6 pb-8">
        <ToolConversionHook
          heading="Still typing booking confirmations manually?"
          body="Chakrio sends them for you — over WhatsApp, the moment a booking is confirmed. No typing, no copy-paste."
        />
      </div>

      <Footer />
    </div>
  );
}

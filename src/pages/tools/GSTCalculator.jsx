import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import CTABox from '../../components/tools/CTABox';
import ToolConversionHook from '../../components/tools/ToolConversionHook';
import LeadCaptureBox from '../../components/shared/LeadCaptureBox';

const inputCls = 'w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none transition-colors';
const INR = n => '₹' + Math.round(n).toLocaleString('en-IN');

export default function GSTCalculator() {
  const [tariff, setTariff] = useState('');
  const [nights, setNights] = useState('1');
  const [rooms, setRooms] = useState('1');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    const t = parseFloat(tariff);
    const n = parseInt(nights);
    const r = parseInt(rooms);
    if (!t || t <= 0) return setError('Enter a valid room tariff per night.');
    if (!n || n <= 0) return setError('Enter a valid number of nights.');
    if (!r || r <= 0) return setError('Enter a valid number of rooms.');
    setError('');
    let gstRate, itcEligible;
    if (t <= 1000)       { gstRate = 0;    itcEligible = false; }
    else if (t <= 7500)  { gstRate = 0.05; itcEligible = false; }
    else                 { gstRate = 0.18; itcEligible = true;  }
    const roomTotal  = t * n * r;
    const gstAmount  = roomTotal * gstRate;
    const grandTotal = roomTotal + gstAmount;
    setResult({ roomTotal, gstRate: gstRate * 100, gstAmount, grandTotal, itcEligible, tariff: t, nights: n, rooms: r });
  }

  function reset() {
    setTariff(''); setNights('1'); setRooms('1'); setResult(null); setError('');
  }

  const fh = e => { e.target.style.borderColor = '#C9A24B'; };
  const fb = e => { e.target.style.borderColor = ''; };

  const slab = result
    ? result.tariff <= 1000 ? 'Exempt (₹0 – ₹1,000 slab)' : result.tariff <= 7500 ? '₹1,001 – ₹7,500 slab · No ITC' : 'Above ₹7,500 · ITC Eligible'
    : '';
  const slabColor = result
    ? result.gstRate === 0 ? '#5cb88a' : result.gstRate === 5 ? '#C9A24B' : '#e88a8a'
    : '';
  const slabBg = result
    ? result.gstRate === 0 ? 'rgba(92,184,138,0.12)' : result.gstRate === 5 ? 'rgba(201,162,75,0.12)' : 'rgba(176,96,96,0.1)'
    : '';
  const slabBorder = result
    ? result.gstRate === 0 ? 'rgba(92,184,138,0.25)' : result.gstRate === 5 ? 'rgba(201,162,75,0.25)' : 'rgba(176,96,96,0.2)'
    : '';

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>Hotel GST Calculator India 2025 — Room Tariff Tax | Chakrio</title>
        <meta name="description" content="Calculate GST on hotel room tariff under India's updated 2025 rules. 0% under ₹1,000 · 5% up to ₹7,500 · 18% above ₹7,500. Free tool, no sign-up required." />
        <link rel="canonical" href="https://chakrio.com/tools/gst-calculator-hotel" />
        <meta property="og:title" content="Hotel GST Calculator India 2025 — Room Tariff Tax | Chakrio" />
        <meta property="og:description" content="Calculate GST on hotel room tariff under India's updated 2025 rules. 0% / 5% / 18% — free tool, no sign-up required." />
        <meta property="og:url" content="https://chakrio.com/tools/gst-calculator-hotel" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://chakrio.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hotel GST Calculator India 2025 — Room Tariff Tax | Chakrio" />
        <meta name="twitter:description" content="Calculate GST on hotel room tariff under India's 2025 rules. 0% / 5% / 18% — free, no sign-up." />
        <meta name="twitter:image" content="https://chakrio.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Hotel GST Calculator India 2025 — Room Tariff Tax | Chakrio",
          "url": "https://chakrio.com/tools/gst-calculator-hotel",
          "description": "Calculate GST on hotel room tariff under India's updated September 2025 rules. 0% under ₹1,000 · 5% up to ₹7,500 · 18% above.",
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
            { "@type": "ListItem", "position": 3, "name": "Hotel GST Calculator", "item": "https://chakrio.com/tools/gst-calculator-hotel" }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is the GST rate on hotel rooms in India in 2025?",
              "acceptedAnswer": { "@type": "Answer", "text": "After the GST Council revision effective 22 September 2025, hotel room GST follows three slabs: (1) Rooms with tariff up to ₹1,000 per night — 0% GST, exempt. (2) Rooms with tariff ₹1,001 to ₹7,500 per night — 5% GST, no ITC. (3) Rooms with tariff above ₹7,500 per night — 18% GST, ITC eligible. The old 12% slab was abolished in this revision." }
            },
            {
              "@type": "Question",
              "name": "What happened to the old 12% GST slab for hotels?",
              "acceptedAnswer": { "@type": "Answer", "text": "The 12% GST slab (previously for hotel rooms at ₹1,000–₹7,500/night) was completely abolished by the GST Council revision of 22 September 2025. The current structure is 0% / 5% / 18% only. Many older articles and calculators still show the 12% slab — it no longer applies." }
            },
            {
              "@type": "Question",
              "name": "Do dharamshalas and budget guesthouses charge GST?",
              "acceptedAnswer": { "@type": "Answer", "text": "If your room tariff is ₹1,000 per night or less, GST is 0% — you are exempt and do not need to charge GST on accommodation. This covers most dharamshalas, budget guesthouses, and pilgrim-route hostels. You only need to register for GST if your annual turnover exceeds ₹20 lakh (₹10 lakh for special category states)." }
            },
            {
              "@type": "Question",
              "name": "What is ITC (Input Tax Credit) for hotels?",
              "acceptedAnswer": { "@type": "Answer", "text": "Input Tax Credit lets GST-registered hotels claim credit for GST paid on business expenses like renovation, furniture, linen, and services. Hotels charging 18% GST (tariff above ₹7,500/night) are ITC eligible. Hotels in the 5% slab (₹1,001–₹7,500) are not — this is a deliberate trade-off where the lower rate comes without ITC." }
            },
            {
              "@type": "Question",
              "name": "Do villas and homestays need to charge GST?",
              "acceptedAnswer": { "@type": "Answer", "text": "GST registration is mandatory if your annual turnover exceeds ₹20 lakh (₹10 lakh in special category states like Uttarakhand, Himachal Pradesh, and the North-East). Below this threshold, registration is optional. Above it, you must register and charge GST at the applicable slab based on your room tariff." }
            },
            {
              "@type": "Question",
              "name": "What is the GST rate on homestay bookings through OTAs like Airbnb?",
              "acceptedAnswer": { "@type": "Answer", "text": "For OTA bookings (Airbnb, Booking.com, MakeMyTrip), the OTA collects and remits GST on your behalf under the Tax Collected at Source (TCS) mechanism. The GST slab still applies based on the room tariff. Your own registration obligation depends on whether your total annual turnover from all channels exceeds ₹20 lakh." }
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
          <span className="text-text-1">Hotel GST Calculator</span>
        </nav>

        <div className="mb-10">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 mb-3 tracking-tight">
            Hotel GST Calculator — India 2025
          </h1>
          <p className="text-text-2 text-base leading-relaxed max-w-2xl">
            Calculate the correct GST on your hotel, villa, or homestay room tariff under India's updated rules
            effective 22 September 2025. Enter your nightly rate to see the applicable slab, GST amount, and grand total instantly.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(201,162,75,0.12)', color: '#C9A24B', border: '1px solid rgba(201,162,75,0.25)' }}>
            Updated for September 2025 GST revision — 12% slab abolished
          </div>
        </div>

        {/* Calculator Card */}
        <div className="bg-surface rounded-2xl border border-surface3 p-8 mb-8">
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Room Tariff / Night (₹)</label>
              <input type="number" min="0" value={tariff} onChange={e => setTariff(e.target.value)} placeholder="e.g. 3500"
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Number of Nights</label>
              <input type="number" min="1" step="1" value={nights} onChange={e => setNights(e.target.value)} placeholder="e.g. 2"
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Number of Rooms</label>
              <input type="number" min="1" step="1" value={rooms} onChange={e => setRooms(e.target.value)} placeholder="e.g. 1"
                className={inputCls} onFocus={fh} onBlur={fb} />
            </div>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm"
              style={{ color: '#b06060', background: 'rgba(176,96,96,0.1)', border: '1px solid rgba(176,96,96,0.2)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={calculate}
              style={{ background: 'linear-gradient(135deg, #C9A24B, #b8934a)', color: '#0E0B14', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Calculate GST
            </button>
            {result && (
              <button onClick={reset} className="px-6 py-3 rounded-xl font-medium text-sm text-text-2 bg-surface2 hover:bg-surface3 transition-colors">
                Reset
              </button>
            )}
          </div>

          {result && (
            <div className="mt-8 pt-8 border-t border-surface3">
              <div className="mb-5">
                <span className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: slabBg, color: slabColor, border: `1px solid ${slabBorder}` }}>
                  {result.gstRate}% GST — {slab}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-surface2 rounded-xl p-5 text-center">
                  <p className="text-text-3 text-xs uppercase tracking-widest mb-1">Room Total</p>
                  <p className="font-display font-extrabold text-3xl" style={{ color: '#e8c98a' }}>{INR(result.roomTotal)}</p>
                  <p className="text-text-3 text-xs mt-1">{INR(result.tariff)} × {result.nights}n × {result.rooms}rm</p>
                </div>
                <div className="bg-surface2 rounded-xl p-5 text-center">
                  <p className="text-text-3 text-xs uppercase tracking-widest mb-1">GST Amount</p>
                  <p className="font-display font-extrabold text-3xl" style={{ color: '#C9A24B' }}>{INR(result.gstAmount)}</p>
                  <p className="text-text-3 text-xs mt-1">at {result.gstRate}%</p>
                </div>
              </div>
              <div className="bg-surface2 rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-text-3 text-xs uppercase tracking-widest mb-1">Grand Total (incl. GST)</p>
                  <p className="font-display font-extrabold text-3xl" style={{ color: '#C9A24B' }}>{INR(result.grandTotal)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-text-3 text-xs uppercase tracking-widest mb-1">ITC Eligibility</p>
                  <p className="font-semibold text-sm" style={{ color: result.itcEligible ? '#5cb88a' : '#b06060' }}>
                    {result.itcEligible ? '✓ Eligible' : '✗ Not eligible'}
                  </p>
                  <p className="text-text-3 text-xs mt-0.5">
                    {result.itcEligible ? 'Keep your input tax invoices' : '5% slab — ITC not available'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slab table */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-1">India Hotel GST Slabs — Updated September 2025</h2>
          <p className="text-text-3 text-xs mb-4">GST Council revision effective 22 September 2025. The 12% slab has been abolished.</p>
          <div className="space-y-2">
            {[
              { range: 'Up to ₹1,000 / night', rate: '0% (Exempt)', itc: 'N/A', color: '#5cb88a', bg: 'rgba(92,184,138,0.08)' },
              { range: '₹1,001 – ₹7,500 / night', rate: '5%', itc: 'Not eligible', color: '#C9A24B', bg: 'rgba(201,162,75,0.08)' },
              { range: 'Above ₹7,500 / night', rate: '18%', itc: 'Eligible', color: '#e88a8a', bg: 'rgba(176,96,96,0.08)' },
            ].map(({ range, rate, itc, color, bg }) => (
              <div key={range} className="grid grid-cols-3 gap-4 rounded-lg px-4 py-3 items-center" style={{ background: bg }}>
                <span className="text-text-2 text-sm">{range}</span>
                <span className="font-display font-extrabold text-sm text-center" style={{ color }}>{rate}</span>
                <span className="text-text-3 text-xs text-right">ITC: {itc}</span>
              </div>
            ))}
          </div>
          <p className="text-text-3 text-xs mt-4 leading-relaxed">
            Tariff = the room rate charged to the guest, excluding GST. Where a hotel has multiple room categories at different rates, each category's tariff determines its own GST slab independently.
          </p>
        </div>

        {/* ITC explanation */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">What is Input Tax Credit (ITC) and why does it matter?</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            <strong className="text-text-1">Input Tax Credit (ITC)</strong> lets you subtract the GST you paid on business purchases from the GST you collect from guests.
            For example, if you paid ₹36,000 GST on a renovation and collected ₹50,000 GST from guests that quarter, you remit only ₹14,000 to the government.
          </p>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            Hotels charging <strong className="text-text-1">18% GST (tariff above ₹7,500/night)</strong> can claim ITC on inputs like furniture, services, linen, and renovation.
            Hotels in the <strong className="text-text-1">5% slab (₹1,001–₹7,500)</strong> cannot — this is a deliberate trade-off where the lower rate comes without ITC.
          </p>
          <div className="bg-surface2 rounded-lg p-4">
            <p className="font-medium text-text-1 text-sm mb-1">Practical tip for tariffs near ₹7,500</p>
            <p className="text-text-2 text-sm leading-relaxed">
              If your tariff is near ₹7,500 and you spend heavily on inputs (renovation, furniture, linen), it may be worth pricing above ₹7,500 to access ITC — even though the headline GST rate is higher.
              Run both scenarios before deciding on your rack rate.
            </p>
          </div>
        </div>

        {/* Who needs to register */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">Who needs to register for GST?</h2>
          <div className="space-y-3">
            {[
              { title: 'Annual turnover above ₹20 lakh', body: 'GST registration is mandatory for any hospitality business — hotel, villa, homestay, or guesthouse — with annual turnover exceeding ₹20 lakh. For special category states (Uttarakhand, Himachal Pradesh, all North-East states), the threshold is ₹10 lakh.' },
              { title: 'OTA platform listings', body: "If you list on Airbnb, Booking.com, MakeMyTrip, or Goibibo, the OTA collects TCS on your behalf. This doesn't change your registration obligation — if you cross the threshold, you must still register independently." },
              { title: 'Voluntary registration below threshold', body: 'Even below ₹20 lakh, you can register voluntarily. This makes sense if you want to claim ITC on large purchases (renovation, equipment) and your tariff qualifies for the 18% slab.' },
              { title: 'Dharamshalas and religious trusts', body: 'Dharamshalas operated as religious or charitable trusts may qualify for GST exemptions beyond the standard tariff-based slabs. Consult a CA for your specific situation.' },
            ].map(({ title, body }) => (
              <div key={title} className="bg-surface2 rounded-lg p-4">
                <p className="font-medium text-text-1 text-sm mb-1">{title}</p>
                <p className="text-text-2 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <CTABox
          headline="Need a GST-ready invoice for this booking?"
          body="Use our free Invoice Generator — add room charges, pick the GST rate, and download a professional PDF invoice in seconds. No sign-up required."
          buttonText="Generate Invoice Free →"
          buttonHref="/tools/invoice-generator"
          toolName="gst-calculator-hotel"
        />

        <LeadCaptureBox sourcePage="gst-calculator-hotel" />

        <div className="mt-10">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">More Free Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { to: '/tools/invoice-generator', title: 'Villa & Homestay Invoice Generator', desc: 'Generate a PDF invoice with GST for your guests. No sign-up required.' },
              { to: '/tools/whatsapp-booking-confirmation', title: 'WhatsApp Booking Confirmation Generator', desc: 'Generate a professional booking confirmation message for WhatsApp.' },
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
          heading="Manage all your bookings from WhatsApp"
          body="Chakrio records every booking, payment, and expense automatically — so your numbers are always up to date without a spreadsheet."
        />
      </div>

      <Footer />
    </div>
  );
}

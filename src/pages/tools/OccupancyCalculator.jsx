import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import CTABox from '../../components/tools/CTABox';

const inputCls = 'w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none transition-colors';

export default function OccupancyCalculator() {
  const [rooms, setRooms] = useState('');
  const [days, setDays] = useState('30');
  const [bookedNights, setBookedNights] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    const r = parseFloat(rooms);
    const d = parseFloat(days);
    const b = parseFloat(bookedNights);
    if (!r || r <= 0) return setError('Enter a valid number of rooms (greater than 0).');
    if (!d || d <= 0) return setError('Enter a valid number of days (greater than 0).');
    if (isNaN(b) || b < 0) return setError('Enter a valid number of booked room-nights (0 or more).');
    if (b > r * d) return setError(`Booked room-nights (${b}) cannot exceed total capacity (${r * d} = ${r} rooms × ${d} days).`);
    setError('');
    const occupancy = (b / (r * d)) * 100;
    setResult({ occupancy: occupancy.toFixed(1), avgRooms: (b / d).toFixed(1) });
  }

  function reset() {
    setRooms(''); setDays('30'); setBookedNights(''); setResult(null); setError('');
  }

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>Hotel Occupancy Rate Calculator — Free Tool | Chakrio</title>
        <meta name="description" content="Free hotel occupancy rate calculator. Enter your rooms, period, and booked nights — get your occupancy % instantly. No sign-up required." />
        <link rel="canonical" href="https://chakrio.com/tools/occupancy-calculator" />
        <meta property="og:title" content="Hotel Occupancy Rate Calculator — Free Tool | Chakrio" />
        <meta property="og:description" content="Free hotel occupancy rate calculator. Enter your rooms, period, and booked nights — get your occupancy % instantly." />
        <meta property="og:url" content="https://chakrio.com/tools/occupancy-calculator" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://chakrio.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hotel Occupancy Rate Calculator — Free Tool | Chakrio" />
        <meta name="twitter:description" content="Free hotel occupancy rate calculator. Get your occupancy % instantly. No sign-up required." />
        <meta name="twitter:image" content="https://chakrio.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Hotel Occupancy Rate Calculator — Free Tool | Chakrio",
          "url": "https://chakrio.com/tools/occupancy-calculator",
          "description": "Free hotel occupancy rate calculator. Enter your rooms, period, and booked nights — get your occupancy % instantly. No sign-up required.",
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
            { "@type": "ListItem", "position": 3, "name": "Hotel Occupancy Rate Calculator", "item": "https://chakrio.com/tools/occupancy-calculator" }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is hotel occupancy rate?",
              "acceptedAnswer": { "@type": "Answer", "text": "Hotel occupancy rate is the percentage of available rooms that are occupied over a given period. It is calculated as: (Booked Room-Nights ÷ (Total Rooms × Days in Period)) × 100. A room-night means one room occupied for one night." }
            },
            {
              "@type": "Question",
              "name": "What is a good hotel occupancy rate?",
              "acceptedAnswer": { "@type": "Answer", "text": "A good hotel occupancy rate is generally considered to be 65–80%. An occupancy rate above 80% is excellent and indicates strong demand. Rates below 50% suggest the property may be underperforming. Seasonal properties (hill stations, beach resorts) naturally see lower off-season occupancy." }
            },
            {
              "@type": "Question",
              "name": "How do you calculate hotel occupancy rate?",
              "acceptedAnswer": { "@type": "Answer", "text": "Hotel occupancy rate = (Booked Room-Nights ÷ Total Available Room-Nights) × 100. Total available room-nights = Number of rooms × Number of days in the period. For example, 10 rooms over 30 days = 300 available room-nights. If 210 were booked, occupancy = (210 ÷ 300) × 100 = 70%." }
            },
            {
              "@type": "Question",
              "name": "What is the average hotel occupancy rate in India?",
              "acceptedAnswer": { "@type": "Answer", "text": "The average hotel occupancy rate in India ranges from 55–70% annually for budget and mid-scale properties. Premium hill stations and coastal destinations (Manali, Goa, Coorg, Munnar) see peak-season occupancy above 90%, while off-season rates can fall to 25–35%. Indian homestays and villas typically target 60–75% annually as a healthy benchmark." }
            },
            {
              "@type": "Question",
              "name": "What is RevPAR and how is it different from occupancy rate?",
              "acceptedAnswer": { "@type": "Answer", "text": "RevPAR (Revenue Per Available Room) = Occupancy Rate × Average Daily Rate. While occupancy rate tells you how full your property is, RevPAR tells you how much revenue each available room is generating. For example, a hotel with 80% occupancy at ₹2,000/night has a RevPAR of ₹1,600. RevPAR is a more complete measure of performance than occupancy alone." }
            },
            {
              "@type": "Question",
              "name": "How can I improve my hotel occupancy rate?",
              "acceptedAnswer": { "@type": "Answer", "text": "To improve hotel occupancy rate: (1) List on multiple OTAs (Booking.com, MakeMyTrip, Airbnb) to increase visibility. (2) Use dynamic pricing — lower rates on weekdays and off-season, raise them for weekends and holidays. (3) Offer early-bird discounts for bookings made 30+ days in advance. (4) Respond to reviews promptly — properties with 4.5+ ratings consistently outperform on occupancy. (5) Add value packages (breakfast included, airport transfer) to justify your rate." }
            },
            {
              "@type": "Question",
              "name": "How does occupancy rate affect hotel revenue?",
              "acceptedAnswer": { "@type": "Answer", "text": "Occupancy rate directly multiplies your revenue. A 10-point increase in occupancy on a 10-room property at ₹3,000/night generates ₹9,000 in extra revenue per day — ₹2,70,000 per month. However, a high occupancy at a low rate can generate less revenue than a moderate occupancy at a premium rate. Use RevPAR (Occupancy × ADR) to measure overall revenue health." }
            },
            {
              "@type": "Question",
              "name": "Should I block out dates or keep rooms available at a discount during low season?",
              "acceptedAnswer": { "@type": "Answer", "text": "Generally, keeping rooms available at a discounted rate is better than blocking dates, as it maintains your booking history and OTA ranking algorithm score. A lower rate still covers variable costs (cleaning, utilities) and keeps the property active on OTA platforms. Block only for maintenance, renovation, or owner use — not to avoid low-season bookings." }
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
          <span className="text-text-1">Occupancy Rate Calculator</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 mb-3 tracking-tight">
            Hotel Occupancy Rate Calculator
          </h1>
          <p className="text-text-2 text-base leading-relaxed max-w-2xl">
            Calculate your property's occupancy rate instantly. Enter your total rooms, the period length,
            and how many room-nights were booked — get your occupancy % in seconds.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-surface rounded-2xl border border-surface3 p-8 mb-8">
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Total Rooms</label>
              <input type="number" min="1" value={rooms} onChange={e => setRooms(e.target.value)} placeholder="e.g. 10"
                className={inputCls} style={{ '--tw-ring-color': '#c8a96e' }}
                onFocus={e => e.target.style.borderColor = '#c8a96e'} onBlur={e => e.target.style.borderColor = ''} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Period (days)</label>
              <input type="number" min="1" value={days} onChange={e => setDays(e.target.value)} placeholder="e.g. 30"
                className={inputCls}
                onFocus={e => e.target.style.borderColor = '#c8a96e'} onBlur={e => e.target.style.borderColor = ''} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Booked Room-Nights</label>
              <input type="number" min="0" value={bookedNights} onChange={e => setBookedNights(e.target.value)} placeholder="e.g. 210"
                className={inputCls}
                onFocus={e => e.target.style.borderColor = '#c8a96e'} onBlur={e => e.target.style.borderColor = ''} />
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-ch-red bg-ch-red/10 border border-ch-red/20">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={calculate}
              style={{ background: 'linear-gradient(135deg, #c8a96e, #b8934a)', color: '#0f0e17', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Calculate
            </button>
            {result && (
              <button onClick={reset} className="px-6 py-3 rounded-xl font-medium text-sm text-text-2 bg-surface2 hover:bg-surface3 transition-colors">
                Reset
              </button>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="mt-8 pt-8 border-t border-surface3 grid sm:grid-cols-2 gap-6">
              <div className="bg-surface2 rounded-xl p-6 text-center">
                <p className="text-text-3 text-xs uppercase tracking-widest mb-1">Occupancy Rate</p>
                <p className="font-display font-extrabold text-4xl" style={{ color: '#c8a96e' }}>{result.occupancy}%</p>
              </div>
              <div className="bg-surface2 rounded-xl p-6 text-center">
                <p className="text-text-3 text-xs uppercase tracking-widest mb-1">Avg Rooms Occupied / Night</p>
                <p className="font-display font-extrabold text-4xl" style={{ color: '#e8c98a' }}>{result.avgRooms}</p>
              </div>
            </div>
          )}
        </div>

        {/* How it's calculated */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">How it's calculated</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            <strong className="text-text-1">Occupancy Rate</strong> = (Booked Room-Nights ÷ (Total Rooms × Days in Period)) × 100
          </p>
          <p className="text-text-2 text-sm leading-relaxed">
            A "room-night" is one room occupied for one night. If you have 10 rooms and all are booked for 30 days,
            that's 300 room-nights = 100% occupancy.
          </p>
        </div>

        {/* What is a good occupancy rate */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">What is a good hotel occupancy rate?</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            A good occupancy rate for a hotel, homestay, or villa is generally <strong className="text-text-1">65–80%</strong>. Rates above 80% are considered excellent and indicate strong, consistent demand. Rates below 50% may suggest pricing, marketing, or availability issues.
          </p>
          <p className="text-text-2 text-sm leading-relaxed">
            Seasonal properties (hill stations, beach resorts, pilgrim-route homestays) naturally see low off-season occupancy — compare your rate against the same period last year rather than an annual average for a more accurate picture.
          </p>
        </div>

        {/* India occupancy benchmarks */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">Hotel occupancy benchmarks in India</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-4">
            Occupancy benchmarks vary significantly by property type and location across India:
          </p>
          <div className="space-y-3">
            {[
              { label: 'Hill station homestay (peak season: Oct–Mar)', range: '80–95%' },
              { label: 'Coastal villa/resort (peak season: Nov–Feb)', range: '75–90%' },
              { label: 'City guesthouse (year-round)', range: '55–70%' },
              { label: 'Heritage / boutique property', range: '60–80%' },
              { label: 'Off-season (any leisure destination)', range: '20–40%' },
            ].map(({ label, range }) => (
              <div key={label} className="flex items-center justify-between bg-surface2 rounded-lg px-4 py-3">
                <span className="text-text-2 text-sm">{label}</span>
                <span className="font-display font-extrabold text-sm" style={{ color: '#c8a96e' }}>{range}</span>
              </div>
            ))}
          </div>
          <p className="text-text-3 text-xs mt-3 leading-relaxed">
            Compare against the same period last year, not an annual average, for a meaningful picture of your property's performance.
          </p>
        </div>

        {/* RevPAR explanation */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">Occupancy rate vs RevPAR — which matters more?</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            Occupancy tells you how full your property is. <strong className="text-text-1">RevPAR (Revenue Per Available Room)</strong> tells you how much money each room is generating — occupied or not. The formula:
          </p>
          <p className="text-text-2 text-sm leading-relaxed mb-3 font-mono bg-surface2 rounded-lg px-4 py-3">
            RevPAR = Occupancy Rate × Average Daily Rate (ADR)
          </p>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            Example: A 10-room homestay with 70% occupancy at ₹3,000/night has a RevPAR of ₹2,100 per room per night, or ₹21,000 total per night across all rooms.
          </p>
          <p className="text-text-2 text-sm leading-relaxed">
            <strong className="text-text-1">Key insight:</strong> A property with 60% occupancy at ₹5,000/night (RevPAR ₹3,000) outperforms one with 80% occupancy at ₹3,000/night (RevPAR ₹2,400). Don't chase high occupancy at the cost of your rate.
          </p>
        </div>

        {/* How to improve occupancy */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">How to improve your hotel occupancy rate</h2>
          <div className="space-y-3">
            {[
              { step: '01', title: 'List on multiple OTAs', body: 'Properties listed on 3+ platforms (Booking.com, MakeMyTrip, Airbnb) see 30–40% higher occupancy than single-channel listings.' },
              { step: '02', title: 'Use dynamic pricing', body: 'Raise rates for peak weekends and holidays, lower them mid-week and off-season. Even ₹200–300 adjustments improve fill rate meaningfully.' },
              { step: '03', title: 'Offer early-bird discounts', body: 'A 10–15% discount for bookings 30+ days in advance fills your calendar early and locks in revenue.' },
              { step: '04', title: 'Respond to reviews', body: 'Properties with a 4.5+ star rating and active review responses consistently rank higher in OTA search results.' },
              { step: '05', title: 'Add value packages', body: 'Breakfast-included or airport-transfer bundles justify a higher rate and attract guests who compare value, not just price.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-4 bg-surface2 rounded-lg p-4">
                <span className="font-display font-extrabold text-lg flex-shrink-0" style={{ color: 'rgba(200,169,110,0.4)' }}>{step}</span>
                <div>
                  <p className="font-medium text-text-1 text-sm mb-1">{title}</p>
                  <p className="text-text-2 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <CTABox
          headline="Still tracking bookings in a spreadsheet?"
          body="Chakrio's AI chatbot auto-records every booking, cancellation, and expense straight to your dashboard — so your occupancy data is always up to date."
          buttonText="Track Bookings Automatically →"
        />

        {/* Related tools */}
        <div className="mt-10">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">More Free Tools</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link to="/tools/rental-income-calculator"
              className="bg-surface rounded-xl border border-surface3 p-5 transition-colors group"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
              <p className="font-medium text-text-1 mb-1 transition-colors">Rental Income Calculator</p>
              <p className="text-text-2 text-sm">Estimate gross and net income from your property.</p>
            </Link>
            <Link to="/tools/cancellation-policy"
              className="bg-surface rounded-xl border border-surface3 p-5 transition-colors group"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
              <p className="font-medium text-text-1 mb-1">Cancellation Policy Generator</p>
              <p className="text-text-2 text-sm">Generate a professional cancellation policy for your property.</p>
            </Link>
            <Link to="/tools/invoice-generator"
              className="bg-surface rounded-xl border border-surface3 p-5 transition-colors group"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
              <p className="font-medium text-text-1 mb-1">Villa & Homestay Invoice Generator</p>
              <p className="text-text-2 text-sm">Generate a professional PDF invoice for your guests. No sign-up required.</p>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

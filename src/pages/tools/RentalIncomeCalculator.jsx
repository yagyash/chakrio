import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import CTABox from '../../components/tools/CTABox';

function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

const inputCls = 'w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none transition-colors';

export default function RentalIncomeCalculator() {
  const [rooms, setRooms] = useState('');
  const [rate, setRate] = useState('');
  const [occupancy, setOccupancy] = useState('70');
  const [days, setDays] = useState('30');
  const [expensePct, setExpensePct] = useState('30');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    const r = parseFloat(rooms);
    const rt = parseFloat(rate);
    const occ = parseFloat(occupancy);
    const d = parseFloat(days);
    if (!r || r <= 0) return setError('Enter a valid number of rooms (greater than 0).');
    if (!rt || rt <= 0) return setError('Enter a valid nightly rate (greater than 0).');
    if (isNaN(occ) || occ < 0 || occ > 100) return setError('Occupancy rate must be between 0 and 100.');
    if (!d || d <= 0) return setError('Enter a valid number of days (greater than 0).');
    setError('');
    const gross = r * rt * (occ / 100) * d;
    const expenses = gross * (parseFloat(expensePct) / 100);
    setResult({ gross, expenses, net: gross - expenses });
  }

  function reset() {
    setRooms(''); setRate(''); setOccupancy('70');
    setDays('30'); setExpensePct('30'); setResult(null); setError('');
  }

  const focusGold = {
    onFocus: e => e.target.style.borderColor = '#c8a96e',
    onBlur: e => e.target.style.borderColor = '',
  };

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>Rental Income Calculator for Property — Free Tool | Chakrio</title>
        <meta name="description" content="Estimate gross and net rental income from your property. Enter rooms, nightly rate, and occupancy % — see your monthly or annual income instantly. Free tool." />
        <link rel="canonical" href="https://chakrio.com/tools/rental-income-calculator" />
        <meta property="og:title" content="Rental Income Calculator for Property — Free Tool | Chakrio" />
        <meta property="og:description" content="Estimate gross and net rental income from your property. Enter rooms, nightly rate, and occupancy % — see your income instantly." />
        <meta property="og:url" content="https://chakrio.com/tools/rental-income-calculator" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://chakrio.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rental Income Calculator for Property — Free Tool | Chakrio" />
        <meta name="twitter:description" content="Estimate gross and net rental income from your property instantly. Free, no sign-up required." />
        <meta name="twitter:image" content="https://chakrio.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Rental Income Calculator for Property — Free Tool | Chakrio",
          "url": "https://chakrio.com/tools/rental-income-calculator",
          "description": "Estimate gross and net rental income from your property. Enter rooms, nightly rate, and occupancy % — see your monthly or annual income instantly. Free tool.",
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
            { "@type": "ListItem", "position": 3, "name": "Rental Income Calculator", "item": "https://chakrio.com/tools/rental-income-calculator" }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How do you calculate rental income from a property?",
              "acceptedAnswer": { "@type": "Answer", "text": "Gross rental income = Number of Rooms × Nightly Rate × Occupancy Rate × Number of Days. Net rental income = Gross Income − Operating Expenses. Operating expenses typically include staff wages, utilities, maintenance, cleaning, and platform fees — usually 25–40% of gross income for a managed property." }
            },
            {
              "@type": "Question",
              "name": "What expenses should I deduct from rental income?",
              "acceptedAnswer": { "@type": "Answer", "text": "Common rental property expenses include: staff wages, electricity and water, maintenance and repairs, cleaning supplies, property tax, insurance, platform/OTA fees (if listed on Booking.com or Airbnb), and internet. For a typical Indian homestay or villa, operating expenses run 25–35% of gross revenue." }
            },
            {
              "@type": "Question",
              "name": "What is a good net rental yield for a property?",
              "acceptedAnswer": { "@type": "Answer", "text": "A good net rental yield for a holiday homestay or villa in India is typically 6–12% annually on the property value. Short-term rental properties (holiday lets) generally yield more than long-term rentals. Properties in high-tourism areas — hill stations, coastal destinations, heritage towns — often achieve yields at the higher end of this range." }
            },
            {
              "@type": "Question",
              "name": "Is rental income from a homestay taxable in India?",
              "acceptedAnswer": { "@type": "Answer", "text": "Yes, rental income from a homestay or short-term rental property in India is taxable under 'Income from House Property' or 'Income from Business' depending on the level of services provided. If the property provides hotel-like services (meals, housekeeping), it is typically taxed as business income. You can deduct 30% of net annual value as a standard deduction, plus actual interest on home loans. Consult a CA for your specific situation." }
            },
            {
              "@type": "Question",
              "name": "How do OTA platform fees affect rental income?",
              "acceptedAnswer": { "@type": "Answer", "text": "OTA platform fees typically reduce your gross rental income by 15–25%. Booking.com charges 15–18% commission, Airbnb charges hosts 3% plus guests 12–15%, and MakeMyTrip charges 15–20%. To calculate net income after OTA fees, reduce your gross income by the commission percentage before deducting operating expenses. Properties with high direct booking rates (repeat guests, own website) retain significantly more net income." }
            },
            {
              "@type": "Question",
              "name": "What is the difference between gross rental yield and net rental yield?",
              "acceptedAnswer": { "@type": "Answer", "text": "Gross rental yield = (Annual Gross Rental Income ÷ Property Value) × 100. Net rental yield = (Annual Net Rental Income after expenses ÷ Property Value) × 100. For example, a property worth ₹1 crore generating ₹10 lakh gross annual revenue has a gross yield of 10%. After 30% operating expenses (₹3 lakh), net income is ₹7 lakh — a net yield of 7%. Net yield is the more meaningful measure of actual investment return." }
            },
            {
              "@type": "Question",
              "name": "How can I increase net rental income from my property?",
              "acceptedAnswer": { "@type": "Answer", "text": "To increase net rental income: (1) Increase occupancy through OTA listings and dynamic pricing. (2) Raise your ADR (Average Daily Rate) by improving reviews, photography, and amenities. (3) Reduce OTA dependency by building direct bookings — WhatsApp-based booking systems reduce commission costs. (4) Manage expenses: energy efficiency, staff optimisation, and preventive maintenance reduce operating costs. (5) Add revenue streams: airport transfers, meal packages, and local experiences add 10–20% to base room revenue." }
            },
            {
              "@type": "Question",
              "name": "What operating expenses should I budget for a homestay in India?",
              "acceptedAnswer": { "@type": "Answer", "text": "Typical operating expense breakdown for an Indian homestay (as % of gross revenue): Staff wages 10–15%, Electricity and water 5–8%, Cleaning and laundry 4–6%, Maintenance and repairs 3–5%, Platform/OTA commissions 15–20% (if OTA-heavy), Property tax and insurance 2–3%, Internet and cable 1–2%, Consumables (toiletries, cleaning supplies) 2–3%. Total operating expenses typically range 25–40% of gross revenue depending on staffing and OTA mix." }
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
          <span className="text-text-1">Rental Income Calculator</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 mb-3 tracking-tight">
            Rental Income Calculator for Property
          </h1>
          <p className="text-text-2 text-base leading-relaxed max-w-2xl">
            Estimate your gross and net rental income. Enter your room count, nightly rate, occupancy,
            and period — and optionally deduct operating expenses to see net profit.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-surface rounded-2xl border border-surface3 p-8 mb-8">
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Number of Rooms</label>
              <input type="number" min="1" value={rooms} onChange={e => setRooms(e.target.value)} placeholder="e.g. 5" className={inputCls} {...focusGold} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Avg Nightly Rate (₹)</label>
              <input type="number" min="0" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 2500" className={inputCls} {...focusGold} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">
                Occupancy Rate (%) <span className="text-text-3 font-normal">— use our <Link to="/tools/occupancy-calculator" style={{ color: '#c8a96e' }} className="hover:underline">calculator</Link></span>
              </label>
              <input type="number" min="0" max="100" value={occupancy} onChange={e => setOccupancy(e.target.value)} placeholder="e.g. 70" className={inputCls} {...focusGold} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Period (days)</label>
              <input type="number" min="1" value={days} onChange={e => setDays(e.target.value)} placeholder="e.g. 30" className={inputCls} {...focusGold} />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-text-2 mb-2">
              Operating Expenses (% of gross) <span className="text-text-3 font-normal">— staff, utilities, maintenance, etc.</span>
            </label>
            <div className="flex items-center gap-4">
              <input type="range" min="0" max="80" value={expensePct} onChange={e => setExpensePct(e.target.value)}
                className="flex-1" style={{ accentColor: '#c8a96e' }} />
              <span className="font-display font-extrabold text-lg w-14 text-right" style={{ color: '#c8a96e' }}>
                {expensePct}%
              </span>
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
            <div className="mt-8 pt-8 border-t border-surface3 grid sm:grid-cols-3 gap-4">
              <div className="bg-surface2 rounded-xl p-5 text-center">
                <p className="text-text-3 text-xs uppercase tracking-widest mb-1">Gross Income</p>
                <p className="font-display font-extrabold text-2xl text-text-1">{fmt(result.gross)}</p>
              </div>
              <div className="bg-surface2 rounded-xl p-5 text-center">
                <p className="text-text-3 text-xs uppercase tracking-widest mb-1">Est. Expenses</p>
                <p className="font-display font-extrabold text-2xl text-ch-red">{fmt(result.expenses)}</p>
              </div>
              <div className="bg-surface2 rounded-xl p-5 text-center">
                <p className="text-text-3 text-xs uppercase tracking-widest mb-1">Net Income</p>
                <p className="font-display font-extrabold text-2xl text-ch-green">{fmt(result.net)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Understanding rental income */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">Understanding your rental income</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            <strong className="text-text-1">Gross income</strong> = Rooms × Nightly Rate × Occupancy % × Days. This is your revenue before any expenses.
          </p>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            <strong className="text-text-1">Net income</strong> = Gross − Operating Expenses. Typical operating expenses for an Indian homestay or villa run <strong className="text-text-1">25–35% of gross revenue</strong>, covering staff, utilities, maintenance, and cleaning.
          </p>
          <p className="text-text-2 text-sm leading-relaxed">
            A healthy net rental yield for a short-term holiday property in India is <strong className="text-text-1">6–12% annually</strong> on the property value. Properties in high-demand locations (hill stations, coastal areas, heritage towns) tend to sit at the higher end.
          </p>
        </div>

        {/* Expense breakdown */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">Typical operating expense breakdown for Indian homestays</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-4">
            Use these benchmarks to set your expense % slider above:
          </p>
          <div className="space-y-2">
            {[
              { category: 'Staff wages', range: '10–15%' },
              { category: 'Electricity & water', range: '5–8%' },
              { category: 'Cleaning & laundry', range: '4–6%' },
              { category: 'Maintenance & repairs', range: '3–5%' },
              { category: 'OTA commissions (if applicable)', range: '15–20%' },
              { category: 'Property tax & insurance', range: '2–3%' },
              { category: 'Consumables & toiletries', range: '2–3%' },
            ].map(({ category, range }) => (
              <div key={category} className="flex items-center justify-between bg-surface2 rounded-lg px-4 py-3">
                <span className="text-text-2 text-sm">{category}</span>
                <span className="font-display font-extrabold text-sm" style={{ color: '#c8a96e' }}>{range}</span>
              </div>
            ))}
          </div>
          <p className="text-text-3 text-xs mt-3 leading-relaxed">
            Total operating expenses typically range <strong className="text-text-2">25–40% of gross revenue</strong>. Properties with high OTA dependence sit at the upper end.
          </p>
        </div>

        {/* OTA impact */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">How OTA fees affect your rental income</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            Listing on OTAs dramatically increases occupancy, but the commission costs are significant. Typical rates:
          </p>
          <div className="space-y-2 mb-4">
            {[
              { ota: 'Booking.com', fee: '15–18% of booking value' },
              { ota: 'Airbnb (host fee)', fee: '3% of booking subtotal' },
              { ota: 'MakeMyTrip', fee: '15–20% of booking value' },
              { ota: 'Goibibo', fee: '15–18% of booking value' },
            ].map(({ ota, fee }) => (
              <div key={ota} className="flex items-center justify-between bg-surface2 rounded-lg px-4 py-3">
                <span className="text-text-2 text-sm font-medium">{ota}</span>
                <span className="text-text-2 text-sm">{fee}</span>
              </div>
            ))}
          </div>
          <p className="text-text-2 text-sm leading-relaxed">
            <strong className="text-text-1">Strategy:</strong> Use OTAs to fill occupancy gaps and build reviews early on. As you accumulate repeat guests, shift bookings to direct channels (WhatsApp, phone) to capture the 15–20% you'd otherwise pay in commission.
          </p>
        </div>

        {/* Rental yield context */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">What is a good rental yield in India?</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            Net rental yield = (Annual Net Income ÷ Property Value) × 100. For short-term holiday rentals in India:
          </p>
          <div className="space-y-2 mb-4">
            {[
              { type: 'Hill station / mountain property', yield: '8–12%' },
              { type: 'Coastal / beach property', yield: '7–10%' },
              { type: 'Heritage / boutique property', yield: '6–9%' },
              { type: 'City guesthouse', yield: '5–8%' },
              { type: 'Long-term residential rental', yield: '2–4%' },
            ].map(({ type, yield: y }) => (
              <div key={type} className="flex items-center justify-between bg-surface2 rounded-lg px-4 py-3">
                <span className="text-text-2 text-sm">{type}</span>
                <span className="font-display font-extrabold text-sm" style={{ color: '#c8a96e' }}>{y}</span>
              </div>
            ))}
          </div>
          <p className="text-text-2 text-sm leading-relaxed">
            Short-term holiday rentals consistently outperform long-term residential rentals in yield — often by 3–5x — but require active management. Professional tools like Chakrio reduce the management overhead significantly.
          </p>
        </div>

        {/* CTA */}
        <CTABox
          headline="Want your actual booking data in one place?"
          body="Chakrio auto-records every booking your property receives via chatbot — so you can track real revenue, not estimates."
          buttonText="Automate Your Booking Records →"
        />

        {/* Related tools */}
        <div className="mt-10">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">More Free Tools</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/tools/occupancy-calculator"
              className="bg-surface rounded-xl border border-surface3 p-5 transition-colors"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
              <p className="font-medium text-text-1 mb-1">Occupancy Rate Calculator</p>
              <p className="text-text-2 text-sm">Calculate your property's occupancy rate for any period.</p>
            </Link>
            <Link to="/tools/cancellation-policy"
              className="bg-surface rounded-xl border border-surface3 p-5 transition-colors"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
              <p className="font-medium text-text-1 mb-1">Cancellation Policy Generator</p>
              <p className="text-text-2 text-sm">Generate a professional cancellation policy for your property.</p>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

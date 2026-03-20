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
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Rental Income Calculator for Property — Free Tool | Chakrio" />
        <meta name="twitter:description" content="Estimate gross and net rental income from your property instantly. Free, no sign-up required." />
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

        {/* CTA */}
        <CTABox
          headline="Want your actual booking data in one place?"
          body="Chakrio auto-records every booking your property receives via Telegram — so you can track real revenue, not estimates."
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

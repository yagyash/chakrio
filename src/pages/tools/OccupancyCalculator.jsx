import { useState } from 'react';
import { Link } from 'react-router-dom';
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

        {/* CTA */}
        <CTABox
          headline="Still tracking bookings in a spreadsheet?"
          body="Chakrio connects to Telegram and auto-records every booking, cancellation, and expense into your Google Sheet — so your occupancy data is always up to date."
          buttonText="Track Bookings Automatically →"
        />

        {/* Related tools */}
        <div className="mt-10">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">More Free Tools</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/tools/rental-income-calculator"
              className="bg-surface rounded-xl border border-surface3 p-5 transition-colors group"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
              <p className="font-medium text-text-1 mb-1 transition-colors" style={{}}>Rental Income Calculator</p>
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

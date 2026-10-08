/**
 * /r/:token — the trustee's evening report in full (chakrio-agent plan E05).
 * Opened from the WhatsApp report's button; read-only, no login. The token is
 * signed by the agent (one property, one day, 7 days) and the agent refuses
 * anything else. noindex: these pages must never reach a search engine.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getDailyReport } from '../services/directBooking';

const C = {
  canvas: '#F7F6F3', card: '#FFFFFF', border: '#EAEAEA', ink: '#2F3437', muted: '#787774',
  green: ['#EDF3EC', '#346538'], yellow: ['#FBF3DB', '#956400'], red: ['#FDEBEC', '#9F2F2D'],
};
const SANS = "'Hanken Grotesk', 'Noto Sans Devanagari', 'Nirmala UI', 'Helvetica Neue', sans-serif";
const SERIF = "'DM Serif Display', 'Noto Serif Devanagari', serif";

const METHOD_LABEL = { cash: 'नकद · Cash', upi: 'UPI', razorpay: 'ऑनलाइन · Online', card: 'कार्ड · Card',
  bank: 'बैंक · Bank', other: 'अन्य · Other', unknown: 'तरीका नहीं बताया · Not stated' };
const FLAG_LABEL = {
  deleted: 'बुकिंग हटाई', total_edited: 'रकम बदली', cancelled_with_advance: 'एडवांस के साथ रद्द',
  write_off: 'छूट दी', backdated: 'पिछली तारीख', complimentary: 'मुफ़्त', below_rate: 'रेट से कम',
  no_phone: 'फ़ोन नहीं', no_room: 'कमरा नहीं', no_method: 'तरीका नहीं',
};

const rupees = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

function Card({ children, style }) {
  return (
    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, ...style }}>
      {children}
    </section>
  );
}

function Label({ hi, en }) {
  return (
    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.4 }}>
      <span style={{ color: C.ink, fontWeight: 600 }}>{hi}</span> · {en}
    </div>
  );
}

function Stat({ hi, en, value, sub }) {
  return (
    <Card>
      <Label hi={hi} en={en} />
      <div style={{ fontFamily: SERIF, fontSize: 34, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 10 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

function Tag({ tone, children }) {
  const [bg, fg] = C[tone];
  return (
    <span style={{ background: bg, color: fg, borderRadius: 9999, padding: '3px 10px', fontSize: 11,
      fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{children}</span>
  );
}

function Row({ left, right, strong }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0',
      borderBottom: `1px solid ${C.border}`, fontWeight: strong ? 700 : 400 }}>
      <span>{left}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{right}</span>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{ background: C.canvas, minHeight: '100vh', color: C.ink, fontFamily: SANS, lineHeight: 1.6 }}>
      <Helmet>
        <title>आज का हिसाब · Chakrio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px 48px' }}>{children}</main>
    </div>
  );
}

export default function TrusteeReportPage() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDailyReport(token).then(setReport).catch(() => setError('expired'));
  }, [token]);

  if (error) {
    return (
      <Shell>
        <Card>
          <div style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1.2 }}>यह लिंक अब नहीं खुलता</div>
          <p style={{ color: C.muted, marginTop: 8 }}>
            This report link is invalid or more than 7 days old. Today&apos;s report arrives on WhatsApp every evening.
          </p>
        </Card>
      </Shell>
    );
  }
  if (!report) {
    return <Shell><p style={{ color: C.muted }}>हिसाब खुल रहा है… · Loading the report…</p></Shell>;
  }

  const { occupancy: o, business: b, money: m, leakage, flags, mtd } = report;
  const collected = Object.values(m.by_method).reduce((s, v) => s + v, 0);
  const expenses = Object.values(m.expenses).reduce((s, v) => s + v, 0);
  const day = new Date(`${report.date}T00:00:00`).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Shell>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: C.muted, letterSpacing: '0.05em' }}>आज का हिसाब · DAILY REPORT</div>
        <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '6px 0 4px' }}>
          {report.property}
        </h1>
        <div style={{ color: C.muted }}>{day}</div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 12 }}>
        <Stat hi="कमरे भरे" en="Occupied" value={`${o.pct}%`} sub={`${o.rooms_used} / ${o.rooms} कमरे`} />
        <Stat hi="आज जमा" en="Collected" value={rupees(collected)} sub={m.refunds ? `वापसी ${rupees(m.refunds)}` : null} />
        <Stat hi="नई बुकिंग" en="New bookings" value={b.new_bookings} sub={rupees(b.new_value)} />
        <Stat hi="खर्च" en="Expenses" value={rupees(expenses)} />
      </div>

      <Card style={{ marginBottom: 12 }}>
        <Label hi="पैसा किस तरह आया" en="How money came in" />
        <div style={{ marginTop: 8 }}>
          {Object.entries(m.by_method).map(([k, v]) => <Row key={k} left={METHOD_LABEL[k] || k} right={rupees(v)} />)}
          {Object.keys(m.by_method).length === 0 && <Row left="आज कुछ जमा नहीं · Nothing collected" right="—" />}
          {Object.entries(m.expenses).map(([k, v]) => (
            <Row key={`e-${k}`} left={`खर्च (${METHOD_LABEL[k] || k})`} right={`− ${rupees(v)}`} />
          ))}
          <Row strong left="गल्ले में नकद होना चाहिए · Cash in hand" right={rupees(m.expected_cash_in_hand)} />
        </div>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Label hi="आना-जाना" en="Arrivals and departures" />
        <div style={{ marginTop: 8 }}>
          <Row left="आज आए · Arrived" right={o.arrivals} />
          <Row left="आज गए · Left" right={o.departures} />
          <Row left="रुके हुए · Staying" right={o.in_house} />
        </div>
      </Card>

      {leakage.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label hi="बकाया छोड़कर गए" en="Left with money due" />
            <Tag tone="yellow">{leakage.length}</Tag>
          </div>
          <div style={{ marginTop: 8 }}>
            {leakage.map((d, i) => (
              <Row key={i} left={`${d.guest}${d.room ? ` · कमरा ${d.room}` : ''}`} right={rupees(d.balance)} />
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label hi="ध्यान देने वाली बातें" en="Items to review" />
          <Tag tone={flags.length ? 'red' : 'green'}>{flags.length || 'ठीक है'}</Tag>
        </div>
        <div style={{ marginTop: 8 }}>
          {flags.length === 0 && <p style={{ color: C.muted, margin: '8px 0 0' }}>आज कोई गड़बड़ नहीं दिखी. Nothing unusual today.</p>}
          {flags.map((f, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <Tag tone="red">{FLAG_LABEL[f.kind] || f.kind}</Tag>
              <div style={{ marginTop: 6, fontSize: 15 }}>{f.text}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Label hi="इस महीने अब तक" en="Month to date" />
        <div style={{ marginTop: 8 }}>
          <Row left="बुकिंग की रकम · Billed" right={`${rupees(mtd.billed)}  (पिछला ${rupees(mtd.billed_prev)})`} />
          <Row left="जमा हुआ · Collected" right={`${rupees(mtd.collected)}  (पिछला ${rupees(mtd.collected_prev)})`} />
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>पिछला = पिछले महीने के इन्हीं दिनों में · Previous = same days last month</div>
      </Card>

      <footer style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 28 }}>
        Chakrio · यह लिंक 7 दिन तक खुलेगा
      </footer>
    </Shell>
  );
}

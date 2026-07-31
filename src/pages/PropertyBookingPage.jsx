/**
 * Public direct-booking page — /book/:propertySlug
 *
 * Static half (renders without JS, via prerender-capture.mjs): property
 * description, photos, schema.org markup. Live half (this component,
 * hydrated client-side): availability check -> reserve -> pay. One page
 * handles both a single room (or a villa's single unit) and multiple rooms
 * of mixed types in one request — see services/directBooking.js.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { QRCodeSVG } from 'qrcode.react';
import { getPropertyContent } from '../data/propertyContent';
import { getPropertyInfo, getAvailability, reserve, confirmUpiPayment } from '../services/directBooking';

const BRAND = '#6C63FF';
const GOLD = '#C9A24B';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function PropertyBookingPage() {
  const { propertySlug } = useParams();
  const content = getPropertyContent(propertySlug);

  const [info, setInfo] = useState(null);
  const [infoError, setInfoError] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [quantities, setQuantities] = useState({}); // room_type -> quantity
  const [quote, setQuote] = useState(null); // combined availability/price across lines
  const [checking, setChecking] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [reservation, setReservation] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!content) return;
    getPropertyInfo(content.backendSlug)
      .then((data) => {
        setInfo(data);
        if (!data.has_rooms && data.rates[0]) {
          setQuantities({ [data.rates[0].room_type]: 1 });
        }
      })
      .catch(() => setInfoError('Could not load this property right now. Please try again shortly.'));
  }, [content]);

  const activeLines = useMemo(
    () => Object.entries(quantities).filter(([, qty]) => qty > 0),
    [quantities],
  );

  async function handleCheckAvailability() {
    if (!checkIn || !checkOut || activeLines.length === 0) return;
    setChecking(true);
    setError('');
    setQuote(null);
    try {
      const results = await Promise.all(
        activeLines.map(([roomType]) => getAvailability(content.backendSlug, { roomType, checkIn, checkOut })),
      );
      const allAvailable = results.every((r, i) => r.available_count >= activeLines[i][1]);
      const total = results.reduce((sum, r, i) => sum + r.price_per_night * r.nights * activeLines[i][1], 0);
      setQuote({ allAvailable, total, nights: results[0]?.nights || 0 });
    } catch {
      setError('Could not check availability. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  async function handleReserve() {
    if (!guestName || !guestPhone) {
      setError('Please enter your name and phone number.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await reserve(content.backendSlug, {
        rooms: activeLines.map(([roomType, quantity]) => ({ room_type: roomType, quantity })),
        checkIn, checkOut, guestName, guestPhone,
      });
      setReservation(result);
    } catch (e) {
      setError(e.message || 'Could not start your reservation. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmPaid() {
    setBusy(true);
    setError('');
    try {
      await confirmUpiPayment(content.backendSlug, reservation.group_id);
      setConfirmed(true);
    } catch (e) {
      setError(e.message || 'Could not confirm payment. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!content) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9D98AC' }}>Property not found.</div>;
  }

  const canonical = `https://chakrio.com/book/${propertySlug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: content.displayName,
    address: {
      '@type': 'PostalAddress',
      streetAddress: content.fullAddress,
      addressLocality: content.locality,
      addressCountry: 'IN',
    },
    geo: { '@type': 'GeoCoordinates', latitude: content.geo.lat, longitude: content.geo.lng },
    telephone: content.phone,
    url: canonical,
    amenityFeature: content.amenities.map((name) => ({ '@type': 'LocationFeatureSpecification', name })),
    ...(info?.rates?.length && {
      makesOffer: info.rates.map((r) => ({
        '@type': 'Offer',
        name: r.room_type,
        priceCurrency: 'INR',
        price: r.price_per_night,
      })),
    }),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Chakrio', item: 'https://chakrio.com/' },
      { '@type': 'ListItem', position: 2, name: 'Dharamshalas & Villas', item: 'https://chakrio.com/dharmshala' },
      { '@type': 'ListItem', position: 3, name: content.displayName, item: canonical },
    ],
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0E0B14', color: '#F4F1EA', fontFamily: "'Hanken Grotesk', 'DM Sans', sans-serif" }}>
      <Helmet>
        <title>{content.displayName} — Book Direct | Chakrio</title>
        <meta name="description" content={content.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${content.displayName} — Book Direct`} />
        <meta property="og:description" content={content.metaDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        {info?.photos?.[0] && <meta property="og:image" content={info.photos[0]} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      {/* Hero */}
      <div style={{ padding: '48px 20px 32px', maxWidth: 760, margin: '0 auto' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          {content.locality}
        </p>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: '6px 0 16px', letterSpacing: '-0.02em' }}>
          {content.displayName}
        </h1>

        {info?.photos?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: info.photos.length > 1 ? '2fr 1fr' : '1fr', gap: 8, marginBottom: 24 }}>
            <img src={info.photos[0]} alt={content.displayName} style={{ width: '100%', height: 320, objectFit: 'cover', borderRadius: 12 }} />
            {info.photos.length > 1 && (
              <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 8 }}>
                {info.photos.slice(1, 3).map((url, i) => (
                  <img key={i} src={url} alt={`${content.displayName} ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                ))}
              </div>
            )}
          </div>
        )}

        <p style={{ fontSize: 16, lineHeight: 1.7, color: '#CFCAD9' }}>{content.about}</p>

        {/* Amenities */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, margin: '24px 0' }}>
          {content.amenities.map((a) => (
            <div key={a} style={{ fontSize: 14, color: '#9D98AC', display: 'flex', gap: 8 }}>
              <span style={{ color: BRAND }}>•</span> {a}
            </div>
          ))}
        </div>

        {/* Nearby */}
        <div style={{ margin: '24px 0', fontSize: 13, color: '#9D98AC' }}>
          {content.nearby.map((n) => `${n.name} (${n.distance})`).join(' · ')}
        </div>

        {/* Booking widget */}
        <div style={{ background: '#16151f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginTop: 32 }}>
          {infoError && <p style={{ color: '#e07070' }}>{infoError}</p>}

          {!info && !infoError && <p style={{ color: '#9D98AC' }}>Loading availability…</p>}

          {info && !confirmed && !reservation && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Book Direct</h2>
              {!info.has_rooms && info.rates[0]?.capacity && (
                <p style={{ fontSize: 13, color: '#9D98AC', margin: '0 0 16px' }}>
                  Whole property, sleeps up to {info.rates[0].capacity} guests
                </p>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: '#9D98AC' }}>
                  Check-in
                  <input type="date" min={todayStr()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                    style={{ display: 'block', marginTop: 4, padding: '8px 10px', borderRadius: 8, background: '#0E0B14', color: '#F4F1EA', border: '1px solid rgba(255,255,255,0.15)' }} />
                </label>
                <label style={{ fontSize: 13, color: '#9D98AC' }}>
                  Check-out
                  <input type="date" min={checkIn || todayStr()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                    style={{ display: 'block', marginTop: 4, padding: '8px 10px', borderRadius: 8, background: '#0E0B14', color: '#F4F1EA', border: '1px solid rgba(255,255,255,0.15)' }} />
                </label>
              </div>

              {info.has_rooms && (
                <div style={{ marginBottom: 16 }}>
                  {info.rates.map((r) => (
                    <div key={r.room_type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 14 }}>
                        {r.room_type}{r.capacity ? ` (sleeps ${r.capacity})` : ''} — ₹{r.price_per_night.toLocaleString('en-IN')}/night
                      </span>
                      <input type="number" min={0} max={20} value={quantities[r.room_type] || 0}
                        onChange={(e) => setQuantities((q) => ({ ...q, [r.room_type]: Number(e.target.value) }))}
                        style={{ width: 56, padding: '4px 8px', borderRadius: 6, background: '#0E0B14', color: '#F4F1EA', border: '1px solid rgba(255,255,255,0.15)' }} />
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleCheckAvailability} disabled={checking || !checkIn || !checkOut}
                style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', opacity: checking ? 0.6 : 1 }}>
                {checking ? 'Checking…' : 'Check Availability'}
              </button>

              {quote && (
                <div style={{ marginTop: 16 }}>
                  {quote.allAvailable ? (
                    <>
                      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
                        ₹{quote.total.toLocaleString('en-IN')} <span style={{ fontSize: 13, fontWeight: 400, color: '#9D98AC' }}>for {quote.nights} night{quote.nights > 1 ? 's' : ''}</span>
                      </p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                        <input placeholder="Your name" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: 8, background: '#0E0B14', color: '#F4F1EA', border: '1px solid rgba(255,255,255,0.15)' }} />
                        <input placeholder="WhatsApp number" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: 8, background: '#0E0B14', color: '#F4F1EA', border: '1px solid rgba(255,255,255,0.15)' }} />
                      </div>
                      <button onClick={handleReserve} disabled={busy}
                        style={{ background: GOLD, color: '#0E0B14', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
                        {busy ? 'Starting…' : 'Reserve & Pay'}
                      </button>
                    </>
                  ) : (
                    <p style={{ color: '#e07070' }}>Sorry, not available for those dates.</p>
                  )}
                </div>
              )}
            </>
          )}

          {reservation && !confirmed && (
            <div>
              <p style={{ fontSize: 18, fontWeight: 700 }}>₹{reservation.amount.toLocaleString('en-IN')}</p>
              {reservation.payment_method === 'upi' ? (
                <>
                  <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block', marginBottom: 12 }}>
                    <QRCodeSVG value={reservation.upi_uri} size={180} />
                  </div>
                  <p style={{ fontSize: 13, color: '#9D98AC', marginBottom: 12 }}>
                    Scan with any UPI app, or on mobile <a href={reservation.upi_uri} style={{ color: BRAND }}>tap here to pay</a>.
                  </p>
                  <button onClick={handleConfirmPaid} disabled={busy}
                    style={{ background: GOLD, color: '#0E0B14', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
                    {busy ? 'Confirming…' : "I've Paid"}
                  </button>
                </>
              ) : (
                <a href={reservation.payment_url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-block', background: GOLD, color: '#0E0B14', borderRadius: 8, padding: '10px 20px', fontWeight: 700, textDecoration: 'none' }}>
                  Complete Payment
                </a>
              )}
            </div>
          )}

          {confirmed && (
            <p style={{ fontSize: 16, color: '#5cb88a' }}>
              ✅ Payment received — your confirmation is on its way via WhatsApp.
            </p>
          )}

          {error && <p style={{ color: '#e07070', marginTop: 12 }}>{error}</p>}
        </div>

        {/* Contact / NAP */}
        <div style={{ marginTop: 32, fontSize: 13, color: '#9D98AC' }}>
          <p style={{ margin: '4px 0' }}>{content.fullAddress}</p>
          <p style={{ margin: '4px 0' }}>
            <a href={`tel:${content.phone}`} style={{ color: BRAND }}>{content.phone}</a>
            {' · '}
            <a href={`mailto:${content.email}`} style={{ color: BRAND }}>{content.email}</a>
          </p>
        </div>
      </div>
    </div>
  );
}

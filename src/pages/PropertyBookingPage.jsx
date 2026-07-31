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
import { MapPin, Phone, Mail, Users, Check, AlertCircle, CircleCheck, Loader2 } from 'lucide-react';
import { getPropertyContent } from '../data/propertyContent';
import { getPropertyInfo, getAvailability, reserve, confirmUpiPayment } from '../services/directBooking';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  'w-full bg-bg-app text-text-1 placeholder:text-text-3 border border-white/15 rounded-lg px-3 py-2.5 text-sm ' +
  'transition-colors duration-200 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 bg-gold text-bg-app font-semibold rounded-lg px-5 py-2.5 text-sm ' +
  'transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

function Alert({ tone = 'error', children }) {
  const tones = {
    error: 'bg-ch-red/10 border-ch-red/30 text-ch-red',
    success: 'bg-ch-green/10 border-ch-green/30 text-ch-green',
  };
  const Icon = tone === 'success' ? CircleCheck : AlertCircle;
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export default function PropertyBookingPage() {
  const { propertySlug } = useParams();
  const content = getPropertyContent(propertySlug);

  const [info, setInfo] = useState(null);
  const [infoError, setInfoError] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [quantities, setQuantities] = useState({}); // room_type -> quantity (has-rooms properties)
  const [partySize, setPartySize] = useState(null); // guest count (villas)
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
          setPartySize(data.rates[0].guest_count);
        }
      })
      .catch(() => setInfoError('Could not load this property right now. Please try again shortly.'));
  }, [content]);

  const activeLines = useMemo(
    () => Object.entries(quantities).filter(([, qty]) => qty > 0),
    [quantities],
  );

  async function handleCheckAvailability() {
    if (!checkIn || !checkOut) return;
    if (info.has_rooms ? activeLines.length === 0 : !partySize) return;
    setChecking(true);
    setError('');
    setQuote(null);
    try {
      if (info.has_rooms) {
        const results = await Promise.all(
          activeLines.map(([roomType]) => getAvailability(content.backendSlug, { roomType, checkIn, checkOut })),
        );
        const allAvailable = results.every((r, i) => r.available_count >= activeLines[i][1]);
        const total = results.reduce((sum, r, i) => sum + r.price_per_night * r.nights * activeLines[i][1], 0);
        setQuote({ allAvailable, total, nights: results[0]?.nights || 0 });
      } else {
        const r = await getAvailability(content.backendSlug, { partySize, checkIn, checkOut });
        setQuote({ allAvailable: r.available, total: r.total_price, nights: r.nights });
      }
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
        rooms: info.has_rooms ? activeLines.map(([roomType, quantity]) => ({ room_type: roomType, quantity })) : undefined,
        partySize: info.has_rooms ? undefined : partySize,
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-app text-text-3">
        Property not found.
      </div>
    );
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
        name: r.room_type || `${r.guest_count} guests`,
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
    <div className="min-h-screen bg-bg-app text-text-1 font-sans">
      <Helmet>
        <title>{`${content.displayName} — Book Direct | Chakrio`}</title>
        <meta name="description" content={content.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${content.displayName} — Book Direct`} />
        <meta property="og:description" content={content.metaDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={info?.photos?.[0] || 'https://chakrio.com/og-image.png'} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      {/* Ambient glow behind the header — adds depth to an otherwise flat section */}
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #6C63FF, transparent)' }}
        />

        <main className="relative max-w-3xl mx-auto px-5 py-12 md:py-16">
          {/* Eyebrow + heading */}
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold m-0">
            <MapPin size={14} /> {content.locality}
          </p>
          <h1 className="font-display text-4xl md:text-[2.75rem] font-extrabold tracking-tight mt-2 mb-5 text-balance">
            {content.displayName}
          </h1>

          {/* Photos */}
          {info?.photos?.length > 0 && (
            <div className={`grid gap-2 mb-8 ${info.photos.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}>
              <img
                src={info.photos[0]}
                alt={`${content.displayName} — exterior view`}
                className={`w-full object-cover rounded-xl shadow-lg shadow-black/30 ${info.photos.length > 1 ? 'col-span-2 h-80' : 'h-80'}`}
              />
              {info.photos.length > 1 && (
                <div className="grid grid-rows-2 gap-2">
                  {info.photos.slice(1, 3).map((url, i) => (
                    <img
                      key={url}
                      src={url}
                      alt={`${content.displayName} — view ${i + 2}`}
                      className="w-full h-full object-cover rounded-xl shadow-lg shadow-black/30"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-[15px] leading-relaxed text-text-2 max-w-[65ch]">{content.about}</p>

          {/* Amenities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 my-8">
            {content.amenities.map((a) => (
              <div key={a} className="flex items-center gap-2.5 text-sm text-text-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <Check size={12} strokeWidth={3} />
                </span>
                {a}
              </div>
            ))}
          </div>

          {/* Nearby */}
          <div className="flex flex-wrap gap-2 mb-10">
            {content.nearby.map((n) => (
              <span key={n.name} className="text-xs text-text-3 bg-surface2 border border-white/8 rounded-full px-3 py-1">
                {n.name} · {n.distance}
              </span>
            ))}
          </div>

          {/* Booking widget */}
          <section className="bg-surface border border-white/8 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20">
            {infoError && <Alert>{infoError}</Alert>}

            {!info && !infoError && (
              <div className="flex items-center gap-2 text-text-3 text-sm py-4">
                <Loader2 size={16} className="animate-spin" /> Loading availability…
              </div>
            )}

            {info && !confirmed && !reservation && (
              <>
                <h2 className="font-display text-lg font-bold m-0">Book Direct</h2>
                {!info.has_rooms && info.max_capacity && (
                  <p className="flex items-center gap-1.5 text-sm text-text-3 mt-1 mb-5">
                    <Users size={14} /> Whole property, sleeps up to {info.max_capacity} guests
                  </p>
                )}

                <div className="flex gap-3 flex-wrap mb-5">
                  <label className="text-xs font-medium text-text-3">
                    Check-in
                    <input type="date" min={todayStr()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                      className={`block mt-1.5 ${inputClass}`} />
                  </label>
                  <label className="text-xs font-medium text-text-3">
                    Check-out
                    <input type="date" min={checkIn || todayStr()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                      className={`block mt-1.5 ${inputClass}`} />
                  </label>
                </div>

                {info.has_rooms ? (
                  <div className="mb-5 divide-y divide-white/6">
                    {info.rates.map((r) => (
                      <div key={r.room_type} className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-text-2">
                          {r.room_type}{r.capacity ? ` · sleeps ${r.capacity}` : ''} — <span className="tabular-nums">₹{r.price_per_night.toLocaleString('en-IN')}</span>/night
                        </span>
                        <input type="number" min={0} max={20} value={quantities[r.room_type] || 0}
                          onChange={(e) => setQuantities((q) => ({ ...q, [r.room_type]: Number(e.target.value) }))}
                          className={`w-16 text-center tabular-nums ${inputClass}`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="block text-xs font-medium text-text-3 mb-5">
                    Guests
                    <select value={partySize || ''} onChange={(e) => setPartySize(Number(e.target.value))}
                      className={`block mt-1.5 ${inputClass}`}>
                      {info.rates.map((r) => (
                        <option key={r.guest_count} value={r.guest_count}>
                          {r.guest_count} guests — ₹{r.price_per_night.toLocaleString('en-IN')}/night
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <button
                  onClick={handleCheckAvailability}
                  disabled={checking || !checkIn || !checkOut || (info.has_rooms ? activeLines.length === 0 : !partySize)}
                  className={primaryButtonClass}
                >
                  {checking && <Loader2 size={15} className="animate-spin" />}
                  {checking ? 'Checking…' : 'Check Availability'}
                </button>

                {quote && (
                  <div className="mt-5">
                    {quote.allAvailable ? (
                      <>
                        <p className="text-2xl font-bold tabular-nums m-0 mb-4">
                          ₹{quote.total.toLocaleString('en-IN')}{' '}
                          <span className="text-sm font-medium text-text-3">for {quote.nights} night{quote.nights > 1 ? 's' : ''}</span>
                        </p>
                        <div className="flex gap-3 flex-wrap mb-4">
                          <input placeholder="Your name" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                            className={`flex-1 min-w-[140px] ${inputClass}`} />
                          <input placeholder="WhatsApp number" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)}
                            className={`flex-1 min-w-[140px] ${inputClass}`} />
                        </div>
                        <button onClick={handleReserve} disabled={busy} className={primaryButtonClass}>
                          {busy && <Loader2 size={15} className="animate-spin" />}
                          {busy ? 'Starting…' : 'Reserve & Pay'}
                        </button>
                      </>
                    ) : (
                      <Alert>Not available for those dates. Try different dates.</Alert>
                    )}
                  </div>
                )}
              </>
            )}

            {reservation && !confirmed && (
              <div>
                <p className="text-xl font-bold tabular-nums mb-4">₹{reservation.amount.toLocaleString('en-IN')}</p>
                {reservation.payment_method === 'upi' ? (
                  <>
                    <div className="inline-block bg-white p-4 rounded-xl shadow-lg shadow-black/20 mb-4">
                      <QRCodeSVG value={reservation.upi_uri} size={172} />
                    </div>
                    <p className="text-sm text-text-3 mb-4">
                      Scan with any UPI app, or on mobile{' '}
                      <a href={reservation.upi_uri} className="text-brand hover:underline">tap here to pay</a>.
                    </p>
                    <button onClick={handleConfirmPaid} disabled={busy} className={primaryButtonClass}>
                      {busy && <Loader2 size={15} className="animate-spin" />}
                      {busy ? 'Confirming…' : "I've paid"}
                    </button>
                  </>
                ) : (
                  <a href={reservation.payment_url} target="_blank" rel="noreferrer" className={primaryButtonClass}>
                    Complete payment
                  </a>
                )}
              </div>
            )}

            {confirmed && (
              <Alert tone="success">Payment received. Your confirmation is on its way via WhatsApp.</Alert>
            )}

            {error && <div className="mt-4"><Alert>{error}</Alert></div>}
          </section>

          {/* Contact / NAP */}
          <address className="not-italic mt-10 text-sm text-text-3 space-y-1.5">
            <p className="m-0">{content.fullAddress}</p>
            <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1">
              <a href={`tel:${content.phone}`} className="flex items-center gap-1.5 hover:text-text-2 transition-colors">
                <Phone size={13} /> {content.phone}
              </a>
              <a href={`mailto:${content.email}`} className="flex items-center gap-1.5 hover:text-text-2 transition-colors">
                <Mail size={13} /> {content.email}
              </a>
            </p>
          </address>
        </main>
      </div>
    </div>
  );
}

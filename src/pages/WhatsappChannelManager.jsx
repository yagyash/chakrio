import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import CTABox from '../components/tools/CTABox';
import ToolConversionHook from '../components/tools/ToolConversionHook';
import LeadCaptureBox from '../components/shared/LeadCaptureBox';

/**
 * Targets "hotel channel manager whatsapp" and its variants — a query the
 * homepage never answered, because the homepage copy says "booking automation"
 * and never says "channel manager".
 *
 * Every capability claim here is deliberately scoped to what is on main and
 * deployed: two-way iCal sync (services/ical_sync.py polls OTA feeds every 30
 * minutes, routers/ical_outbound.py serves a per-property .ics), managed over
 * WhatsApp/Telegram. Chakrio does NOT push rates or per-room-type inventory
 * through OTA APIs, and the "What Chakrio does not do" section below says so in
 * plain words. Do not soften that section to win the keyword — a buyer who
 * arrives expecting Booking.com rate parity and discovers otherwise is a
 * refund and a bad review, and an overstated claim is the kind of thing AI
 * answer engines quote back at you.
 */

const LAST_UPDATED = '29 September 2026';

const SYNCS = [
  {
    title: 'Bookings in, from any OTA with an iCal feed',
    body: 'Airbnb, Booking.com, MakeMyTrip, Agoda, Vrbo and most others publish a calendar feed per listing. Paste the URL once and Chakrio polls it every 30 minutes, creating each new reservation against the right property and room.',
  },
  {
    title: 'Cancellations and silent removals',
    body: 'A reservation cancelled on the OTA is marked cancelled in Chakrio on the next poll. Events that vanish from a feed without a cancellation notice are caught too, so a freed-up date does not stay blocked.',
  },
  {
    title: 'Your availability out, as a calendar feed',
    body: 'Each property gets its own tokenised .ics URL. Give it to any OTA, and direct bookings taken over WhatsApp block those dates on that channel automatically — which is where most double bookings actually come from.',
  },
  {
    title: 'Every change announced on WhatsApp',
    body: 'When a sync brings in a new booking, the manager gets a message naming the guest, dates and channel. No dashboard to keep open, no email digest to miss.',
  },
];

const NOT_SYNCED = [
  {
    title: 'Rate and price push to OTAs',
    body: 'Chakrio does not write nightly rates into Booking.com or Airbnb. iCal carries dates, not prices. If your main requirement is rate parity managed from one screen, you need an API-level channel manager, and you should buy one.',
  },
  {
    title: 'Per-room-type inventory for larger hotels',
    body: 'iCal is a calendar, not an inventory ledger. It fits whole-property and small-room-count stays. A 40-room hotel selling several room types across many channels will outgrow it.',
  },
  {
    title: 'OTA listing and content management',
    body: 'Photos, descriptions and amenity lists stay where they are. Chakrio does not edit your listings.',
  },
];

const FAQ = [
  {
    q: 'Is Chakrio a full channel manager?',
    a: 'Not in the API sense, and it is worth being precise about that. Chakrio does two-way calendar sync over iCal: it pulls reservations in from any OTA that publishes a feed, every 30 minutes, and publishes your own availability back out as a .ics feed each channel can subscribe to. That prevents double bookings, which is the problem most small properties actually have. What it does not do is push nightly rates or per-room-type inventory through OTA APIs. If you need rate parity managed centrally across many channels, buy a dedicated channel manager instead.',
  },
  {
    q: 'How do I connect Chakrio to my OTA calendar?',
    a: 'Copy the iCal export URL from your listing — every major OTA provides one under calendar or sync settings — and send it to Chakrio. It begins polling that feed every 30 minutes. For the other direction, Chakrio gives each property a private .ics URL that you paste into the OTA as an imported calendar.',
  },
  {
    q: 'How quickly does availability update?',
    a: 'Inbound feeds are polled every 30 minutes, so an OTA reservation appears in Chakrio within half an hour. Your outbound feed reflects a direct booking as soon as it is recorded; how fast each OTA picks that up depends on how often that OTA re-reads imported calendars, which is outside anyone\'s control and typically ranges from a few minutes to a few hours.',
  },
  {
    q: 'Why manage a channel manager over WhatsApp instead of a dashboard?',
    a: 'Because small-property owners and managers are already in WhatsApp all day and are not going to log into a dashboard to record a walk-in. Chakrio takes plain-language messages — "Sharma family, 2 rooms, 14th to 16th, paid 8000" — and records the booking, the payment and the block. The dashboard exists for when you want to look at numbers; the day-to-day runs in the chat you already have open.',
  },
  {
    q: 'Does it work on Telegram as well?',
    a: 'Yes. Each property chooses its channel, and Telegram behaves the same way for property managers. Telegram is for the internal team; guest-facing messages go over WhatsApp.',
  },
  {
    q: 'What does it cost?',
    a: 'There is a 14-day free trial with no card required, and setup takes about 24 hours because the WhatsApp number has to be provisioned and your properties and rooms loaded. Current pricing is on the homepage.',
  },
];

export default function WhatsappChannelManager() {
  const url = 'https://chakrio.com/whatsapp-channel-manager';

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>WhatsApp Channel Manager for Hotels, Villas &amp; Homestays | Chakrio</title>
        <meta name="description" content="Sync OTA bookings and availability both ways over iCal, and manage it all from WhatsApp. Two-way calendar sync every 30 minutes for villas, homestays and small hotels. Honest about what it does and doesn't do." />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content="WhatsApp Channel Manager for Hotels, Villas & Homestays | Chakrio" />
        <meta property="og:description" content="Two-way iCal sync with every major OTA, managed from WhatsApp. Stop double bookings without learning another dashboard." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "WhatsApp Channel Manager for Hotels, Villas & Homestays",
          "description": "Two-way iCal calendar sync with OTAs, managed over WhatsApp, for villas, homestays and small hotels.",
          "url": url,
          "dateModified": "2026-09-29",
          "author": { "@type": "Organization", "name": "Chakrio", "url": "https://chakrio.com" },
          "publisher": { "@type": "Organization", "name": "Chakrio", "logo": { "@type": "ImageObject", "url": "https://chakrio.com/og-image.png" } },
          "isPartOf": { "@type": "WebSite", "name": "Chakrio", "url": "https://chakrio.com" }
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://chakrio.com/" },
            { "@type": "ListItem", "position": 2, "name": "WhatsApp Channel Manager", "item": url }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQ.map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": { "@type": "Answer", "text": a }
          }))
        })}</script>
      </Helmet>
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <nav className="text-sm text-text-3 mb-8 flex items-center gap-2">
          <Link to="/" className="hover:text-text-2 transition-colors">Home</Link>
          <span>›</span>
          <span className="text-text-1">WhatsApp Channel Manager</span>
        </nav>

        <div className="mb-10">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 mb-3 tracking-tight">
            WhatsApp Channel Manager for Hotels, Villas &amp; Homestays
          </h1>
          <p className="text-text-2 text-base leading-relaxed max-w-2xl">
            Connect your OTA calendars once. Chakrio pulls reservations in every 30 minutes, publishes your
            availability back out, and tells you about every change in WhatsApp — the app you already have open.
            No new dashboard to learn, and no double bookings to apologise for.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(201,162,75,0.12)', color: '#C9A24B', border: '1px solid rgba(201,162,75,0.25)' }}>
            Two-way iCal sync · polled every 30 minutes
          </div>
          <p className="text-text-3 text-xs mt-2">Page last updated: {LAST_UPDATED}</p>
        </div>

        {/* How it works */}
        <div className="bg-surface rounded-2xl border border-surface3 p-8 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">How it works</h2>
          <div className="space-y-4">
            {[
              ['1', 'Send Chakrio your OTA calendar links', 'One iCal URL per listing, copied from the OTA\'s calendar settings. You do this once, at setup.'],
              ['2', 'Chakrio polls them every 30 minutes', 'New reservations are recorded against the right property. Cancellations and removed dates are released.'],
              ['3', 'You get a WhatsApp message for each change', 'Guest name, dates, channel. Reply in plain language to add a direct booking, a payment or an expense.'],
              ['4', 'Your own feed keeps the OTAs in step', 'Each property publishes a private .ics URL, so a direct booking blocks those dates on every channel that subscribes to it.'],
            ].map(([n, title, body]) => (
              <div key={n} className="flex gap-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                  style={{ background: 'rgba(201,162,75,0.12)', color: '#C9A24B', border: '1px solid rgba(201,162,75,0.25)' }}>
                  {n}
                </div>
                <div>
                  <p className="font-medium text-text-1 text-sm mb-1">{title}</p>
                  <p className="text-text-2 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What syncs */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">What Chakrio syncs</h2>
          <div className="space-y-3">
            {SYNCS.map(({ title, body }) => (
              <div key={title} className="bg-surface2 rounded-lg p-4">
                <p className="font-medium text-text-1 text-sm mb-1">{title}</p>
                <p className="text-text-2 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What it does not do — deliberately prominent, not buried */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-2">What Chakrio does not do</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-4">
            Worth knowing before you spend a trial on it. If any of these three is your main requirement,
            a dedicated API-level channel manager is the right purchase and we would rather you made it.
          </p>
          <div className="space-y-3">
            {NOT_SYNCED.map(({ title, body }) => (
              <div key={title} className="bg-surface2 rounded-lg p-4">
                <p className="font-medium text-text-1 text-sm mb-1">{title}</p>
                <p className="text-text-2 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who it fits */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">Who this fits</h2>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            Chakrio was built for properties where the owner or a single manager handles everything, and where
            the real failure mode is a booking that never got written down — a villa taken whole, a homestay with
            a handful of rooms, a dharmshala, a boutique guesthouse.
          </p>
          <p className="text-text-2 text-sm leading-relaxed">
            It fits badly if you have a revenue manager, several room types selling across a dozen channels, and
            a rate strategy that changes daily. That property needs rate push, and rate push needs OTA APIs.
          </p>
        </div>

        {/* FAQ */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">Questions</h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q}>
                <p className="font-medium text-text-1 text-sm mb-1">{q}</p>
                <p className="text-text-2 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <CTABox
          headline="See it running on your own calendars"
          body="Start a 14-day trial, send us your OTA iCal links, and watch the next reservation land in WhatsApp. No card required."
          buttonText="Start free trial →"
          buttonHref="/onboard"
          toolName="whatsapp-channel-manager"
        />

        <LeadCaptureBox sourcePage="whatsapp-channel-manager" />

        <div className="mt-10">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">Free Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { to: '/tools/whatsapp-booking-confirmation', title: 'WhatsApp Booking Confirmation Generator', desc: 'Generate a professional booking confirmation message for WhatsApp.' },
              { to: '/tools/occupancy-calculator', title: 'Hotel Occupancy Rate Calculator', desc: "Calculate your property's occupancy % for any period." },
              { to: '/tools/rental-income-calculator', title: 'Rental Income Calculator', desc: 'Estimate gross and net revenue from your rooms across any period.' },
              { to: '/tools/cancellation-policy', title: 'Cancellation Policy Generator', desc: 'Generate a professional cancellation policy for your property in seconds.' },
              { to: '/tools/invoice-generator', title: 'Villa & Homestay Invoice Generator', desc: 'Generate a PDF invoice with GST for your guests. No sign-up required.' },
              { to: '/tools/gst-calculator-hotel', title: 'Hotel GST Calculator', desc: "Calculate the correct GST on your room tariff under India's 2025 rules." },
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

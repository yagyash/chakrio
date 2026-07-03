import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

const LAST_UPDATED = '4 July 2026';

export default function Terms() {
  return (
    <div className="min-h-screen text-text-1 flex flex-col" style={{ background: '#0E0B14' }}>
      <Helmet>
        <title>Terms of Service — Chakrio</title>
        <meta name="description" content="Chakrio terms of service. Understand your rights and obligations when using our property booking automation platform." />
        <link rel="canonical" href="https://chakrio.com/terms" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Terms of Service — Chakrio',
          url: 'https://chakrio.com/terms',
          dateModified: '2026-07-04',
          author: { '@type': 'Organization', name: 'Chakrio', url: 'https://chakrio.com' },
        })}</script>
      </Helmet>

      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-16 w-full flex-1">
        <h1 className="font-display font-extrabold text-3xl text-text-1 mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-text-3 text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-text-2 text-sm leading-relaxed">

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">1. Acceptance</h2>
            <p>By accessing or using Chakrio ("Service"), you agree to these Terms. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">2. Description of Service</h2>
            <p>Chakrio provides an AI-powered property booking automation system that allows property managers to record bookings, expenses, and guest communications via WhatsApp or Telegram. The Service also includes a web dashboard, monthly P&L reports, guest experience automation, and optional add-ons.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">3. Subscriptions</h2>
            <p className="mb-3">Chakrio is offered as a monthly or annual subscription per the Pricing page. You will be billed at the start of each billing period.</p>
            <p className="mb-3">You may cancel your subscription at any time via WhatsApp or email. <strong style={{ color: '#F4F1EA' }}>[YAGYA DECIDES: Does cancellation take effect immediately or at the end of the current billing period?]</strong></p>
            <p>A 14-day free trial is included on all plans. No credit card is required during the trial. If you do not cancel before day 14, you will be charged the plan rate for the first billing period.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">4. Setup Fee</h2>
            <p>A one-time setup fee is charged upon onboarding. This fee covers bot configuration, dashboard access, and a live walkthrough with your team. <strong style={{ color: '#F4F1EA' }}>[YAGYA DECIDES: Is the setup fee refundable if the client cancels within X days of onboarding?]</strong></p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">5. Add-ons & Usage-Based Charges</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong style={{ color: '#F4F1EA' }}>OTA Calendar Sync:</strong> ₹5,000/month, billed monthly. Syncs blocked dates (not rates or listing content) with Airbnb, Booking.com, MakeMyTrip, and other iCal-compatible OTAs.</li>
              <li><strong style={{ color: '#F4F1EA' }}>Guest Campaigns:</strong> ₹1 per delivered WhatsApp message (₹0.83 Meta rate + ₹0.17 Chakrio fee). Charges are deducted from your marketing wallet balance at delivery confirmation.</li>
              <li><strong style={{ color: '#F4F1EA' }}>Additional Rooms:</strong> ₹100/room/month beyond the plan's included room count.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">6. Marketing Wallet</h2>
            <p>Campaign charges are pre-loaded into a marketing wallet (Razorpay). Wallet credits are consumed per delivered message. <strong style={{ color: '#F4F1EA' }}>[YAGYA DECIDES: Can unspent wallet balance be refunded? Under what conditions?]</strong></p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">7. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the Service for unlawful purposes or spam</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the API</li>
              <li>Send marketing messages to contacts who have not opted in</li>
              <li>Impersonate Chakrio or misrepresent the Service</li>
            </ul>
            <p className="mt-3">Violation of these rules may result in immediate suspension without refund.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">8. Data Handling</h2>
            <p>We store booking data, guest contact information, and expense records on your behalf. Please review our <Link to="/privacy" style={{ color: '#C9A24B', textDecoration: 'underline' }}>Privacy Policy</Link> for full details on data collection, retention, and deletion.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">9. Limitation of Liability</h2>
            <p>Chakrio is provided "as is." We are not liable for indirect, incidental, or consequential damages arising from use of the Service, including lost bookings or revenue. Our total liability to you shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">10. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Any dispute shall be subject to the jurisdiction of courts in India.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">11. Contact</h2>
            <p>Questions about these Terms? Contact us on WhatsApp: <a href="https://wa.me/919461888529" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A24B', textDecoration: 'underline' }}>+91 94618 88529</a></p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}

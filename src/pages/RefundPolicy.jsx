import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

const LAST_UPDATED = '4 July 2026';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen text-text-1 flex flex-col" style={{ background: '#0E0B14' }}>
      <Helmet>
        <title>Refund Policy — Chakrio</title>
        <meta name="description" content="Chakrio refund and cancellation policy. Understand how subscription cancellations, setup fees, and marketing wallet credits are handled." />
        <link rel="canonical" href="https://chakrio.com/refund-policy" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Refund Policy — Chakrio',
          url: 'https://chakrio.com/refund-policy',
          dateModified: '2026-07-04',
          author: { '@type': 'Organization', name: 'Chakrio', url: 'https://chakrio.com' },
        })}</script>
      </Helmet>

      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-16 w-full flex-1">
        <h1 className="font-display font-extrabold text-3xl text-text-1 mb-2 tracking-tight">Refund Policy</h1>
        <p className="text-text-3 text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-text-2 text-sm leading-relaxed">

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">Free Trial</h2>
            <p>All plans include a 14-day free trial. You will not be charged during the trial period. If you cancel before day 14, no charge is applied and no refund is due. The trial begins when your onboarding is complete.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">Subscription Cancellations</h2>
            <p className="mb-3"><strong style={{ color: '#F4F1EA' }}>[YAGYA DECIDES: Cancellation effective date — end of current billing period or immediate?]</strong></p>
            <p>To cancel, contact us on WhatsApp at <a href="https://wa.me/919461888529" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A24B', textDecoration: 'underline' }}>+91 94618 88529</a>. We will confirm cancellation and your access end date in writing.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">Setup Fee</h2>
            <p><strong style={{ color: '#F4F1EA' }}>[YAGYA DECIDES: Is the one-time setup fee refundable? Common practice: non-refundable once onboarding begins, since we have already spent time configuring the bot and walking through the setup. Suggest: "The setup fee is non-refundable once onboarding has commenced."]</strong></p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">OTA Calendar Sync Add-on</h2>
            <p>The OTA Calendar Sync add-on (₹5,000/month) is billed monthly. If you cancel the add-on, it remains active until the end of the current billing period. No partial-month refunds.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">Marketing Wallet &amp; Campaign Charges</h2>
            <p className="mb-3">Campaign charges (₹1 per delivered message) are non-refundable once messages have been sent and delivery has been confirmed by Meta's WhatsApp Business API.</p>
            <p><strong style={{ color: '#F4F1EA' }}>[YAGYA DECIDES: Can unspent wallet balance be refunded? For example: "Unspent balance may be refunded upon written request, subject to a processing fee of ₹100" — or keep it non-refundable and credit it to future campaigns.]</strong></p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">How to Request a Refund</h2>
            <p>Contact us on WhatsApp: <a href="https://wa.me/919461888529" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A24B', textDecoration: 'underline' }}>+91 94618 88529</a>. Include your registered phone number and the charge you are disputing. We will respond within 2 business days.</p>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-text-1 text-lg mb-3">Related Policies</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><Link to="/terms" style={{ color: '#C9A24B', textDecoration: 'underline' }}>Terms of Service</Link></li>
              <li><Link to="/privacy" style={{ color: '#C9A24B', textDecoration: 'underline' }}>Privacy Policy</Link></li>
            </ul>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}

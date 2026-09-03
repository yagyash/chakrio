import { Helmet } from 'react-helmet-async';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

const GOLD = '#c8a96e';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      <Helmet>
        <title>Privacy Policy — Chakrio</title>
        <meta name="description" content="Chakrio's privacy policy. Learn how we collect, use, and protect your data." />
        <link rel="canonical" href="https://chakrio.com/privacy" />
      </Helmet>
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-14">
        <h1 className="font-display font-extrabold text-3xl text-text-1 mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-text-3 text-sm mb-10">Last updated: May 2026</p>

        <section className="space-y-8 text-text-2 text-sm leading-relaxed">

          <div>
            <h2 className="font-semibold text-text-1 text-base mb-2">1. What we collect</h2>
            <p>When you submit the lead form on our free tool pages, we collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-text-2">
              <li>Your name</li>
              <li>Your WhatsApp phone number</li>
              <li>The page you submitted from (e.g. "occupancy-calculator")</li>
              <li>The timestamp of submission</li>
            </ul>
            <p className="mt-3">We do not collect payment information, location data, or any other personal information through this form.</p>
          </div>

          <div>
            <h2 className="font-semibold text-text-1 text-base mb-2">2. How we use your data</h2>
            <p>We use your name and WhatsApp number solely to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Contact you on WhatsApp to schedule a free demo of Chakrio</li>
              <li>Send occasional product updates relevant to property management (you can opt out any time by replying "STOP")</li>
            </ul>
            <p className="mt-3">We will never sell, rent, or share your personal information with third parties for their marketing purposes.</p>
          </div>

          <div>
            <h2 className="font-semibold text-text-1 text-base mb-2">3. Data storage</h2>
            <p>Submissions are stored securely in Google Firebase (Firestore), hosted on Google Cloud infrastructure. Data is stored in the <strong className="text-text-1">us-central1</strong> region. Firebase enforces encryption at rest and in transit.</p>
          </div>

          <div>
            <h2 className="font-semibold text-text-1 text-base mb-2">4. Your rights</h2>
            <p>You may request deletion of your data at any time by emailing us. We will remove your record within 7 business days.</p>
          </div>

          <div>
            <h2 className="font-semibold text-text-1 text-base mb-2">5. Cookies</h2>
            <p>We use a single <code className="bg-surface2 px-1.5 py-0.5 rounded text-xs">localStorage</code> key (<code className="bg-surface2 px-1.5 py-0.5 rounded text-xs">chakrio_lead_captured</code>) to remember that you have already submitted the lead form, so we don't show it to you again. This is not a tracking cookie and is never shared externally.</p>
          </div>

          <div>
            <h2 className="font-semibold text-text-1 text-base mb-2">6. Contact</h2>
            <p>
              Questions or deletion requests:{' '}
              <a href="mailto:hello@chakrio.com" style={{ color: GOLD, textDecoration: 'underline' }}>
                hello@chakrio.com
              </a>
            </p>
          </div>

        </section>
      </main>

      <Footer />
    </div>
  );
}

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

const FEATURES = [
  {
    icon: '📅',
    title: 'Instant Booking Records',
    body: 'Send a message like "Rajan, 3 nights from 5th April, ₹4500 advance" — Chakrio parses it and logs the booking automatically.',
  },
  {
    icon: '❌',
    title: 'Cancellation Tracking',
    body: 'Chakrio extracts refund amounts and advance retained from cancellation messages and updates your records in real time.',
  },
  {
    icon: '💸',
    title: 'Expense Logging',
    body: 'Type "chlorine ₹850" or "plumber ₹2200" — Chakrio logs the expense instantly. No dropdowns, no category hunting.',
  },
  {
    icon: '📊',
    title: 'Monthly Reports',
    body: 'On the 1st of each month, get a full P&L — total revenue, all expenses, and net profit — sent straight to your phone.',
  },
];

const STEPS = [
  { step: '01', title: 'Send a message', body: 'You type a booking or expense in plain language to the chatbot — exactly how you would say it out loud.' },
  { step: '02', title: 'AI parses it', body: "Chakrio's AI extracts guest name, dates, amounts, and booking type — no structured input needed." },
  { step: '03', title: 'Auto-recorded', body: 'The data is recorded automatically and your dashboard updates in real time.' },
];

const TOOLS = [
  { title: 'Hotel Occupancy Rate Calculator', desc: "Calculate your property's occupancy % for any period.", href: '/tools/occupancy-calculator' },
  { title: 'Rental Income Calculator', desc: 'Estimate gross and net income from your rooms.', href: '/tools/rental-income-calculator' },
  { title: 'Cancellation Policy Generator', desc: 'Generate a professional cancellation policy in seconds.', href: '/tools/cancellation-policy' },
  { title: 'Villa & Homestay Invoice Generator', desc: 'Generate a clean PDF invoice for your guests in seconds. No sign-up required.', href: '/tools/invoice-generator' },
];

export default function LandingPage() {
  const { profileStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profileStatus === 'ready') navigate('/dashboard', { replace: true });
  }, [profileStatus, navigate]);

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>Chakrio — Property Bookings, Auto-Recorded</title>
        <meta name="description" content="Send a message, your booking is logged. Chakrio's AI records bookings, cancellations, and expenses automatically. No spreadsheets, no manual entry. Free tools for property managers." />
        <link rel="canonical" href="https://chakrio.com/" />
        <meta property="og:title" content="Chakrio — Property Bookings, Auto-Recorded" />
        <meta property="og:description" content="Send a message, your booking is logged. Chakrio's AI records everything automatically — no spreadsheets, no manual entry." />
        <meta property="og:url" content="https://chakrio.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://chakrio.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chakrio — Property Bookings, Auto-Recorded" />
        <meta name="twitter:description" content="Send a message, your booking is logged. Chakrio's AI records everything automatically." />
        <meta name="twitter:image" content="https://chakrio.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Chakrio",
          "url": "https://chakrio.com",
          "logo": {
            "@type": "ImageObject",
            "url": "https://chakrio.com/og-image.png",
            "width": 1200,
            "height": 630
          },
          "description": "Chakrio is an AI-powered property booking automation tool for homestays, villas, and guesthouses in India. Property managers record bookings, cancellations, and expenses by sending plain-language chat messages.",
          "areaServed": "IN",
          "serviceType": "Property Management Software"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Chakrio",
          "url": "https://chakrio.com",
          "description": "AI-powered property booking automation for homestays, villas, and guesthouses"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Chakrio",
          "description": "Chakrio is an AI-powered property booking automation tool. Property managers send plain-language messages via chatbot and Chakrio automatically records bookings, cancellations, and expenses to a real-time dashboard.",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://chakrio.com",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" }
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How Chakrio automates property booking records",
          "description": "Three steps to automate your property booking records using Chakrio's AI chatbot.",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Send a message", "text": "You type a booking or expense in plain language to the Chakrio chatbot — exactly how you would say it out loud." },
            { "@type": "HowToStep", "position": 2, "name": "AI parses it", "text": "Chakrio's AI extracts guest name, dates, amounts, and booking type — no structured input needed." },
            { "@type": "HowToStep", "position": 3, "name": "Auto-recorded", "text": "The data is recorded automatically and your dashboard updates in real time." }
          ]
        })}</script>
      </Helmet>
      <Navbar />
      <div className='intro text-center py-8'><h2>Welcome to Chakrio</h2><p>Chakrio is an AI-powered SaaS solution specializing in booking automation for homestays, villas, and guesthouses. Our platform parses your booking, cancellation, and expense messages to manage your property efficiently, eliminating manual data entry and spreadsheets.</p></div>
      <div className='business-clarity py-4'><p>Chakrio operates as a Software as a Service (SaaS) platform, catering primarily to property managers looking to automate their booking processes for homestays, villas, and guesthouses.</p></div>
      <div className='use-cases py-4'><h3>Use Cases</h3><p>With Chakrio, automatically reconcile cancelled bookings with refunds without manual intervention. Generate and send invoices directly from your booking messages to streamline guest transactions.</p></div>
      <div className='trust-signals text-center py-8'><h3>Trusted by Property Managers</h3><p>Join over 500 satisfied property managers who save time and reduce errors with Chakrio. [PLACEHOLDER: specific testimonial] 'Chakrio transformed our booking process — effortless and accurate!', says a delighted customer.</p></div>
      <Footer />
    </div>
  );
}

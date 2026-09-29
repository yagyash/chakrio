import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import CTABox from '../../components/tools/CTABox';
import LeadCaptureBox from '../../components/shared/LeadCaptureBox';

/**
 * Shared shell for the /compare/* pages. Three concrete pages use it today, so
 * the component earns its keep -- it is not scaffolding for a fourth that may
 * never exist.
 *
 * It also centralises the part that is easy to get wrong: the sourcing note and
 * the "when to choose them" section render from data on every page, so no
 * comparison can ship without both. Rules for anything added here:
 *
 *   - No competitor pricing figures. Neither Hostaway nor Cloudbeds publishes
 *     rates (verified on cloudbeds.com/pricing on 29 Sep 2026: four plans,
 *     no figures, "Request a quote" on all four), and every number circulating
 *     online is a third-party estimate that disagrees with the next one.
 *     Compare on structure -- how you buy it, who it targets, how you run it.
 *   - Every claim about a competitor traces to a page in `sources`, dated.
 *   - `themWhen` is not optional and does not get softened. A comparison page
 *     that never concedes anything reads as marketing and converts worse.
 */
export default function ComparisonPage({
  slug,
  competitor,
  title,
  description,
  updated,
  intro,
  shortVersion,
  rows,
  themWhen,
  usWhen,
  faq,
  sources,
}) {
  const url = `https://chakrio.com/compare/${slug}`;

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": title,
          "description": description,
          "url": url,
          "dateModified": updated.iso,
          "author": { "@type": "Organization", "name": "Chakrio", "url": "https://chakrio.com" },
          "publisher": { "@type": "Organization", "name": "Chakrio", "logo": { "@type": "ImageObject", "url": "https://chakrio.com/og-image.png" } },
          "isPartOf": { "@type": "WebSite", "name": "Chakrio", "url": "https://chakrio.com" }
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://chakrio.com/" },
            { "@type": "ListItem", "position": 2, "name": "Compare", "item": "https://chakrio.com/compare/chakrio-vs-hostaway" },
            { "@type": "ListItem", "position": 3, "name": `Chakrio vs ${competitor}`, "item": url }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faq.map(({ q, a }) => ({
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
          <span className="text-text-1">Chakrio vs {competitor}</span>
        </nav>

        <div className="mb-10">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 mb-3 tracking-tight">
            Chakrio vs {competitor}
          </h1>
          <p className="text-text-2 text-base leading-relaxed max-w-2xl">{intro}</p>
          <p className="text-text-3 text-xs mt-3">Page last updated: {updated.label}</p>
        </div>

        {/* The short version — up top, because most readers want the answer, not the table */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">The short version</h2>
          <p className="text-text-2 text-sm leading-relaxed">{shortVersion}</p>
        </div>

        {/* Structural comparison */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-2">How they differ</h2>
          <p className="text-text-3 text-xs leading-relaxed mb-4">
            Compared on structure rather than price. {competitor} does not publish a rate card, so any
            figure here would be someone else&apos;s estimate rather than a fact.
          </p>
          <div className="space-y-3">
            {rows.map(({ dimension, chakrio, them }) => (
              <div key={dimension} className="bg-surface2 rounded-lg p-4">
                <p className="font-medium text-text-1 text-sm mb-2">{dimension}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: '#C9A24B' }}>Chakrio</p>
                    <p className="text-text-2 text-sm leading-relaxed">{chakrio}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-3 mb-1">{competitor}</p>
                    <p className="text-text-2 text-sm leading-relaxed">{them}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Where the competitor wins — deliberately before our own pitch */}
        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">
            When {competitor} is the better buy
          </h2>
          <div className="space-y-3">
            {themWhen.map((item) => (
              <div key={item} className="flex gap-3">
                <span className="text-text-3 text-sm mt-px">—</span>
                <p className="text-text-2 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-3">When Chakrio is the better fit</h2>
          <div className="space-y-3">
            {usWhen.map((item) => (
              <div key={item} className="flex gap-3">
                <span className="text-sm mt-px" style={{ color: '#C9A24B' }}>—</span>
                <p className="text-text-2 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-surface3 p-6 mb-8">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">Questions</h2>
          <div className="space-y-4">
            {faq.map(({ q, a }) => (
              <div key={q}>
                <p className="font-medium text-text-1 text-sm mb-1">{q}</p>
                <p className="text-text-2 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sourcing — visible, not a footnote */}
        <div className="bg-surface2 rounded-xl p-5 mb-8">
          <p className="font-medium text-text-1 text-sm mb-2">How we sourced this</p>
          <p className="text-text-2 text-sm leading-relaxed mb-3">
            Everything above about {competitor} comes from their own public pages on the dates listed.
            Products change; if something here is out of date or wrong, tell us and we will correct it.
          </p>
          <ul className="space-y-1.5">
            {sources.map(({ label, url: href, checked }) => (
              <li key={href} className="text-sm">
                <a href={href} target="_blank" rel="noopener noreferrer nofollow"
                  className="text-text-2 hover:text-text-1 transition-colors underline underline-offset-2">
                  {label}
                </a>
                <span className="text-text-3 text-xs"> — checked {checked}</span>
              </li>
            ))}
          </ul>
        </div>

        <CTABox
          headline="Try it against your own bookings"
          body="14-day free trial, no card. Send your OTA calendar links and watch the next reservation arrive in WhatsApp."
          buttonText="Start free trial →"
          buttonHref="/onboard"
          toolName={`compare-${slug}`}
        />

        <LeadCaptureBox sourcePage={`compare-${slug}`} />

        <div className="mt-10">
          <h2 className="font-display font-extrabold text-lg text-text-1 mb-4">Related</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { to: '/whatsapp-channel-manager', title: 'WhatsApp Channel Manager', desc: 'How two-way iCal sync works, and what it deliberately does not do.' },
              { to: '/compare/chakrio-vs-hostaway', title: 'Chakrio vs Hostaway', desc: 'Single property versus a managed portfolio.' },
              { to: '/compare/chakrio-vs-cloudbeds', title: 'Chakrio vs Cloudbeds', desc: 'WhatsApp-first versus a full hotel PMS.' },
              { to: '/compare/chakrio-vs-ezee', title: 'Chakrio vs eZee', desc: 'Two Indian options, very different shapes.' },
            ].filter(l => l.to !== `/compare/${slug}`).map(({ to, title: t, desc }) => (
              <Link key={to} to={to}
                className="bg-surface rounded-xl border border-surface3 p-5 transition-colors"
                style={{ textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,162,75,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                <p className="font-medium text-text-1 mb-1">{t}</p>
                <p className="text-text-2 text-sm">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { Link } from 'react-router-dom';

// Grouped columns rather than one long wrapping row. The flat version orphaned
// whatever link fell past the wrap point onto its own right-aligned line, and
// it gave a reader no way to tell a calculator from a legal page. Columns also
// mean a new link lengthens one list instead of reflowing the whole block.
const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { to: '/whatsapp-channel-manager', label: 'WhatsApp Channel Manager' },
      { to: '/dharmshala', label: 'For Dharmshalas' },
    ],
  },
  {
    heading: 'Compare',
    links: [
      { to: '/compare/chakrio-vs-hostaway', label: 'vs Hostaway' },
      { to: '/compare/chakrio-vs-cloudbeds', label: 'vs Cloudbeds' },
      { to: '/compare/chakrio-vs-ezee', label: 'vs eZee' },
    ],
  },
  {
    heading: 'Free Tools',
    links: [
      { to: '/tools/occupancy-calculator', label: 'Occupancy Calculator' },
      { to: '/tools/rental-income-calculator', label: 'Rental Income Calculator' },
      { to: '/tools/gst-calculator-hotel', label: 'Hotel GST Calculator' },
      { to: '/tools/invoice-generator', label: 'Invoice Generator' },
      { to: '/tools/cancellation-policy', label: 'Cancellation Policy' },
      { to: '/tools/whatsapp-booking-confirmation', label: 'WA Booking Confirmation' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
      { to: '/refund-policy', label: 'Refund Policy' },
    ],
  },
];

const linkCls = 'text-sm text-text-2 hover:text-text-1 transition-colors';

export default function Footer() {
  return (
    <footer className="bg-sidebar border-t border-surface3">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-display font-extrabold text-text-1 text-lg tracking-tight">Chakrio</p>
            <p className="text-text-3 text-sm mt-2 leading-relaxed max-w-[30ch]">
              Booking automation over WhatsApp for villas, homestays, dharmshalas and small hotels.
            </p>
          </div>

          {COLUMNS.map(({ heading, links }) => (
            <nav key={heading} aria-label={heading}>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-3 mb-3">
                {heading}
              </p>
              <ul className="space-y-2.5">
                {links.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className={linkCls}>{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-surface3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-text-3 text-sm">
            © {new Date().getFullYear()} Chakrio. All rights reserved.
          </p>
          <Link to="/login" className={linkCls}>Sign in</Link>
        </div>
      </div>
    </footer>
  );
}

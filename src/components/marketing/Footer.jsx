import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-sidebar border-t border-surface3">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="text-text-3 text-sm">
            © {new Date().getFullYear()} Chakrio. All rights reserved.
          </p>
          <div className="flex flex-col gap-4 items-start sm:items-end">
            <div className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end">
              <Link to="/tools/occupancy-calculator" className="text-sm text-text-2 hover:text-text-1 transition-colors">Occupancy Calculator</Link>
              <Link to="/tools/rental-income-calculator" className="text-sm text-text-2 hover:text-text-1 transition-colors">Rental Income Calculator</Link>
              <Link to="/tools/cancellation-policy" className="text-sm text-text-2 hover:text-text-1 transition-colors">Cancellation Policy</Link>
              <Link to="/tools/invoice-generator" className="text-sm text-text-2 hover:text-text-1 transition-colors">Invoice Generator</Link>
              <Link to="/tools/whatsapp-booking-confirmation" className="text-sm text-text-2 hover:text-text-1 transition-colors">WA Booking Confirmation</Link>
              <Link to="/tools/gst-calculator-hotel" className="text-sm text-text-2 hover:text-text-1 transition-colors">Hotel GST Calculator</Link>
            </div>
            <div className="flex flex-wrap gap-5 sm:justify-end">
              <Link to="/dharmshala" className="text-sm text-text-2 hover:text-text-1 transition-colors">Dharmshalas</Link>
              <Link to="/privacy" className="text-sm text-text-2 hover:text-text-1 transition-colors">Privacy</Link>
              <Link to="/terms" className="text-sm text-text-2 hover:text-text-1 transition-colors">Terms</Link>
              <Link to="/refund-policy" className="text-sm text-text-2 hover:text-text-1 transition-colors">Refund Policy</Link>
              <Link to="/login" className="text-sm text-text-2 hover:text-text-1 transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

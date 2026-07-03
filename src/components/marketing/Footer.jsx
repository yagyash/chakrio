import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-sidebar border-t border-surface3">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="text-text-3 text-sm">
            © {new Date().getFullYear()} Chakrio. All rights reserved.
          </p>
          <div className="flex flex-col gap-3 items-start sm:items-end">
            <div className="flex flex-wrap gap-5">
              <Link to="/dharmshala" className="text-sm text-text-2 hover:text-text-1 transition-colors">Dharmshalas</Link>
              <Link to="/tools/occupancy-calculator" className="text-sm text-text-2 hover:text-text-1 transition-colors">Occupancy Calculator</Link>
              <Link to="/tools/rental-income-calculator" className="text-sm text-text-2 hover:text-text-1 transition-colors">Rental Income Calculator</Link>
              <Link to="/tools/cancellation-policy" className="text-sm text-text-2 hover:text-text-1 transition-colors">Cancellation Policy</Link>
            </div>
            <div className="flex flex-wrap gap-5">
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

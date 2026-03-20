import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-sidebar border-t border-surface3">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-text-3 text-sm">
          © {new Date().getFullYear()} Chakrio. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <Link
            to="/tools/occupancy-calculator"
            className="text-sm text-text-2 hover:text-text-1 transition-colors"
          >
            Occupancy Calculator
          </Link>
          <Link
            to="/tools/rental-income-calculator"
            className="text-sm text-text-2 hover:text-text-1 transition-colors"
          >
            Rental Income Calculator
          </Link>
          <Link
            to="/tools/cancellation-policy"
            className="text-sm text-text-2 hover:text-text-1 transition-colors"
          >
            Cancellation Policy
          </Link>
          <Link
            to="/login"
            className="text-sm text-text-2 hover:text-text-1 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}

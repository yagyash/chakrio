import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/shared/ScrollToTop';
import LoginPage from './components/auth/LoginPage';
import AppShell from './AppShell';
import { initAnalytics } from './utils/analytics';

// Lighter guard for /admin — only requires Firebase auth, not a Firestore profile.
// AdminDashboard handles its own is-admin check against the Supabase admins table.
function AdminRoute({ children }) {
  const { firebaseUser, profileStatus } = useAuthContext();
  if (profileStatus === 'loading') return null;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return children;
}
import ErrorBoundary from './components/shared/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import OnboardPage from './pages/OnboardPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import OccupancyCalculator from './pages/tools/OccupancyCalculator';
import RentalIncomeCalculator from './pages/tools/RentalIncomeCalculator';
import CancellationPolicyGenerator from './pages/tools/CancellationPolicyGenerator';
import InvoiceGenerator from './pages/tools/InvoiceGenerator';
import WhatsappBookingConfirmation from './pages/tools/WhatsappBookingConfirmation';
import GSTCalculator from './pages/tools/GSTCalculator';
import MenuPage from './pages/MenuPage';
import PropertyBookingPage from './pages/PropertyBookingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DharmshaPage from './pages/DharmshaPage';
import Terms from './pages/Terms';
import RefundPolicy from './pages/RefundPolicy';

function MetaPageView() {
  const location = useLocation();
  useEffect(() => {
    if (window.fbq) window.fbq('track', 'PageView');
  }, [location.pathname]);
  return null;
}

export default function App() {
  useEffect(() => { initAnalytics(); }, []);
  return (
    <HelmetProvider>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <MetaPageView />
        <ErrorBoundary>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboard" element={<OnboardPage />} />
          <Route path="/tools/occupancy-calculator" element={<OccupancyCalculator />} />
          <Route path="/tools/rental-income-calculator" element={<RentalIncomeCalculator />} />
          <Route path="/tools/cancellation-policy" element={<CancellationPolicyGenerator />} />
          <Route path="/tools/invoice-generator" element={<InvoiceGenerator />} />
          <Route path="/tools/whatsapp-booking-confirmation" element={<WhatsappBookingConfirmation />} />
          <Route path="/tools/gst-calculator-hotel" element={<GSTCalculator />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/dharmshala" element={<DharmshaPage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/menu/:propertyId" element={<MenuPage />} />
          <Route path="/book/:propertySlug" element={<PropertyBookingPage />} />

          {/* Admin — only requires Firebase auth, not Firestore profile */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Protected dashboard routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
    </HelmetProvider>
  );
}

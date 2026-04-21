import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import AppShell from './AppShell';
import LandingPage from './pages/LandingPage';
import OnboardPage from './pages/OnboardPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import OccupancyCalculator from './pages/tools/OccupancyCalculator';
import RentalIncomeCalculator from './pages/tools/RentalIncomeCalculator';
import CancellationPolicyGenerator from './pages/tools/CancellationPolicyGenerator';
import InvoiceGenerator from './pages/tools/InvoiceGenerator';
import MenuPage from './pages/MenuPage';

export default function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboard" element={<OnboardPage />} />
          <Route path="/tools/occupancy-calculator" element={<OccupancyCalculator />} />
          <Route path="/tools/rental-income-calculator" element={<RentalIncomeCalculator />} />
          <Route path="/tools/cancellation-policy" element={<CancellationPolicyGenerator />} />
          <Route path="/tools/invoice-generator" element={<InvoiceGenerator />} />
          <Route path="/menu/:propertyId" element={<MenuPage />} />

          {/* Admin — protected, full-page (outside AppShell) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
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
      </BrowserRouter>
    </AuthProvider>
    </HelmetProvider>
  );
}

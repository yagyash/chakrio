import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import AppShell from './AppShell';
import LandingPage from './pages/LandingPage';
import OccupancyCalculator from './pages/tools/OccupancyCalculator';
import RentalIncomeCalculator from './pages/tools/RentalIncomeCalculator';
import CancellationPolicyGenerator from './pages/tools/CancellationPolicyGenerator';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tools/occupancy-calculator" element={<OccupancyCalculator />} />
          <Route path="/tools/rental-income-calculator" element={<RentalIncomeCalculator />} />
          <Route path="/tools/cancellation-policy" element={<CancellationPolicyGenerator />} />

          {/* Protected routes */}
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
  );
}

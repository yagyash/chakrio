import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import PropertyPicker from './components/shared/PropertyPicker';

// Homestay templates
import HomestayDashboard from './templates/homestay/Dashboard';
import Bookings from './templates/homestay/Bookings';
import Expenses from './templates/homestay/Expenses';
import Reports from './templates/homestay/Reports';

// Bakery placeholder
import BakeryComingSoon from './templates/bakery/index';

/**
 * Main authenticated shell.
 * - If user has multiple properties and none selected → show PropertyPicker
 * - Otherwise → render sidebar + topbar + dashboard routes
 */
export default function AppShell() {
  const { userProfile, selectedProperty, properties } = useAuthContext();
  const { pathname } = useLocation();
  const businessType = userProfile?.business_type ?? 'homestay';
  const PROPERTY_TYPES = ['homestay', 'hotel', 'villa', 'dharmshala'];
  const resolvedType = PROPERTY_TYPES.includes(businessType) ? 'homestay' : businessType;

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 1200);
  };

  // Show property picker when no property is selected
  // (happens when user has multiple properties and hasn't chosen one yet)
  if (!selectedProperty && properties.length !== 1) {
    return <PropertyPicker />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f0e17' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onRefresh={handleRefresh} refreshing={refreshing} />

        <main className="flex-1 overflow-hidden flex flex-col animate-fade-in" key={`${pathname}-${refreshKey}`}>
          {resolvedType === 'homestay' && (
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<HomestayDashboard />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          )}

          {resolvedType === 'bakery' && (
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<BakeryComingSoon />} />
              <Route path="/sales" element={<BakeryComingSoon />} />
              <Route path="/expenses" element={<BakeryComingSoon />} />
              <Route path="/reports" element={<BakeryComingSoon />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          )}

          {resolvedType !== 'homestay' && resolvedType !== 'bakery' && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Unknown business type: <code className="ml-1 bg-gray-100 px-1 rounded">{businessType}</code>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

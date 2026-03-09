import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import AccountPendingPage from '../shared/AccountPendingPage';

/**
 * Wraps a route that requires authentication.
 * - Shows spinner while auth is loading
 * - Redirects to /login if unauthenticated
 * - Shows AccountPendingPage if Firestore profile is missing
 * - Renders children when profile is ready
 */
export default function ProtectedRoute({ children }) {
  const { firebaseUser, profileStatus } = useAuthContext();

  if (profileStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!firebaseUser || profileStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (profileStatus === 'pending' || profileStatus === 'error') {
    return <AccountPendingPage />;
  }

  return children;
}

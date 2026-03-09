import { useAuthContext } from '../../context/AuthContext';

export default function AccountPendingPage() {
  const { logout } = useAuthContext();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-3">Account Setup Pending</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Your account is being set up. Please contact your administrator to get access to your dashboard.
          </p>

          <button
            onClick={logout}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-700 active:bg-gray-800
              text-white text-sm font-medium rounded-lg
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

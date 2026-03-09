export default function BakeryComingSoon() {
  return (
    <div className="flex-1 flex items-center justify-center py-20 px-6">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mb-6">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bakery Dashboard</h2>
        <p className="text-gray-500 text-sm">
          The Bakery template is coming in Phase 2. Stay tuned!
        </p>
      </div>
    </div>
  );
}

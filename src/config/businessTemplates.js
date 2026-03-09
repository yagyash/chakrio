/**
 * Central registry of business types and their navigation configs.
 * Add new business types here for Phase 2+.
 */
const businessTemplates = {
  homestay: {
    label: 'Homestay / Villa',
    nav: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Bookings', path: '/bookings' },
      { label: 'Expenses', path: '/expenses' },
      { label: 'Reports', path: '/reports' },
    ],
  },
  bakery: {
    label: 'Bakery',
    nav: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Sales', path: '/sales' },
      { label: 'Expenses', path: '/expenses' },
      { label: 'Reports', path: '/reports' },
    ],
  },
};

export default businessTemplates;

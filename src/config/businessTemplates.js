/**
 * Central registry of business types and their navigation configs.
 * minPlan: minimum plan required to access the route. Absent = all plans.
 */
const businessTemplates = {
  homestay: {
    label: 'Homestay / Villa',
    nav: [
      { label: 'Dashboard',  path: '/dashboard'  },
      { label: 'Bookings',   path: '/bookings'   },
      { label: 'Calendar',   path: '/calendar'   },
      { label: 'Expenses',   path: '/expenses'   },
      { label: 'Reports',    path: '/reports'    },
      { label: 'Guests',     path: '/guests',    minPlan: 'lite' },
      { label: 'Marketing',  path: '/campaigns', minPlan: 'lite' },
      { label: 'Enquiries',  path: '/enquiries', minPlan: 'lite' },
      { label: 'Menu',       path: '/menu',      minPlan: 'pro'  },
      { label: 'Settings',   path: '/settings'   },
    ],
  },
  hotel: {
    label: 'Hotel',
    nav: [
      { label: 'Dashboard',  path: '/dashboard'  },
      { label: 'Bookings',   path: '/bookings'   },
      { label: 'Calendar',   path: '/calendar'   },
      { label: 'Expenses',   path: '/expenses'   },
      { label: 'Reports',    path: '/reports'    },
      { label: 'Guests',     path: '/guests',    minPlan: 'lite' },
      { label: 'Marketing',  path: '/campaigns', minPlan: 'lite' },
      { label: 'Enquiries',  path: '/enquiries', minPlan: 'lite' },
      { label: 'Menu',       path: '/menu',      minPlan: 'pro'  },
      { label: 'Settings',   path: '/settings'   },
    ],
  },
  villa: {
    label: 'Villa',
    nav: [
      { label: 'Dashboard',  path: '/dashboard'  },
      { label: 'Bookings',   path: '/bookings'   },
      { label: 'Calendar',   path: '/calendar'   },
      { label: 'Expenses',   path: '/expenses'   },
      { label: 'Reports',    path: '/reports'    },
      { label: 'Guests',     path: '/guests',    minPlan: 'lite' },
      { label: 'Marketing',  path: '/campaigns', minPlan: 'lite' },
      { label: 'Enquiries',  path: '/enquiries', minPlan: 'lite' },
      { label: 'Menu',       path: '/menu',      minPlan: 'pro'  },
      { label: 'Settings',   path: '/settings'   },
    ],
  },
  dharmshala: {
    label: 'Dharmshala',
    nav: [
      { label: 'Dashboard',  path: '/dashboard'  },
      { label: 'Bookings',   path: '/bookings'   },
      { label: 'Calendar',   path: '/calendar'   },
      { label: 'Expenses',   path: '/expenses'   },
      { label: 'Reports',    path: '/reports'    },
      { label: 'Guests',     path: '/guests',    minPlan: 'lite' },
      { label: 'Marketing',  path: '/campaigns', minPlan: 'lite' },
      { label: 'Enquiries',  path: '/enquiries', minPlan: 'lite' },
      { label: 'Menu',       path: '/menu',      minPlan: 'pro'  },
      { label: 'Settings',   path: '/settings'   },
    ],
  },
  bakery: {
    label: 'Bakery',
    nav: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Sales',     path: '/sales'     },
      { label: 'Expenses',  path: '/expenses'  },
      { label: 'Reports',   path: '/reports'   },
    ],
  },
};

export default businessTemplates;

/**
 * Central registry of business types and their navigation configs.
 * Add new business types here for Phase 2+.
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
      { label: 'Menu',       path: '/menu'       },
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
      { label: 'Menu',       path: '/menu'       },
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
      { label: 'Menu',       path: '/menu'       },
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
      { label: 'Menu',       path: '/menu'       },
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

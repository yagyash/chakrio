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
      { label: 'Campaigns',  path: '/campaigns'  },
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
      { label: 'Menu',       path: '/menu'       },
      { label: 'Campaigns',  path: '/campaigns'  },
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
      { label: 'Menu',       path: '/menu'       },
      { label: 'Campaigns',  path: '/campaigns'  },
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
      { label: 'Menu',       path: '/menu'       },
      { label: 'Campaigns',  path: '/campaigns'  },
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

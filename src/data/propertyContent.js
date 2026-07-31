/**
 * Static, hand-authored per-property content for the direct-booking pages
 * (/book/:propertySlug). Deliberately genuine, property-specific copy — not
 * a templated block with the name swapped in — since a templated set of
 * pages needs real per-page uniqueness to avoid reading as thin/duplicate
 * content at scale (see the seo-programmatic skill guidance this was built
 * against).
 *
 * Live data (rates, availability, photos) comes from the backend at
 * request/render time — see services/directBooking.js. This file is only
 * the descriptive content a backend row can't provide.
 *
 * backendSlug must match chakrio-agent's properties.property_id exactly —
 * confirm it's actually "niva" before relying on this in production.
 */
export const PROPERTY_CONTENT = {
  'niva-the-rooted-heaven-udaipur': {
    backendSlug: 'niva',
    displayName: 'Niva – The Rooted Heaven',
    locality: 'Udaipur, Rajasthan',
    fullAddress: 'Near Morwaniya Village, Udaipur, Rajasthan 313011, India',
    phone: '+918553071171',
    email: 'booking@nivavilla.com',
    geo: { lat: 24.619677, lng: 73.608706 },
    // 134-167 word self-contained passage, front-loaded on the page — the
    // block most likely to get lifted directly into an AI Overview or
    // ChatGPT answer for "private villa near Udaipur".
    about: `Niva – The Rooted Heaven is a private luxury villa near Morwaniya village in the Aravalli hills, about 25–30 km (35–45 minutes by car) from Udaipur city centre. The entire property is booked to one group at a time — two en-suite bedrooms with sunken bathtubs, a private pool, a mountain-view rooftop terrace, and a bonfire area, with no shared spaces or overlapping guests. Stone construction and open courtyards keep the design rooted in its surroundings, with unobstructed Aravalli views from every room. A dedicated host and daily breakfast are included. City Palace and Lake Pichola are both about 17 km away, Fateh Sagar Lake 14 km, Sajjangarh (Monsoon Palace) 13.6 km, and Udaipur's Maharana Pratap Airport around 40 km (50–60 minutes).`,
    amenities: [
      '2 en-suite bedrooms with sunken bathtubs',
      'Private outdoor swimming pool',
      'Mountain-view rooftop terrace',
      'Bonfire area with outdoor seating',
      'Fully equipped kitchen',
      'High-speed WiFi',
      'On-site parking',
      'Dedicated host & daily breakfast',
    ],
    nearby: [
      { name: 'City Palace', distance: '17 km' },
      { name: 'Lake Pichola', distance: '17 km' },
      { name: 'Fateh Sagar Lake', distance: '14 km' },
      { name: 'Sajjangarh (Monsoon Palace)', distance: '13.6 km' },
      { name: 'Udaipur Airport', distance: '40 km' },
    ],
    metaDescription:
      'Private luxury villa near Udaipur with a private pool, mountain-view terrace and en-suite sunken bathtubs. Booked to one group at a time. Book direct.',
  },
};

export function getPropertyContent(propertySlug) {
  return PROPERTY_CONTENT[propertySlug] || null;
}

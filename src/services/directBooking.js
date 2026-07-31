/**
 * Client for chakrio-agent's public direct-booking endpoints
 * (routers/direct_booking.py). Called directly from the browser — these
 * routes are deliberately public/no-auth, and main.py's CORS policy allows
 * chakrio.com specifically for this.
 */
const AGENT_BASE_URL = import.meta.env.VITE_AGENT_BASE_URL || 'https://bot.chakrio.com';

async function request(path, options) {
  const res = await fetch(`${AGENT_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

/** {property_name, has_rooms, rates: [{room_type, price_per_night, capacity}], photos: [url]} */
export function getPropertyInfo(propertySlug) {
  return request(`/book/${propertySlug}`);
}

/** {available, available_count, nights, price_per_night, total_price} */
export function getAvailability(propertySlug, { roomType, checkIn, checkOut }) {
  const params = new URLSearchParams({ room_type: roomType, check_in: checkIn, check_out: checkOut });
  return request(`/book/${propertySlug}/availability?${params}`);
}

/** {group_id, payment_method: 'upi'|'razorpay', upi_uri?, payment_url?, amount, expires_at} */
export function reserve(propertySlug, { rooms, checkIn, checkOut, guestName, guestPhone }) {
  return request(`/book/${propertySlug}/reserve`, {
    method: 'POST',
    body: JSON.stringify({
      rooms, check_in: checkIn, check_out: checkOut, guest_name: guestName, guest_phone: guestPhone,
    }),
  });
}

/** UPI-method properties only — guest self-report after paying. {status: 'confirmed'} */
export function confirmUpiPayment(propertySlug, groupId) {
  return request(`/book/${propertySlug}/confirm-payment`, {
    method: 'POST',
    body: JSON.stringify({ group_id: groupId }),
  });
}

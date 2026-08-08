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
  if (!res.ok) {
    // FastAPI's own request-validation errors (422, e.g. a missing/too-short
    // field) return detail as an ARRAY of {msg, loc, ...} objects, not a
    // string — new Error(array) silently stringifies to "[object Object]".
    // HTTPException(...) calls elsewhere in the API already send a plain
    // string, so handle both shapes.
    const detail = Array.isArray(data.detail)
      ? data.detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
      : data.detail;
    throw new Error(detail || 'Request failed');
  }
  return data;
}

/**
 * {property_name, has_rooms, max_capacity, photos: [url], rates,
 * id_upload_form_url?} — id_upload_form_url is the property's own Google
 * Form for optional guest ID upload; absent/empty if the property hasn't
 * set one up.
 */
export function getPropertyInfo(propertySlug) {
  return request(`/book/${propertySlug}`);
}

/** {available, available_count, nights, price_per_night, total_price} */
export function getAvailability(propertySlug, { roomType, partySize, checkIn, checkOut }) {
  const params = new URLSearchParams({ check_in: checkIn, check_out: checkOut });
  if (roomType) params.set('room_type', roomType);
  if (partySize) params.set('party_size', partySize);
  return request(`/book/${propertySlug}/availability?${params}`);
}

/** {group_id, payment_method: 'upi'|'razorpay', upi_uri?, payment_url?, amount, expires_at} */
export function reserve(propertySlug, { rooms, partySize, checkIn, checkOut, guestName, guestPhone, idUploaded }) {
  return request(`/book/${propertySlug}/reserve`, {
    method: 'POST',
    body: JSON.stringify({
      rooms, party_size: partySize, check_in: checkIn, check_out: checkOut,
      guest_name: guestName, guest_phone: guestPhone, id_uploaded: idUploaded,
    }),
  });
}

/**
 * UPI-method properties only — guest self-report after paying, with a UTR
 * as evidence. {status: 'pending_verification'} — the booking is created
 * immediately but the property manager must verify the UTR and reply
 * CONFIRM/DECLINE before it's real (see routers/direct_booking.py).
 */
export function confirmUpiPayment(propertySlug, groupId, utr) {
  return request(`/book/${propertySlug}/confirm-payment`, {
    method: 'POST',
    body: JSON.stringify({ group_id: groupId, utr }),
  });
}

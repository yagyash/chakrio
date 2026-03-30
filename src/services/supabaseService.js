/**
 * Supabase data service for the Chakrio dashboard.
 *
 * All Supabase reads go through the /api/data backend route — the browser
 * never contacts Supabase directly and never holds a Supabase key.
 *
 * The frontend sends a Firebase ID token; the backend verifies it server-side
 * and fetches from Supabase using the service role key.
 *
 * Returns rows with the same column names as googleSheets.js so all
 * existing table components and formatCell functions work unchanged.
 */

import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';

// ------------------------------------------------------------------
// Internal fetch — calls the Vercel API route with a Firebase token
// ------------------------------------------------------------------

async function apiFetch(propertyUuid, tab) {
  if (!auth.currentUser) {
    throw new Error('Unable to load data. Please sign in again.');
  }

  let token;
  try {
    token = await getIdToken(auth.currentUser);
  } catch {
    throw new Error('Unable to load data. Please sign in again.');
  }

  let res;
  try {
    res = await fetch(
      `/api/data?propertyId=${encodeURIComponent(propertyUuid)}&tab=${encodeURIComponent(tab)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    throw new Error('Unable to load data. Please try again.');
  }

  if (!res.ok) {
    throw new Error('Unable to load data. Please try again.');
  }

  return res.json();
}

// ------------------------------------------------------------------
// Column mappers — Supabase snake_case → Sheets-style names
// ------------------------------------------------------------------

function toSheetBooking(row) {
  return {
    'Booking ID':     row.booking_ref    ?? '',
    'Guest Name':     row.guest_name     ?? '',
    'Check-in':       row.check_in       ?? '',
    'Check-out':      row.check_out      ?? '',
    'No_of_Nights':   row.no_of_nights   ?? '',
    'Total_Amount':   row.total_amount   ?? '',
    'Advance_Amount': row.advance_amount ?? '',
    'Balance_Amount': row.balance_amount ?? '',
    'Status':         row.status         ?? '',
    'Room_No':        row.room_no        ?? '',
    'Room_Type':      row.room_type      ?? '',
    'Refund_Amount':  row.refund_amount  ?? '',
    'updated_at':     row.updated_at     ?? '',
  };
}

function toSheetExpense(row) {
  return {
    'Expense_id':  row.expense_ref ?? '',
    'Date':        row.date        ?? '',
    'Category':    row.category    ?? '',
    'Description': row.description ?? '',
    'Amount':      row.amount      ?? '',
  };
}

function toSheetSummary(row) {
  // Reconstruct the M//YYYY key format used throughout the dashboard
  return {
    'Month':           `${row.month}//${row.year}`,
    'Monthly Revenue': row.monthly_revenue ?? '',
    'Monthly Expense': row.monthly_expense ?? '',
    'Net Profit':      row.net_profit      ?? '',
    'Booking Count':   row.booking_count   ?? '',
  };
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Fetch data for a given tab via the backend API.
 * Tab name is matched case-insensitively so custom tab name overrides still work.
 *
 * @param {string} propertyUuid  - Supabase property UUID (from Firestore supabase_property_id)
 * @param {string} tabName       - Tab name (e.g. "Bookings", "Expenses", "Summary")
 * @returns {Promise<Array>}     - Array of row objects with Sheets-style column names
 */
export async function fetchSupabaseTab(propertyUuid, tabName) {
  const tab = tabName.toLowerCase();

  if (tab.includes('booking')) {
    const rows = await apiFetch(propertyUuid, 'bookings');
    return rows.map(toSheetBooking);
  }

  if (tab.includes('expense')) {
    const rows = await apiFetch(propertyUuid, 'expenses');
    return rows.map(toSheetExpense);
  }

  if (tab.includes('summary') || tab.includes('report')) {
    const rows = await apiFetch(propertyUuid, 'summary');
    return rows.map(toSheetSummary);
  }

  // Financials tab — not yet in Supabase; return empty (shows empty table, no error)
  return [];
}

/** Always true — backend API is always available when deployed */
export function isSupabaseConfigured() {
  return true;
}

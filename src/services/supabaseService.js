/**
 * Supabase read-only data service for the Chakrio dashboard.
 *
 * Uses the Supabase REST API directly (no SDK) with the anon key.
 * Returns rows with the same column names as googleSheets.js so all
 * existing table components and formatCell functions work unchanged.
 *
 * Only properties with a supabase_property_id in their Firestore profile
 * use this service — all others still go through googleSheets.js.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const MAX_ROWS = 2000;

async function supabaseFetch(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params}&limit=${MAX_ROWS}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${res.statusText || 'request failed'}`);
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
 * Fetch data for a given tab name from Supabase.
 * Tab name is matched case-insensitively so custom tab name overrides still work.
 *
 * @param {string} propertyUuid  - Supabase property UUID (from Firestore supabase_property_id)
 * @param {string} tabName       - Tab name (e.g. "Bookings", "Expenses", "Summary")
 * @returns {Promise<Array>}     - Array of row objects with Sheets-style column names
 */
export async function fetchSupabaseTab(propertyUuid, tabName) {
  const tab = tabName.toLowerCase();

  if (tab.includes('booking')) {
    const rows = await supabaseFetch(
      'bookings',
      `?property_id=eq.${propertyUuid}&select=*&order=check_in.desc`
    );
    return rows.map(toSheetBooking);
  }

  if (tab.includes('expense')) {
    const rows = await supabaseFetch(
      'expenses',
      `?property_id=eq.${propertyUuid}&select=*&order=date.desc`
    );
    return rows.map(toSheetExpense);
  }

  if (tab.includes('summary') || tab.includes('report')) {
    const rows = await supabaseFetch(
      'monthly_summary',
      `?property_id=eq.${propertyUuid}&select=*&order=year.desc,month.desc`
    );
    return rows.map(toSheetSummary);
  }

  // Financials tab — not yet in Supabase; return empty (shows empty table, no error)
  return [];
}

/** Returns true when Supabase env vars are configured */
export function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

import { useAuthContext } from '../context/AuthContext';

/**
 * Returns the Google Sheet tab names for the currently selected property.
 *
 * Override per-property in Firestore by adding a `tabs` field to the
 * property object:
 *   { id, property_name, sheet_id,
 *     tabs: { bookings: "My Bookings", expenses: "Costs",
 *             financials: "Finance", summary: "P&L" } }
 *
 * If `tabs` is absent the classic defaults are used so existing setups
 * continue to work without any Firestore changes.
 */
export function useTabNames() {
  const { selectedProperty } = useAuthContext();
  const tabs = selectedProperty?.tabs ?? {};
  return {
    bookingsTab:   tabs.bookings   ?? 'Bookings',
    expensesTab:   tabs.expenses   ?? 'Expenses',
    financialsTab: tabs.financials ?? 'Financials',
    summaryTab:    tabs.summary    ?? 'Summary',
  };
}

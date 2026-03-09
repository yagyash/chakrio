const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

// Cap rows to prevent excessive memory usage from large sheets
const MAX_ROWS = 2000;

/**
 * Validate a tab name — allow letters, numbers, spaces, and common
 * punctuation used in sheet tab names. Rejects anything that looks
 * like an injection attempt.
 */
function isValidTabName(name) {
  return (
    typeof name === 'string' &&
    name.trim().length > 0 &&
    name.length <= 100 &&
    /^[\w\s\-()/&.,]+$/.test(name)
  );
}

/**
 * Convert a 2D array from Sheets API into array of objects
 * using the first row as keys. Truncates oversized cell values.
 */
function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const [headers, ...dataRows] = rows.slice(0, MAX_ROWS + 1);
  return dataRows.map((row) =>
    headers.reduce((obj, header, i) => {
      const raw = row[i] ?? '';
      obj[String(header).slice(0, 100)] = String(raw).slice(0, 500);
      return obj;
    }, {})
  );
}

/**
 * Fetch a single tab range from Google Sheets.
 * Returns [] when running without an API key or sheet ID (no-sheet mode).
 * Throws on API errors so callers can surface them to the user.
 */
export async function fetchSheetData(sheetId, tabName, range = '') {
  if (!isValidTabName(tabName)) {
    return [];
  }

  if (!API_KEY || !sheetId) {
    return [];
  }

  // Validate sheetId format (Google Sheet IDs are alphanumeric + hyphens/underscores)
  if (!/^[\w-]{10,60}$/.test(sheetId)) {
    return [];
  }

  const fullRange = range ? `${tabName}!${range}` : tabName;
  const url = `${BASE_URL}/${sheetId}/values/${encodeURIComponent(fullRange)}?key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sheets API ${res.status}: ${res.statusText || 'request failed'}`);
  }
  const json = await res.json();
  return rowsToObjects(json.values);
}

/**
 * Fetch multiple tabs in parallel.
 * Returns an object keyed by tab name.
 */
export async function fetchMultipleTabs(sheetId, tabsArray) {
  const safeTabs = tabsArray.filter((t) => isValidTabName(t));
  const results = await Promise.all(
    safeTabs.map((tab) => fetchSheetData(sheetId, tab))
  );
  return Object.fromEntries(safeTabs.map((tab, i) => [tab, results[i]]));
}

/** Returns true when the app is running without an API key */
export function isDemoMode() {
  return !API_KEY;
}

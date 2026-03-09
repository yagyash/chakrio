/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 * Columns are derived from the keys of the first row.
 */
export function downloadCSV(data, filename) {
  if (!data.length) return;

  const cols = Object.keys(data[0]);

  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const header = cols.map(escape).join(',');
  const rows   = data.map((row) => cols.map((c) => escape(row[c])).join(','));
  const csv    = [header, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

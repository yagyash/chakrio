const BADGE_MAP = [
  { test: /confirm|approv|active/,         bg: '#dbeafe', color: '#1d4ed8' }, // blue
  { test: /cancel|reject|declin|denied/,   bg: '#fee2e2', color: '#dc2626' }, // red
  { test: /complet|checked.?out|done|finish/, bg: '#f3f4f6', color: '#6b7280' }, // grey
  { test: /pending|hold|waiting|tentative/, bg: '#fef9c3', color: '#a16207' }, // amber
  { test: /no.?show/,                       bg: '#f3e8ff', color: '#7c3aed' }, // purple
];

export default function StatusBadge({ value }) {
  const key = String(value || '').toLowerCase();
  const match = BADGE_MAP.find(({ test }) => test.test(key));
  const bg    = match?.bg    ?? '#f1f5f9';
  const color = match?.color ?? '#64748b';

  return (
    <span style={{
      background: bg,
      color,
      padding: '2px 10px',
      borderRadius: 9999,
      fontSize: 11,
      fontWeight: 600,
      display: 'inline-block',
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>
      {value || '—'}
    </span>
  );
}

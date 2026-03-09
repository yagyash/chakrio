/**
 * Reusable stat card used across Dashboard, Financials, etc.
 * @param {string} title
 * @param {string|number} value
 * @param {string} [subtitle]
 * @param {React.ReactNode} [icon]
 * @param {'teal'|'amber'|'red'|'blue'} [accent]
 */
export default function StatCard({ title, value, subtitle, icon, accent = 'teal' }) {
  const accentMap = {
    teal:  { bg: 'rgba(124,106,245,0.12)', color: '#a896f8' },
    amber: { bg: 'rgba(200,169,110,0.12)', color: '#c8a96e' },
    red:   { bg: 'rgba(224,112,112,0.12)', color: '#e07070' },
    blue:  { bg: 'rgba(78,205,196,0.12)',  color: '#4ecdc4' },
  };
  const { bg, color } = accentMap[accent] ?? accentMap.teal;

  return (
    <div style={{
      background: '#16151f',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
    }}>
      {icon && (
        <div style={{
          padding: '10px',
          borderRadius: '10px',
          background: bg,
          color: color,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '12px', color: '#8c8a9e', fontWeight: 500, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
        <p style={{ fontSize: '24px', fontWeight: 600, color: '#f0eee8', margin: '4px 0 0' }}>{value}</p>
        {subtitle && <p style={{ fontSize: '12px', color: '#56546a', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

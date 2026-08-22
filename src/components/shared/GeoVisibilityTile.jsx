import { useGeoTile } from '../../hooks/useGeoTile';

const GREEN = '#5cb88a';
const AMBER = '#e8a86a';
const DIM   = 'rgba(255,255,255,0.12)';

function rankColor(point) {
  if (point.rank == null) return DIM;         // not found in this search
  if (point.rank <= 3) return GREEN;          // top 3
  return AMBER;                                // found, outside top 3
}

/**
 * Owner-facing tile: a plain sentence first, data underneath. No scores,
 * no GEO/AIO/SEO vocabulary, no vendor branding — an owner should never
 * see the word "Sitrelio" here.
 *
 * Entitlement is decided server-side (chakrio-agent's routers/geo.py) —
 * this component only checks whether a section is present in the
 * response and renders it. It never asks what plan the property is on.
 * When a property's flag is off, the API returns { enabled: false } and
 * this renders nothing at all — no teaser, no upsell.
 */
export default function GeoVisibilityTile() {
  const { data, loading } = useGeoTile();

  if (loading || !data?.enabled || data.error) return null;

  const { ai_mentions: ai, grid, fix_history: fixes } = data;

  return (
    <div className="animate-fade-in-up">
      <h2 style={{ fontSize: '11px', fontWeight: 600, color: '#56546a', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '12px' }}>
        Visibility
      </h2>

      <div style={{ background: '#16151f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }} className="card-hover">

        {/* Headline sentence */}
        {ai && (
          <p style={{ fontSize: '15px', color: '#f0eee8', margin: '0 0 20px', lineHeight: 1.5 }}>
            In the last 30 days, AI assistants recommended your property{' '}
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#a896f8' }}>
              {ai.mentions_last_30_days}
            </span>{' '}
            time{ai.mentions_last_30_days === 1 ? '' : 's'}.
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-6">

          {/* Local ranking */}
          {grid && (
            <div>
              <p style={{ fontSize: '13px', color: '#dfe9e4', margin: '0 0 10px', lineHeight: 1.5 }}>
                You appear in the top 3 from{' '}
                <span style={{ fontWeight: 600, color: '#f0eee8' }}>{grid.top3_points}</span> of{' '}
                <span style={{ fontWeight: 600, color: '#f0eee8' }}>{grid.total_points}</span> nearby search points
                {grid.keyword ? <> for "<span style={{ color: '#8c8a9e' }}>{grid.keyword}</span>"</> : null}.
              </p>
              {grid.points?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {grid.points.map((pt, i) => (
                    <span
                      key={i}
                      title={pt.rank != null ? `Rank ${pt.rank}` : 'Not found'}
                      style={{ width: '11px', height: '11px', borderRadius: '3px', background: rankColor(pt), display: 'inline-block' }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI mentions */}
          {ai && (
            <div>
              <p style={{ fontSize: '13px', color: '#dfe9e4', margin: '0 0 10px', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: '#f0eee8' }}>{ai.mentions_this_month}</span> mention{ai.mentions_this_month === 1 ? '' : 's'} this month
                {' · '}
                <span style={{ color: '#8c8a9e' }}>{ai.mentions_last_month} last month</span>
              </p>
              {ai.assistants_mentioning?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ai.assistants_mentioning.map(name => (
                    <span key={name} style={{
                      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: 500, background: 'rgba(124,106,245,0.12)', color: '#a896f8',
                    }}>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Fixes applied — only shown once there's something to show */}
        {fixes?.length > 0 && (
          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: '12px', color: '#56546a', margin: '0 0 8px' }}>
              {fixes.length} website fix{fixes.length === 1 ? '' : 'es'} applied automatically
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

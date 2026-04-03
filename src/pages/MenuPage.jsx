/**
 * Public menu page — accessible without login.
 * URL: /menu/:propertyId
 *
 * Reads from Firestore: menus/{propertyId}/items
 * Requires Firestore rule:
 *   match /menus/{propertyId}/items/{itemId} {
 *     allow read: if true;
 *   }
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts', 'Specials'];

function groupByCategory(items) {
  const order = [...CATEGORIES, 'Other'];
  const grouped = {};
  items.forEach(item => {
    const cat = CATEGORIES.includes(item.category) ? item.category : 'Other';
    (grouped[cat] = grouped[cat] || []).push(item);
  });
  return order.filter(cat => grouped[cat]?.length).map(cat => ({ cat, items: grouped[cat] }));
}

export default function MenuPage() {
  const { propertyId } = useParams();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('all'); // 'all' | 'veg' | 'non-veg'

  useEffect(() => {
    if (!propertyId) return;
    const colRef = collection(db, 'menus', propertyId, 'items');
    const unsub = onSnapshot(
      colRef,
      snap => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => {
        setError('Failed to load menu. Please try again.');
        setLoading(false);
      }
    );
    return unsub;
  }, [propertyId]);

  const visibleItems = items.filter(item => {
    if (item.available === false) return false;
    if (filter === 'veg') return item.isVeg === true;
    if (filter === 'non-veg') return item.isVeg === false;
    return true;
  });

  const grouped = groupByCategory(visibleItems);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0e17', color: '#f0eee8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1830 0%, #16151f 100%)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '24px 20px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c6af5,#a896f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              🍽️
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#6C63FF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Digital Menu
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', margin: '8px 0 4px' }}>
            Our Menu
          </h1>
          <p style={{ fontSize: '13px', color: '#56546a', margin: 0 }}>
            All prices are inclusive of taxes
          </p>
        </div>
      </div>

      {/* Filter pills */}
      {!loading && items.length > 0 && (
        <div style={{ background: '#16151f', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '8px' }}>
            {[
              { key: 'all',     label: 'All' },
              { key: 'veg',     label: '🟢 Veg' },
              { key: 'non-veg', label: '🔴 Non-Veg' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  background: filter === f.key ? '#6C63FF' : 'rgba(255,255,255,0.07)',
                  color: filter === f.key ? '#fff' : '#8c8a9e',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#56546a' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⏳</div>
            <p style={{ fontSize: '14px' }}>Loading menu…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#e07070' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
            <p style={{ fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#56546a' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🍽️</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#8c8a9e', marginBottom: '6px' }}>Menu coming soon</p>
            <p style={{ fontSize: '13px' }}>Please ask at the front desk</p>
          </div>
        )}

        {/* No results from filter */}
        {!loading && !error && items.length > 0 && visibleItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#56546a' }}>
            <p style={{ fontSize: '14px' }}>No items match this filter</p>
            <button onClick={() => setFilter('all')} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#6C63FF', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
              Show all
            </button>
          </div>
        )}

        {/* Menu sections */}
        {grouped.map(({ cat, items: catItems }) => (
          <div key={cat} style={{ marginBottom: '32px' }}>
            {/* Category header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#6C63FF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                {cat}
              </h2>
              <div style={{ flex: 1, height: '1px', background: 'rgba(108,99,255,0.2)' }} />
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {catItems.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px',
                    background: idx % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent',
                    borderRadius: '10px',
                  }}
                >
                  {/* Veg/non-veg dot */}
                  <div style={{
                    width: '14px', height: '14px', flexShrink: 0,
                    border: `2px solid ${item.isVeg ? '#22c55e' : '#ef4444'}`,
                    borderRadius: '2px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: item.isVeg ? '#22c55e' : '#ef4444',
                    }} />
                  </div>

                  {/* Name + description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#f0eee8', lineHeight: '1.3' }}>
                      {item.name}
                    </div>
                    {item.description && (
                      <div style={{ fontSize: '12px', color: '#56546a', marginTop: '2px' }}>
                        {item.description}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f0eee8', flexShrink: 0 }}>
                    ₹{item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        {!loading && items.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '11px', color: '#56546a' }}>Powered by Chakrio</p>
          </div>
        )}

      </div>
    </div>
  );
}

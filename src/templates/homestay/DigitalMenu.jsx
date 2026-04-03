/**
 * Digital Menu — dashboard tab for managing the property's digital menu.
 *
 * Data is stored in Firestore:
 *   menus/{propertyId}/items/{itemId}
 *
 * IMPORTANT: Firestore rules must allow authenticated writes to this path:
 *   match /menus/{propertyId}/items/{itemId} {
 *     allow read: if true;
 *     allow write: if request.auth != null;
 *   }
 *
 * Public menu URL: /menu/{propertyId}
 * QR code points to that URL so guests can scan it.
 */
import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, X, QrCode, Download, Edit2, Check } from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts', 'Specials'];

const EMPTY_FORM = {
  name: '',
  category: 'Snacks',
  price: '',
  isVeg: true,
  description: '',
  available: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByCategory(items) {
  const order = [...CATEGORIES, 'Other'];
  const grouped = {};
  items.forEach(item => {
    const cat = CATEGORIES.includes(item.category) ? item.category : 'Other';
    (grouped[cat] = grouped[cat] || []).push(item);
  });
  return order.filter(cat => grouped[cat]?.length).map(cat => ({ cat, items: grouped[cat] }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DigitalMenu() {
  const { selectedProperty } = useAuthContext();
  const propertyId = selectedProperty?.id || selectedProperty?.supabase_property_id || 'default';
  const menuUrl = `${window.location.origin}/menu/${propertyId}`;

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState(null); // item being edited
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [showQR, setShowQR]       = useState(false);

  const qrRef = useRef(null);

  // Real-time listener on Firestore
  useEffect(() => {
    if (!propertyId) return;
    const colRef = collection(db, 'menus', propertyId, 'items');
    const unsub = onSnapshot(
      colRef,
      snap => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => {
        console.error('DigitalMenu snapshot error', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [propertyId]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      name:        item.name,
      category:    item.category,
      price:       String(item.price),
      isVeg:       item.isVeg,
      description: item.description || '',
      available:   item.available !== false,
    });
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Item name is required'); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      setError('Enter a valid price (0 or more)');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name:        form.name.trim(),
      category:    form.category,
      price:       Number(form.price),
      isVeg:       form.isVeg,
      description: form.description.trim(),
      available:   form.available,
    };

    try {
      if (editItem) {
        await updateDoc(doc(db, 'menus', propertyId, 'items', editItem.id), payload);
      } else {
        await addDoc(collection(db, 'menus', propertyId, 'items'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      setShowForm(false);
    } catch (e) {
      setError(`Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'menus', propertyId, 'items', item.id));
    } catch (e) {
      alert(`Failed to delete: ${e.message}`);
    }
  }

  async function toggleAvailable(item) {
    try {
      await updateDoc(doc(db, 'menus', propertyId, 'items', item.id), {
        available: !item.available,
      });
    } catch (e) {
      alert(`Failed to update: ${e.message}`);
    }
  }

  // Download QR as PNG
  function downloadQR() {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement('a');
      a.download = `menu-qr-${propertyId}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const grouped = groupByCategory(items);
  const available   = items.filter(i => i.available !== false).length;
  const unavailable = items.length - available;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-auto p-6">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f0eee8', letterSpacing: '-0.02em', margin: 0 }}>
              Digital Menu
            </h2>
            <p style={{ fontSize: '13px', color: '#56546a', marginTop: '4px' }}>
              Manage your menu items and share via QR code
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowQR(true)}
              style={outlineBtn}
            >
              <QrCode size={15} />
              View QR
            </button>
            <button
              onClick={openAdd}
              style={primaryBtn}
            >
              <Plus size={15} />
              Add Item
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Items',   value: items.length },
            { label: 'Available',     value: available   },
            { label: 'Unavailable',   value: unavailable },
            { label: 'Categories',    value: grouped.length },
          ].map(s => (
            <div key={s.label} style={{ background: '#16151f', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f0eee8' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#56546a', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#56546a' }}>
            <QrCode size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#8c8a9e', marginBottom: '8px' }}>No menu items yet</p>
            <p style={{ fontSize: '13px', marginBottom: '20px' }}>Add your first item to get started</p>
            <button onClick={openAdd} style={primaryBtn}>
              <Plus size={15} />
              Add First Item
            </button>
          </div>
        )}

        {/* Menu items by category */}
        {!loading && grouped.map(({ cat, items: catItems }) => (
          <div key={cat} style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#8c8a9e', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                {cat}
              </h3>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: '12px', color: '#56546a' }}>{catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {catItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: '#16151f',
                    borderRadius: '10px',
                    border: `1px solid ${item.available !== false ? 'rgba(255,255,255,0.07)' : 'rgba(239,68,68,0.2)'}`,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: item.available !== false ? 1 : 0.6,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {/* Veg / non-veg indicator */}
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

                  {/* Name + desc */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0eee8', lineHeight: '1.3' }}>
                      {item.name}
                    </div>
                    {item.description && (
                      <div style={{ fontSize: '12px', color: '#56546a', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.description}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0eee8', flexShrink: 0 }}>
                    ₹{item.price}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {/* Availability toggle */}
                    <button
                      onClick={() => toggleAvailable(item)}
                      title={item.available !== false ? 'Mark unavailable' : 'Mark available'}
                      style={{
                        ...iconBtn,
                        background: item.available !== false ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: item.available !== false ? '#22c55e' : '#ef4444',
                      }}
                    >
                      <Check size={13} />
                    </button>
                    <button onClick={() => openEdit(item)} style={iconBtn} title="Edit">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(item)} style={{ ...iconBtn, color: '#e07070' }} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>

      {/* Add / Edit Item modal */}
      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#16151f', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '460px', padding: '28px', position: 'relative' }}
          >
            <button onClick={() => setShowForm(false)} style={closeBtn}><X size={16} /></button>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0eee8', marginBottom: '24px' }}>
              {editItem ? 'Edit Item' : 'Add Menu Item'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Name */}
              <label style={labelStyle}>
                Item Name *
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Masala Chai"
                  style={inputStyle}
                />
              </label>

              {/* Category + Price row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={labelStyle}>
                  Category
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={inputStyle}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>

                <label style={labelStyle}>
                  Price (₹) *
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                    style={inputStyle}
                  />
                </label>
              </div>

              {/* Description */}
              <label style={labelStyle}>
                Description (optional)
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description"
                  style={inputStyle}
                />
              </label>

              {/* Veg / Non-Veg + Available */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#c4c2d4' }}>
                  <input
                    type="checkbox"
                    checked={form.isVeg}
                    onChange={e => setForm(f => ({ ...f, isVeg: e.target.checked }))}
                    style={{ accentColor: '#22c55e' }}
                  />
                  Vegetarian
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#c4c2d4' }}>
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
                    style={{ accentColor: '#6C63FF' }}
                  />
                  Available
                </label>
              </div>

              {/* Error */}
              {error && (
                <p style={{ fontSize: '12px', color: '#e07070', margin: 0 }}>{error}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...primaryBtn, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer', marginTop: '4px' }}
              >
                {saving ? 'Saving…' : (editItem ? 'Save Changes' : 'Add Item')}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* QR Code modal */}
      {showQR && (
        <div
          onClick={() => setShowQR(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            ref={qrRef}
            style={{ background: '#16151f', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '360px', padding: '32px', position: 'relative', textAlign: 'center' }}
          >
            <button onClick={() => setShowQR(false)} style={closeBtn}><X size={16} /></button>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0eee8', marginBottom: '8px' }}>Menu QR Code</h3>
            <p style={{ fontSize: '12px', color: '#56546a', marginBottom: '24px' }}>
              Guests scan this to view your menu
            </p>

            {/* QR */}
            <div style={{ display: 'inline-flex', padding: '16px', background: '#fff', borderRadius: '12px', marginBottom: '20px' }}>
              <QRCodeSVG
                value={menuUrl}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* URL */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', wordBreak: 'break-all' }}>
              <span style={{ fontSize: '11px', color: '#8c8a9e', fontFamily: 'monospace' }}>{menuUrl}</span>
            </div>

            {/* Download */}
            <button onClick={downloadQR} style={{ ...primaryBtn, width: '100%', justifyContent: 'center' }}>
              <Download size={15} />
              Download QR (PNG)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'linear-gradient(135deg,#7c6af5,#a896f8)',
  color: '#fff', border: 'none', borderRadius: '8px',
  padding: '9px 18px', fontSize: '13px', fontWeight: 600,
  cursor: 'pointer',
};

const outlineBtn = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'rgba(255,255,255,0.05)',
  color: '#c4c2d4', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', padding: '9px 18px',
  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
};

const iconBtn = {
  background: 'rgba(255,255,255,0.05)',
  border: 'none', borderRadius: '6px',
  padding: '6px', cursor: 'pointer',
  color: '#8c8a9e', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
};

const closeBtn = {
  position: 'absolute', top: '16px', right: '16px',
  background: 'rgba(255,255,255,0.06)', border: 'none',
  borderRadius: '8px', padding: '6px', cursor: 'pointer',
  color: '#8c8a9e', display: 'flex', alignItems: 'center',
};

const labelStyle = {
  display: 'flex', flexDirection: 'column', gap: '6px',
  fontSize: '12px', color: '#8c8a9e', fontWeight: 500,
};

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', padding: '9px 12px',
  fontSize: '13px', color: '#f0eee8', outline: 'none',
  width: '100%', boxSizing: 'border-box',
};

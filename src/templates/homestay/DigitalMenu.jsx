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
import { Plus, Trash2, X, QrCode, Download, Edit2, Check, Upload } from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts', 'Specials'];

function toMenuSlug(name) {
  return (name || 'menu')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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
  const { selectedProperty, firebaseUser } = useAuthContext();
  const propertyId = selectedProperty?.id || selectedProperty?.supabase_property_id || 'default';
  const menuSlug = toMenuSlug(selectedProperty?.property_name) || propertyId;
  const menuUrl = `${window.location.origin}/menu/${menuSlug}`;

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState(null); // item being edited
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [showQR, setShowQR]       = useState(false);

  const qrRef = useRef(null);
  const fileInputRef = useRef(null);

  // Upload Menu state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [extractedItems,  setExtractedItems]  = useState([]);
  const [uploading,       setUploading]       = useState(false);
  const [publishing,      setPublishing]      = useState(false);
  const [uploadError,     setUploadError]     = useState('');
  const [publishError,    setPublishError]    = useState('');
  const [selectedFile,    setSelectedFile]    = useState(null);
  const [previewUrl,      setPreviewUrl]      = useState(null);

  // Real-time listener on Firestore
  useEffect(() => {
    if (!menuSlug) return;
    const colRef = collection(db, 'menus', menuSlug, 'items');
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
  }, [menuSlug]);

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
        await updateDoc(doc(db, 'menus', menuSlug, 'items', editItem.id), payload);
      } else {
        await addDoc(collection(db, 'menus', menuSlug, 'items'), {
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
      await deleteDoc(doc(db, 'menus', menuSlug, 'items', item.id));
    } catch (e) {
      alert(`Failed to delete: ${e.message}`);
    }
  }

  async function toggleAvailable(item) {
    try {
      await updateDoc(doc(db, 'menus', menuSlug, 'items', item.id), {
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
      a.download = `menu-qr-${menuSlug}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
  }

  // ---------------------------------------------------------------------------
  // Upload Menu handlers
  // ---------------------------------------------------------------------------

  function openUploadModal() {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadError('');
    setUploadModalOpen(true);
  }

  function closeUploadModal() {
    setUploadModalOpen(false);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadError('');
  }

  function handleFileSelect(file) {
    if (!file) return;
    const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!ALLOWED.includes(file.type)) {
      setUploadError('Only JPG, PNG, or PDF files are supported.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('File must be under 4 MB.');
      return;
    }
    setUploadError('');
    setSelectedFile(file);
    if (file.type !== 'application/pdf') {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleExtract() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const token = await firebaseUser.getIdToken();
      const fd = new FormData();
      fd.append('file', selectedFile);
      const res = await fetch('/api/extract-menu', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Server error — please try again. If the issue persists, contact support.');
      }
      if (!res.ok) throw new Error(data.error ?? 'Extraction failed');
      if (!data.items?.length) {
        setUploadError('No menu items found in the image. Try a clearer photo.');
        return;
      }
      setExtractedItems(data.items.map((item, idx) => ({ ...item, _key: idx })));
      setUploadModalOpen(false);
      setReviewModalOpen(true);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function updateExtractedItem(key, field, value) {
    setExtractedItems(prev =>
      prev.map(item => item._key === key ? { ...item, [field]: value } : item)
    );
  }

  function removeExtractedItem(key) {
    setExtractedItems(prev => prev.filter(item => item._key !== key));
  }

  async function handlePublish() {
    if (!extractedItems.length) return;
    setPublishing(true);
    setPublishError('');
    const colRef = collection(db, 'menus', menuSlug, 'items');
    try {
      await Promise.all(
        extractedItems.map(item =>
          addDoc(colRef, {
            name:        item.name.trim(),
            category:    CATEGORIES.includes(item.category) ? item.category : 'Specials',
            price:       Number(item.price) || 0,
            isVeg:       Boolean(item.isVeg),
            description: (item.description ?? '').trim(),
            available:   true,
            createdAt:   serverTimestamp(),
          })
        )
      );
      setReviewModalOpen(false);
      setExtractedItems([]);
    } catch (e) {
      setPublishError(`Failed to publish: ${e.message}`);
    } finally {
      setPublishing(false);
    }
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

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowQR(true)}
              style={outlineBtn}
            >
              <QrCode size={15} />
              View QR
            </button>
            <button
              onClick={openUploadModal}
              style={outlineBtn}
            >
              <Upload size={15} />
              Upload Menu
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

      {/* Upload Menu modal */}
      {uploadModalOpen && (
        <div
          onClick={closeUploadModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#16151f', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '480px', padding: '28px', position: 'relative' }}
          >
            <button onClick={closeUploadModal} style={closeBtn}><X size={16} /></button>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0eee8', marginBottom: '6px' }}>
              Upload Menu
            </h3>
            <p style={{ fontSize: '13px', color: '#56546a', marginBottom: '20px' }}>
              Upload a photo or PDF of your menu. AI will extract all items for you to review.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0]); }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${selectedFile ? 'rgba(108,99,255,0.6)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '12px', padding: '32px 20px', textAlign: 'center',
                cursor: 'pointer', marginBottom: '16px',
                background: selectedFile ? 'rgba(108,99,255,0.06)' : 'transparent',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Menu preview"
                  style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain', marginBottom: '12px' }}
                />
              )}
              {selectedFile && !previewUrl && (
                <div style={{ fontSize: '13px', color: '#a896f8', marginBottom: '12px', wordBreak: 'break-all' }}>
                  {selectedFile.name}
                </div>
              )}
              <Upload size={24} style={{ color: '#56546a', margin: '0 auto 8px', display: 'block' }} />
              <p style={{ fontSize: '13px', color: '#8c8a9e', margin: 0 }}>
                {selectedFile ? 'Click or drag to replace' : 'Drag & drop or click to browse'}
              </p>
              <p style={{ fontSize: '11px', color: '#56546a', marginTop: '4px' }}>
                JPG, PNG, or PDF — max 4 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files?.[0])}
              />
            </div>

            {uploadError && (
              <p style={{ fontSize: '12px', color: '#e07070', marginBottom: '12px' }}>{uploadError}</p>
            )}

            <button
              onClick={handleExtract}
              disabled={!selectedFile || uploading}
              style={{
                ...primaryBtn,
                width: '100%', justifyContent: 'center',
                opacity: (!selectedFile || uploading) ? 0.5 : 1,
                cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading
                ? <><LoadingSpinner size="sm" color="white" />&nbsp;Extracting items…</>
                : 'Extract Items'}
            </button>
          </div>
        </div>
      )}

      {/* Review Extracted Items modal */}
      {reviewModalOpen && (
        <div
          onClick={() => { if (!publishing) setReviewModalOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#16151f', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '860px', padding: '28px', position: 'relative', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {!publishing && (
              <button onClick={() => setReviewModalOpen(false)} style={closeBtn}><X size={16} /></button>
            )}

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0eee8', marginBottom: '4px', flexShrink: 0 }}>
              Review Extracted Items
            </h3>
            <p style={{ fontSize: '13px', color: '#56546a', marginBottom: '20px', flexShrink: 0 }}>
              {extractedItems.length} item{extractedItems.length !== 1 ? 's' : ''} found. Edit or remove before publishing.
            </p>

            {/* Scrollable table */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
              {extractedItems.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#56546a', padding: '40px 0', fontSize: '13px' }}>
                  All items removed.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Name', 'Category', 'Price (₹)', 'Veg', 'Description', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#56546a', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {extractedItems.map(item => (
                      <tr key={item._key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            value={item.name}
                            onChange={e => updateExtractedItem(item._key, 'name', e.target.value)}
                            style={{ ...inputStyle, width: '140px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <select
                            value={item.category}
                            onChange={e => updateExtractedItem(item._key, 'category', e.target.value)}
                            style={{ ...inputStyle, width: '120px' }}
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="number" min="0"
                            value={item.price}
                            onChange={e => updateExtractedItem(item._key, 'price', e.target.value)}
                            style={{ ...inputStyle, width: '80px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(item.isVeg)}
                            onChange={e => updateExtractedItem(item._key, 'isVeg', e.target.checked)}
                            style={{ accentColor: '#22c55e', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            value={item.description}
                            onChange={e => updateExtractedItem(item._key, 'description', e.target.value)}
                            style={{ ...inputStyle, width: '200px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <button
                            onClick={() => removeExtractedItem(item._key)}
                            style={{ ...iconBtn, color: '#e07070' }}
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {publishError && (
              <p style={{ fontSize: '12px', color: '#e07070', marginBottom: '12px', flexShrink: 0 }}>{publishError}</p>
            )}

            <button
              onClick={handlePublish}
              disabled={publishing || extractedItems.length === 0}
              style={{
                ...primaryBtn,
                alignSelf: 'flex-end', flexShrink: 0,
                opacity: (publishing || extractedItems.length === 0) ? 0.5 : 1,
                cursor: (publishing || extractedItems.length === 0) ? 'not-allowed' : 'pointer',
              }}
            >
              {publishing
                ? <><LoadingSpinner size="sm" color="white" />&nbsp;Publishing…</>
                : `Publish ${extractedItems.length} Item${extractedItems.length !== 1 ? 's' : ''}`}
            </button>
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

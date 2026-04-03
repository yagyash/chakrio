import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import CTABox from '../../components/tools/CTABox';
import { db } from '../../services/firebase';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function today() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcNights(ci, co) {
  if (!ci || !co) return 0;
  const a = new Date(ci), b = new Date(co);
  const n = Math.round((b - a) / 86400000);
  return n > 0 ? n : 0;
}

function genInvoiceNo() {
  const d = new Date();
  const pad = v => String(v).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `INV-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
}

const inputCls = 'w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none transition-colors text-sm';
const labelCls = 'block text-xs font-medium text-text-2 mb-1';
const GOLD = '#c8a96e';
const GST_RATES = [0, 12, 18];

// ---------------------------------------------------------------------------
// PDF generator
// ---------------------------------------------------------------------------

function generatePDF(inv) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 48;
  const col2 = W / 2 + 10;
  let y = margin;

  // Header bar
  doc.setFillColor(15, 14, 23);
  doc.rect(0, 0, W, 70, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(200, 169, 110);
  doc.text('INVOICE', margin, 44);
  doc.setFontSize(10);
  doc.setTextColor(160, 160, 160);
  doc.text(inv.invoiceNo, W - margin, 38, { align: 'right' });
  doc.text(`Date: ${fmtDate(inv.invoiceDate)}`, W - margin, 52, { align: 'right' });

  y = 94;

  // FROM / TO
  doc.setFontSize(8);
  doc.setTextColor(140, 138, 158);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', margin, y);
  doc.text('TO', col2, y);
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(inv.propertyName || 'Property Name', margin, y);
  doc.text(inv.guestName || 'Guest Name', col2, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (inv.propertyAddress) {
    const addrLines = doc.splitTextToSize(inv.propertyAddress, W / 2 - 20);
    doc.text(addrLines, margin, y);
  }
  if (inv.guestPhone) doc.text(inv.guestPhone, col2, y);
  y += 40;

  // Stay details box
  doc.setFillColor(245, 244, 250);
  doc.roundedRect(margin, y, W - margin * 2, 60, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const mid = W / 3;
  doc.text('Check-in', margin + 16, y + 18);
  doc.text('Check-out', margin + mid, y + 18);
  doc.text('Nights', margin + mid * 2, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(fmtDate(inv.checkIn) || '—', margin + 16, y + 38);
  doc.text(fmtDate(inv.checkOut) || '—', margin + mid, y + 38);
  doc.text(String(inv.nights), margin + mid * 2, y + 38);
  y += 76;

  // Line items table header
  doc.setFillColor(15, 14, 23);
  doc.rect(margin, y, W - margin * 2, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(200, 169, 110);
  doc.text('Description', margin + 10, y + 16);
  doc.text('Amount', W - margin - 10, y + 16, { align: 'right' });
  y += 30;

  // Line items
  const lineItems = [
    { label: `Stay Charges${inv.nights ? ` (${inv.nights} night${inv.nights > 1 ? 's' : ''})` : ''}`, amount: inv.stayCharges },
    ...inv.extras.filter(e => e.label && Number(e.amount) > 0).map(e => ({ label: e.label, amount: Number(e.amount) })),
  ];
  if (inv.gstRate > 0) lineItems.push({ label: `GST @ ${inv.gstRate}%`, amount: inv.gstAmount });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  lineItems.forEach((item, i) => {
    doc.setFillColor(i % 2 === 0 ? 252 : 248, i % 2 === 0 ? 251 : 248, i % 2 === 0 ? 255 : 252);
    doc.rect(margin, y - 4, W - margin * 2, 22, 'F');
    doc.setTextColor(40, 40, 40);
    doc.text(item.label, margin + 10, y + 10);
    doc.text(`Rs.${Number(item.amount).toLocaleString('en-IN')}`, W - margin - 10, y + 10, { align: 'right' });
    y += 22;
  });

  y += 6;
  // Divider
  doc.setDrawColor(200, 169, 110);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 14;

  // Totals
  const totals = [
    { label: 'TOTAL', val: inv.total, bold: true, gold: true },
    { label: 'Advance Paid', val: inv.advance, bold: false, gold: false },
    { label: 'BALANCE DUE', val: inv.balance, bold: true, gold: false },
  ];

  totals.forEach(t => {
    doc.setFont('helvetica', t.bold ? 'bold' : 'normal');
    doc.setFontSize(t.bold ? 12 : 10);
    doc.setTextColor(t.gold ? 200 : 30, t.gold ? 169 : 30, t.gold ? 110 : 30);
    doc.text(t.label, margin + 10, y);
    doc.text(`Rs.${Number(t.val).toLocaleString('en-IN')}`, W - margin - 10, y, { align: 'right' });
    y += t.bold ? 20 : 16;
  });

  y += 20;
  // Footer
  doc.setDrawColor(230, 228, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 16;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for your stay! We look forward to welcoming you again.', W / 2, y, { align: 'center' });
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text('Powered by Chakrio · chakrio.in', W / 2, y, { align: 'center' });

  doc.save(`Invoice-${inv.guestName || 'Guest'}-${inv.invoiceNo}.pdf`);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InvoiceGenerator() {
  // Form state
  const [propertyName, setPropertyName]   = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [guestName, setGuestName]         = useState('');
  const [guestPhone, setGuestPhone]       = useState('');
  const [checkIn, setCheckIn]             = useState('');
  const [checkOut, setCheckOut]           = useState('');
  const [stayCharges, setStayCharges]     = useState('');
  const [gstRate, setGstRate]             = useState(0);
  const [extras, setExtras]               = useState([{ label: '', amount: '' }, { label: '', amount: '' }, { label: '', amount: '' }]);
  const [advance, setAdvance]             = useState('');
  const [invoiceNo, setInvoiceNo]         = useState(genInvoiceNo);
  const [invoiceDate, setInvoiceDate]     = useState(today());

  // Lead gate state
  const [showModal, setShowModal]         = useState(false);
  const [leadName, setLeadName]           = useState('');
  const [leadWA, setLeadWA]               = useState('');
  const [leadProp, setLeadProp]           = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [leadError, setLeadError]         = useState('');

  // Derived
  const nights      = calcNights(checkIn, checkOut);
  const stayNum     = Number(stayCharges) || 0;
  const extrasTotal = extras.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const subtotal    = stayNum + extrasTotal;
  const gstAmount   = Math.round(subtotal * gstRate / 100);
  const total       = subtotal + gstAmount;
  const advanceNum  = Number(advance) || 0;
  const balance     = total - advanceNum;

  function buildInvoice() {
    return { propertyName, propertyAddress, guestName, guestPhone, checkIn, checkOut, nights, stayCharges: stayNum, extras, gstRate, gstAmount, advance: advanceNum, total, balance, invoiceNo, invoiceDate };
  }

  function handleDownload() {
    if (localStorage.getItem('chakrio_lead_captured')) {
      generatePDF(buildInvoice());
    } else {
      setLeadProp(propertyName);
      setShowModal(true);
    }
  }

  async function handleLeadSubmit() {
    if (!leadName.trim()) { setLeadError('Please enter your name.'); return; }
    if (!leadWA.trim() || leadWA.replace(/\D/g, '').length < 10) { setLeadError('Please enter a valid WhatsApp number.'); return; }
    if (!leadProp.trim()) { setLeadError('Please enter your property name.'); return; }

    setSubmitting(true);
    setLeadError('');
    try {
      await addDoc(collection(db, 'leads'), {
        name: leadName.trim(),
        whatsapp: leadWA.trim(),
        property_name: leadProp.trim(),
        source_page: 'invoice-generator',
        submitted_at: serverTimestamp(),
      });
      localStorage.setItem('chakrio_lead_captured', '1');
      setShowModal(false);
      generatePDF(buildInvoice());
    } catch (e) {
      // Still generate PDF even if Firestore write fails
      localStorage.setItem('chakrio_lead_captured', '1');
      setShowModal(false);
      generatePDF(buildInvoice());
    } finally {
      setSubmitting(false);
    }
  }

  function setExtra(i, field, val) {
    setExtras(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  }

  const focusGold = e => { e.target.style.borderColor = GOLD; };
  const blurReset = e => { e.target.style.borderColor = ''; };

  return (
    <div className="min-h-screen bg-bg-app text-text-1 flex flex-col">
      <Helmet>
        <title>Free Invoice Generator for Villa & Homestay — Chakrio</title>
        <meta name="description" content="Generate professional guest invoices for your villa or homestay in seconds. Free, no sign-up required. Download as PDF instantly." />
        <link rel="canonical" href="https://chakrio.in/tools/invoice-generator" />
      </Helmet>

      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-10 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: GOLD }}>Free Tool</span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-1 mb-3" style={{ letterSpacing: '-0.03em' }}>
            Villa & Homestay Invoice Generator
          </h1>
          <p className="text-text-2 text-sm max-w-xl mx-auto">
            Fill in the stay details, preview the totals, and download a clean PDF invoice to share with your guest. No sign-up. No watermarks.
          </p>
        </div>

        <div className="rounded-2xl border p-6 sm:p-8 space-y-8" style={{ background: '#16151f', borderColor: 'rgba(255,255,255,0.07)' }}>

          {/* Property details */}
          <section>
            <h2 className="text-sm font-bold mb-4" style={{ color: GOLD }}>Property Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Property Name *</label>
                <input value={propertyName} onChange={e => setPropertyName(e.target.value)} placeholder="Jungle View Villa" className={inputCls} onFocus={focusGold} onBlur={blurReset} />
              </div>
              <div>
                <label className={labelCls}>Property Address (optional)</label>
                <input value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} placeholder="Rishikesh, Uttarakhand" className={inputCls} onFocus={focusGold} onBlur={blurReset} />
              </div>
            </div>
          </section>

          {/* Guest details */}
          <section>
            <h2 className="text-sm font-bold mb-4" style={{ color: GOLD }}>Guest Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Guest Name *</label>
                <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Rahul Sharma" className={inputCls} onFocus={focusGold} onBlur={blurReset} />
              </div>
              <div>
                <label className={labelCls}>Guest Phone (optional)</label>
                <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} onFocus={focusGold} onBlur={blurReset} />
              </div>
            </div>
          </section>

          {/* Stay details */}
          <section>
            <h2 className="text-sm font-bold mb-4" style={{ color: GOLD }}>Stay Details</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelCls}>Check-in *</label>
                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className={inputCls} onFocus={focusGold} onBlur={blurReset} />
              </div>
              <div>
                <label className={labelCls}>Check-out *</label>
                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className={inputCls} onFocus={focusGold} onBlur={blurReset} />
              </div>
              <div>
                <label className={labelCls}>Nights</label>
                <div className="w-full bg-surface2 border border-surface3 rounded-lg px-4 py-3 text-sm font-bold" style={{ color: nights > 0 ? GOLD : '#56546a' }}>
                  {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : '—'}
                </div>
              </div>
            </div>
          </section>

          {/* Charges */}
          <section>
            <h2 className="text-sm font-bold mb-4" style={{ color: GOLD }}>Charges</h2>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Stay Charges (₹) *</label>
                <input type="number" min="0" value={stayCharges} onChange={e => setStayCharges(e.target.value)} placeholder="15000" className={inputCls} onFocus={focusGold} onBlur={blurReset} />
              </div>
              <div>
                <label className={labelCls}>GST Rate</label>
                <div className="flex gap-2">
                  {GST_RATES.map(r => (
                    <button
                      key={r}
                      onClick={() => setGstRate(r)}
                      className="flex-1 py-3 rounded-lg text-sm font-semibold border transition-colors"
                      style={{
                        background: gstRate === r ? 'rgba(200,169,110,0.15)' : 'rgba(255,255,255,0.04)',
                        borderColor: gstRate === r ? GOLD : 'rgba(255,255,255,0.08)',
                        color: gstRate === r ? GOLD : '#8c8a9e',
                      }}
                    >
                      {r === 0 ? 'None' : `${r}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Extra charges */}
            <div className="space-y-2">
              <label className={labelCls}>Extra Charges (optional)</label>
              {extras.map((e, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input
                    value={e.label}
                    onChange={ev => setExtra(i, 'label', ev.target.value)}
                    placeholder={`e.g. Breakfast${i > 0 ? `, Extra ${i}` : ''}`}
                    className={`col-span-2 ${inputCls}`}
                    onFocus={focusGold} onBlur={blurReset}
                  />
                  <input
                    type="number" min="0"
                    value={e.amount}
                    onChange={ev => setExtra(i, 'amount', ev.target.value)}
                    placeholder="₹"
                    className={inputCls}
                    onFocus={focusGold} onBlur={blurReset}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="text-sm font-bold mb-4" style={{ color: GOLD }}>Payment</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Advance Paid (₹)</label>
                <input type="number" min="0" value={advance} onChange={e => setAdvance(e.target.value)} placeholder="0" className={inputCls} onFocus={focusGold} onBlur={blurReset} />
              </div>
              <div>
                <label className={labelCls}>Invoice Details</label>
                <div className="grid grid-cols-2 gap-2">
                  <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="INV-..." className={inputCls} onFocus={focusGold} onBlur={blurReset} />
                  <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputCls} onFocus={focusGold} onBlur={blurReset} />
                </div>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="rounded-xl p-5 space-y-2" style={{ background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.18)' }}>
            <h2 className="text-sm font-bold mb-3" style={{ color: GOLD }}>Invoice Summary</h2>
            {[
              { label: 'Stay Charges', val: stayNum },
              ...extras.filter(e => e.label && Number(e.amount) > 0).map(e => ({ label: e.label, val: Number(e.amount) })),
              ...(gstRate > 0 ? [{ label: `GST @ ${gstRate}%`, val: gstAmount }] : []),
            ].map((row, i) => (
              <div key={i} className="flex justify-between text-sm text-text-2">
                <span>{row.label}</span>
                <span>₹{row.val.toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2" style={{ borderColor: 'rgba(200,169,110,0.2)' }}>
              <div className="flex justify-between font-bold text-base" style={{ color: GOLD }}>
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-text-2 mt-1">
                <span>Advance Paid</span>
                <span>₹{advanceNum.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm mt-1" style={{ color: balance > 0 ? '#e8a86a' : '#22c55e' }}>
                <span>Balance Due</span>
                <span>₹{balance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </section>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={!propertyName || !guestName || !checkIn || !checkOut || !stayCharges}
            className="w-full py-4 rounded-xl font-bold text-sm transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #c8a96e, #b8934a)',
              color: '#0f0e17',
              opacity: (!propertyName || !guestName || !checkIn || !checkOut || !stayCharges) ? 0.45 : 1,
              cursor: (!propertyName || !guestName || !checkIn || !checkOut || !stayCharges) ? 'not-allowed' : 'pointer',
            }}
          >
            Download PDF Invoice
          </button>
          <p className="text-center text-xs text-text-3 -mt-4">
            Fill in property name, guest name, dates, and stay charges to enable download.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10">
          <CTABox
            headline="Tired of manual invoices and spreadsheets?"
            body="Chakrio auto-records every booking, payment, and expense via a simple Telegram message — and your dashboard stays up to date in real time."
            buttonText="Try Chakrio Free →"
          />
        </div>
      </main>

      <Footer />

      {/* Lead gate modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#16151f', borderRadius: '20px', border: '1px solid rgba(200,169,110,0.2)', width: '100%', maxWidth: '420px', padding: '32px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f0eee8', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                Your invoice is ready!
              </h3>
              <p style={{ fontSize: '13px', color: '#8c8a9e', lineHeight: '1.5' }}>
                Enter your details to download. We may reach out about Chakrio — India's easiest property management tool.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#8c8a9e', marginBottom: '5px' }}>Your Name *</label>
                <input
                  value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  placeholder="Ramesh Kumar"
                  className={inputCls}
                  onFocus={focusGold} onBlur={blurReset}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#8c8a9e', marginBottom: '5px' }}>WhatsApp Number *</label>
                <input
                  value={leadWA}
                  onChange={e => setLeadWA(e.target.value)}
                  placeholder="9876543210"
                  type="tel"
                  className={inputCls}
                  onFocus={focusGold} onBlur={blurReset}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#8c8a9e', marginBottom: '5px' }}>Property Name *</label>
                <input
                  value={leadProp}
                  onChange={e => setLeadProp(e.target.value)}
                  placeholder="Jungle View Villa"
                  className={inputCls}
                  onFocus={focusGold} onBlur={blurReset}
                />
              </div>

              {leadError && <p style={{ fontSize: '12px', color: '#e07070', margin: 0 }}>{leadError}</p>}

              <button
                onClick={handleLeadSubmit}
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #c8a96e, #b8934a)',
                  color: '#0f0e17', border: 'none', borderRadius: '10px',
                  padding: '13px', fontSize: '14px', fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1, marginTop: '4px',
                }}
              >
                {submitting ? 'Saving…' : 'Download Invoice PDF'}
              </button>
              <p style={{ fontSize: '11px', color: '#56546a', textAlign: 'center', margin: 0 }}>
                By continuing you agree to our{' '}
                <a href="/privacy" style={{ color: GOLD, textDecoration: 'underline' }}>Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

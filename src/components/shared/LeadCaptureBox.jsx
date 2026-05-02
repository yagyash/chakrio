import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const GOLD = '#c8a96e';
const inputCls = 'w-full bg-[#0d0c18] border border-surface3 rounded-lg px-4 py-3 text-text-1 placeholder-text-3 focus:outline-none transition-colors text-sm';

export default function LeadCaptureBox({ sourcePage }) {
  const alreadyCaptured = () => !!localStorage.getItem('chakrio_lead_captured');

  const [name, setName]         = useState('');
  const [wa, setWa]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(alreadyCaptured);
  const [error, setError]           = useState('');

  if (submitted) return null;

  async function handleSubmit() {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (wa.replace(/\D/g, '').length < 10) { setError('Please enter a valid WhatsApp number.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'leads'), {
        name: name.trim(),
        whatsapp: wa.trim(),
        source_page: sourcePage,
        submitted_at: serverTimestamp(),
      });
      const botToken  = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const adminChat = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID;
      if (botToken && adminChat) {
        const msg = `🔔 New Lead!\n\nName: ${name.trim()}\nWhatsApp: ${wa.trim()}\nSource: ${sourcePage}`;
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: adminChat, text: msg }),
        }).catch(() => {});
      }
    } catch (_) {
      // Firestore failure — still mark as captured so we don't keep pestering
    } finally {
      localStorage.setItem('chakrio_lead_captured', '1');
      setSubmitted(true);
      setSubmitting(false);
    }
  }

  return (
    <div
      className="mt-10 rounded-2xl p-7 border"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.07) 0%, #16151f 70%)', borderColor: 'rgba(200,169,110,0.25)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
        Want Chakrio to handle all of this automatically?
      </p>
      <h3 className="font-display font-extrabold text-xl text-text-1 mb-1 tracking-tight">
        Stop doing this manually.
      </h3>
      <p className="text-text-2 text-sm mb-5 leading-relaxed">
        Chakrio auto-records every booking, expense, and payment via a simple WhatsApp or Telegram message — and your dashboard stays updated in real time.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          className={inputCls}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = ''}
        />
        <input
          value={wa}
          onChange={e => setWa(e.target.value)}
          placeholder="WhatsApp number"
          type="tel"
          className={inputCls}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = ''}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="shrink-0 px-6 py-3 rounded-xl font-semibold text-sm transition-opacity"
          style={{
            background: 'linear-gradient(135deg, #c8a96e, #b8934a)',
            color: '#0f0e17',
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Sending…' : 'Get a free demo →'}
        </button>
      </div>

      {error && <p className="text-xs mt-2" style={{ color: '#e07070' }}>{error}</p>}

      <p className="text-xs mt-3" style={{ color: '#56546a' }}>
        By submitting you agree to our{' '}
        <a href="/privacy" style={{ color: GOLD, textDecoration: 'underline' }}>Privacy Policy</a>.
        We'll reach out on WhatsApp — no spam.
      </p>
    </div>
  );
}

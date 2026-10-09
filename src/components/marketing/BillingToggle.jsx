import { useId } from 'react';

const OPTIONS = [
  { yearly: false, label: 'Monthly' },
  { yearly: true, label: 'Yearly', note: '2 months free' },
];

/** Monthly / Yearly switch for the pricing cards: native radio buttons styled as a pill. */
export default function BillingToggle({ yearly, onChange }) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label="Billing period" className="inline-flex p-1 gap-1"
      style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12 }}>
      {OPTIONS.map((o) => {
        const on = yearly === o.yearly;
        return (
          <label key={o.label} className="cursor-pointer select-none focus-within:ring-2 focus-within:ring-[#C9A24B]"
            style={{
              padding: '8px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600,
              fontFamily: "'Hanken Grotesk', sans-serif",
              background: on ? '#C9A24B' : 'transparent', color: on ? '#0E0B14' : '#CFCAD9',
              transition: 'background .15s, color .15s',
            }}>
            <input type="radio" name={name} className="sr-only" checked={on} onChange={() => onChange(o.yearly)} />
            {o.label}
            {o.note && <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 6, color: on ? '#0E0B14' : '#C9A24B' }}>{o.note}</span>}
          </label>
        );
      })}
    </div>
  );
}

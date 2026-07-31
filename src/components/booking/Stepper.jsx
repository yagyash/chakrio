import { Minus, Plus } from 'lucide-react';

/** Plus/minus quantity control — replaces raw <input type="number"> for room quantities. */
export default function Stepper({ value, onChange, min = 0, max = 20, label }) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label || 'quantity'}`}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-white/15 text-text-2 transition-colors hover:bg-white/8 disabled:pointer-events-none disabled:opacity-30"
      >
        <Minus size={14} />
      </button>
      <span className="w-6 text-center text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label || 'quantity'}`}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-white/15 text-text-2 transition-colors hover:bg-white/8 disabled:pointer-events-none disabled:opacity-30"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

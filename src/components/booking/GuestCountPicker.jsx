/** Pill selector for villa guest-count tiers — replaces the native <select>. */
export default function GuestCountPicker({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Number of guests">
      {options.map((r) => {
        const selected = value === r.guest_count;
        return (
          <button
            key={r.guest_count}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(r.guest_count)}
            className={[
              'min-h-11 rounded-lg border px-4 py-2 text-left text-sm transition-all duration-150',
              selected
                ? 'border-brand bg-brand/15 text-text-1'
                : 'border-white/15 text-text-2 hover:border-white/25 hover:bg-white/5',
            ].join(' ')}
          >
            <span className="block font-semibold">{r.guest_count} guests</span>
            <span className={`block text-xs tabular-nums ${selected ? 'text-text-2' : 'text-text-3'}`}>
              ₹{r.price_per_night.toLocaleString('en-IN')}/night
            </span>
          </button>
        );
      })}
    </div>
  );
}

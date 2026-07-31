import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_MS = 86400000;
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fromISODate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function isSameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function monthKey(d) {
  return d.getFullYear() * 12 + d.getMonth();
}
function formatShort(d) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function buildMonthGrid(viewDate) {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(gridStart, i);
    return { date, inMonth: date.getMonth() === viewDate.getMonth() };
  });
}

/**
 * Check-in/check-out range picker with a single trigger + popover calendar.
 * Replaces native <input type="date"> so the displayed format (and the
 * disabled-date / range-highlight behavior) is consistent across browsers
 * instead of following the visitor's OS locale.
 */
export default function DateRangePicker({ checkIn, checkOut, onChange, minDate }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => fromISODate(checkIn) || new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const rootRef = useRef(null);

  const min = fromISODate(minDate) || startOfDay(new Date());
  const checkInDate = fromISODate(checkIn);
  const checkOutDate = fromISODate(checkOut);
  const nights = checkInDate && checkOutDate ? Math.round((checkOutDate - checkInDate) / DAY_MS) : 0;

  useEffect(() => {
    if (open) setViewMonth(checkInDate || min);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function selectDay(date) {
    if (!checkInDate || checkOutDate || date <= checkInDate) {
      onChange({ checkIn: toISODate(date), checkOut: '' });
      return;
    }
    onChange({ checkIn, checkOut: toISODate(date) });
    setOpen(false);
  }

  const previewEnd = checkOutDate || hoverDate;
  const cells = buildMonthGrid(viewMonth);
  const canGoPrev = monthKey(viewMonth) > monthKey(min);

  return (
    <div className="relative w-full sm:w-auto" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-h-11 w-full sm:w-auto items-center gap-3 rounded-lg border border-white/15 bg-bg-app px-4 py-2.5 text-left text-sm transition-colors duration-200 hover:border-white/25 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      >
        <CalendarDays size={16} className="shrink-0 text-text-3" />
        <span className="flex flex-1 flex-wrap items-center gap-2">
          <span className={checkInDate ? 'font-medium text-text-1' : 'text-text-3'}>
            {checkInDate ? formatShort(checkInDate) : 'Check-in'}
          </span>
          <span className="text-text-3">→</span>
          <span className={checkOutDate ? 'font-medium text-text-1' : 'text-text-3'}>
            {checkOutDate ? formatShort(checkOutDate) : 'Check-out'}
          </span>
        </span>
        {nights > 0 && (
          <span className="shrink-0 text-xs font-semibold text-gold">
            {nights} night{nights > 1 ? 's' : ''}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose check-in and check-out dates"
          className="absolute left-0 right-0 sm:right-auto top-full z-30 mt-2 w-full rounded-xl border border-white/10 bg-surface2 p-4 shadow-xl shadow-black/30 sm:w-[300px]"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-white/8 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="m-0 text-sm font-semibold">
              {viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-white/8"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {WEEKDAY_LABELS.map((w, i) => (
              <span key={i} className="flex h-8 items-center justify-center text-[11px] font-medium text-text-3">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map(({ date, inMonth }) => {
              const disabled = date < min;
              const isStart = isSameDay(date, checkInDate);
              const isEnd = isSameDay(date, checkOutDate);
              const inRange = !!checkInDate && !!previewEnd && date > checkInDate && date < previewEnd;
              const isToday = isSameDay(date, startOfDay(new Date()));
              return (
                <button
                  key={toISODate(date)}
                  type="button"
                  disabled={disabled}
                  onMouseEnter={() => !checkOutDate && checkInDate && setHoverDate(date)}
                  onClick={() => selectDay(date)}
                  aria-label={date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  aria-pressed={isStart || isEnd}
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-md text-sm tabular-nums transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    !inMonth && 'text-text-3/40',
                    inMonth && !disabled && !isStart && !isEnd && 'text-text-2',
                    disabled && 'cursor-not-allowed text-text-3/25',
                    (isStart || isEnd) && 'bg-brand font-semibold text-white',
                    inRange && !isStart && !isEnd && 'bg-brand/15 text-text-1',
                    isToday && !isStart && !isEnd && 'ring-1 ring-inset ring-gold/60',
                    !disabled && !isStart && !isEnd && 'hover:bg-white/10',
                  ].filter(Boolean).join(' ')}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
            <button
              type="button"
              onClick={() => onChange({ checkIn: '', checkOut: '' })}
              className="text-xs text-text-3 transition-colors hover:text-text-2"
            >
              Clear dates
            </button>
            {checkInDate && !checkOutDate && <p className="m-0 text-xs text-text-3">Pick a check-out date</p>}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

/** Bento-style photo grid with a fullscreen lightbox — property gallery on /book/:slug. */
export default function PhotoGallery({ photos, alt }) {
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e) {
      if (e.key === 'Escape') setOpenIndex(null);
      if (e.key === 'ArrowRight') setOpenIndex((i) => (i + 1) % photos.length);
      if (e.key === 'ArrowLeft') setOpenIndex((i) => (i - 1 + photos.length) % photos.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, photos?.length]);

  if (!photos?.length) return null;

  const visible = photos.slice(0, 3);
  const extraCount = photos.length - visible.length;

  return (
    <>
      <div className={`grid gap-2 mb-8 ${visible.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}>
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          className={`group relative overflow-hidden rounded-xl shadow-lg shadow-black/30 ${visible.length > 1 ? 'col-span-2 h-64 md:h-80' : 'h-64 md:h-80 w-full'}`}
        >
          <img
            src={visible[0]}
            alt={`${alt} — exterior view`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Maximize2 size={16} className="absolute top-3 right-3 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        {visible.length > 1 && (
          <div className="grid grid-rows-2 gap-2">
            {visible.slice(1, 3).map((url, i) => {
              const index = i + 1;
              const isLastVisible = index === visible.length - 1;
              const showOverlay = isLastVisible && extraCount > 0;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className="group relative overflow-hidden rounded-xl shadow-lg shadow-black/30"
                >
                  <img
                    src={url}
                    alt={`${alt} — view ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {showOverlay ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-semibold text-white">
                      +{extraCount} photo{extraCount > 1 ? 's' : ''}
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Close"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpenIndex((i) => (i - 1 + photos.length) % photos.length); }}
                aria-label="Previous photo"
                className="absolute left-3 md:left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpenIndex((i) => (i + 1) % photos.length); }}
                aria-label="Next photo"
                className="absolute right-3 md:right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <img
            src={photos[openIndex]}
            alt={`${alt} — photo ${openIndex + 1} of ${photos.length}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70 tabular-nums">
            {openIndex + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  );
}

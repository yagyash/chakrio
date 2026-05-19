const WA_NUMBER = '919461888529';

export default function ToolConversionHook({ heading, body, buttonText = 'See how it works →' }) {
  return (
    <div
      className="rounded-2xl px-7 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mt-8"
      style={{ background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.2)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-display font-extrabold text-base text-text-1 mb-1">{heading}</p>
        <p className="text-text-2 text-sm leading-relaxed">{body}</p>
      </div>
      <a
        href={`https://wa.me/${WA_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 inline-block text-center rounded-xl text-sm font-semibold whitespace-nowrap"
        style={{ background: 'linear-gradient(135deg, #c8a96e, #b8934a)', color: '#0f0e17', padding: '11px 22px', textDecoration: 'none' }}
      >
        {buttonText}
      </a>
    </div>
  );
}

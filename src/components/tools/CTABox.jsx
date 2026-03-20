import { Link } from 'react-router-dom';

export default function CTABox({ headline, body, buttonText = 'Try Chakrio Free →', buttonHref = '/login' }) {
  return (
    <div className="rounded-2xl p-8 text-center border" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.1) 0%, transparent 70%), #16151f', borderColor: 'rgba(200,169,110,0.2)' }}>
      <h3 className="font-display font-extrabold text-xl text-text-1 mb-2">
        {headline}
      </h3>
      <p className="text-text-2 text-sm mb-6 max-w-lg mx-auto">
        {body}
      </p>
      <Link
        to={buttonHref}
        style={{ background: 'linear-gradient(135deg, #c8a96e, #b8934a)', color: '#0f0e17', fontWeight: 600, padding: '12px 24px', borderRadius: '12px', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
      >
        {buttonText}
      </Link>
    </div>
  );
}

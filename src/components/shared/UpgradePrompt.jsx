export default function UpgradePrompt({ minPlan }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 40, marginBottom: 18 }}>🔒</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0eee8', marginBottom: 10 }}>
          {minPlan} plan required
        </h2>
        <p style={{ fontSize: 14, color: '#8c8a9e', marginBottom: 28, lineHeight: 1.7 }}>
          This feature is available on the{' '}
          <strong style={{ color: '#C9A24B' }}>{minPlan}</strong> plan and above.
          Contact us on WhatsApp to upgrade — we'll switch your plan within a few hours.
        </p>
        <a
          href="https://wa.me/919461888529?text=Hi%2C+I%27d+like+to+upgrade+my+Chakrio+plan"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            background: '#C9A24B', color: '#0E0B14',
            padding: '12px 28px', borderRadius: 10,
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}
        >
          Upgrade on WhatsApp →
        </a>
      </div>
    </div>
  );
}

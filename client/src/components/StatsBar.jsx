import { useEffect, useState } from 'react';

const S = {
  bar: {
    display: 'flex',
    gap: '1px',
    backgroundColor: '#1E1E1E',
    borderBottom: '1px solid #1E1E1E',
    flexShrink: 0,
  },
  card: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '10px',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  value: {
    fontSize: '22px',
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#F5F5F5',
  },
  progressTrack: {
    height: '2px',
    backgroundColor: '#1E1E1E',
    borderRadius: '2px',
    marginTop: '6px',
    overflow: 'hidden',
  },
  progressFill: (pct, color) => ({
    height: '100%',
    width: `${Math.min(pct * 100, 100)}%`,
    backgroundColor: color,
    borderRadius: '2px',
    transition: 'width 0.4s ease',
  }),
};

export default function StatsBar() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = () =>
      fetch('/api/stats')
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const fmt = (n) => (n ?? 0).toLocaleString();
  const pct = (n) => ((n ?? 0) * 100).toFixed(1) + '%';

  return (
    <div style={S.bar}>
      <div style={S.card}>
        <span style={S.label}>Total</span>
        <span style={S.value}>{fmt(stats?.total)}</span>
      </div>

      <div style={S.card}>
        <span style={S.label}>Flagged</span>
        <span style={{ ...S.value, color: '#FFB347' }}>{fmt(stats?.flagged)}</span>
      </div>

      <div style={S.card}>
        <span style={S.label}>Confirmed Fraud</span>
        <span style={{ ...S.value, color: '#FF3B5C' }}>{fmt(stats?.confirmed)}</span>
      </div>

      <div style={S.card}>
        <span style={S.label}>Dismissed</span>
        <span style={{ ...S.value, color: '#888888' }}>{fmt(stats?.dismissed)}</span>
      </div>

      <div style={S.card}>
        <span style={S.label}>Precision</span>
        <span style={{ ...S.value, color: '#FF6B2B' }}>{pct(stats?.precision)}</span>
        <div style={S.progressTrack}>
          <div style={S.progressFill(stats?.precision ?? 0, '#FF6B2B')} />
        </div>
      </div>

      <div style={S.card}>
        <span style={S.label}>Recall</span>
        <span style={{ ...S.value, color: '#FF6B2B' }}>{pct(stats?.recall)}</span>
        <div style={S.progressTrack}>
          <div style={S.progressFill(stats?.recall ?? 0, '#FFB347')} />
        </div>
      </div>
    </div>
  );
}
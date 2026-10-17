import { useRef, useEffect } from 'react';

const riskColor = (score) => {
  if (score >= 0.75) return '#FF3B5C';
  if (score >= 0.5) return '#FFB347';
  return '#22c55e';
};

const riskLabel = (score) => {
  if (score >= 0.75) return 'HIGH';
  if (score >= 0.5) return 'MED';
  return 'LOW';
};

const fmtAmount = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtTime = (ts) => {
  const d = new Date(ts);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const S = {
    container: {
    display: 'flex',
    flexDirection: 'column',
    height: '450px', // Matches your graph height so they align nicely!
    overflow: 'hidden',
  },
  header: {
    padding: '10px 16px',
    fontSize: '11px',
    color: '#888888',
    borderBottom: '1px solid #1E1E1E',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: '#0D0D0D',
  },
  headerTitle: {
    color: '#FF6B2B',
    fontWeight: '600',
    fontSize: '12px',
    letterSpacing: '0.05em',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#444',
    fontSize: '13px',
  },
  card: (isNew) => ({
    backgroundColor: '#111111',
    border: '1px solid #1E1E1E',
    borderRadius: '6px',
    padding: '10px 12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    opacity: isNew ? 0 : 1,
    animation: isNew ? 'fadeIn 0.3s ease forwards' : 'none',
    transition: 'border-color 0.15s ease',
  }),
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txId: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#888888',
  },
  badge: (score) => ({
    fontSize: '10px',
    fontWeight: '700',
    fontFamily: 'monospace',
    color: riskColor(score),
    border: `1px solid ${riskColor(score)}`,
    borderRadius: '4px',
    padding: '1px 6px',
    letterSpacing: '0.05em',
  }),
  accounts: {
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#F5F5F5',
  },
  amount: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#F5F5F5',
    fontFamily: 'monospace',
  },
  time: {
    fontSize: '10px',
    color: '#555',
  },
  reasons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '2px',
  },
  pill: {
    fontSize: '10px',
    backgroundColor: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: '4px',
    padding: '2px 6px',
    color: '#888888',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  }
};

export default function AlertFeed({ alerts, onSelectTx }) {
  const listRef = useRef(null);
  const prevCount = useRef(0);

  useEffect(() => {
    prevCount.current = alerts.length;
  }, [alerts]);

  if (!alerts.length) {
    return (
      <div style={S.container}>
        <div style={S.header}>
          <span style={S.headerTitle}>ALERT FEED</span>
          <span>0 alerts</span>
        </div>
        <div style={S.empty}>Monitoring… no alerts yet</div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .alert-card:hover { border-color: #FF6B2B !important; }
      `}</style>

      <div style={S.header}>
        <span style={S.headerTitle}>ALERT FEED</span>
        <span>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={S.list} ref={listRef}>
        {alerts.map((tx, i) => (
          <div
            key={tx.txId}
            className="alert-card"
            style={S.card(i === 0)}
            onClick={() => onSelectTx(tx)}
          >
            <div style={S.row}>
              <span style={S.txId}>{tx.txId?.slice(0, 16)}…</span>
              <span style={S.badge(tx.riskScore)}>{riskLabel(tx.riskScore)} {(tx.riskScore * 100).toFixed(0)}%</span>
            </div>

            <div style={S.row}>
              <span style={S.accounts}>{tx.fromAccount} → {tx.toAccount}</span>
              <span style={S.amount}>{fmtAmount(tx.amount)}</span>
            </div>

            {tx.riskReasons?.length > 0 && (
              <div style={S.reasons}>
                {tx.riskReasons.map((r, j) => (
                  <span key={j} style={S.pill}>{r}</span>
                ))}
              </div>
            )}

            <span style={S.time}>{fmtTime(tx.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
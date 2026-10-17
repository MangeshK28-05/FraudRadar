import { useState } from 'react';

const fmtAmount = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const riskColor = (score) => {
  if (score >= 0.75) return '#FF3B5C';
  if (score >= 0.5) return '#FFB347';
  return '#22c55e';
};

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  },
  modal: {
    backgroundColor: '#111111',
    border: '1px solid #1E1E1E',
    borderRadius: '8px',
    width: '480px',
    maxWidth: '90vw',
    maxHeight: '85vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #1E1E1E',
  },
  title: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#FF6B2B',
    letterSpacing: '0.05em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
    padding: '2px 6px',
  },
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  rowLabel: {
    color: '#888888',
  },
  rowValue: {
    fontFamily: 'monospace',
    color: '#F5F5F5',
    textAlign: 'right',
    maxWidth: '60%',
    wordBreak: 'break-all',
  },
  divider: {
    height: '1px',
    backgroundColor: '#1E1E1E',
  },
  reasonsTitle: {
    fontSize: '11px',
    color: '#888',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  reasons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  reason: {
    fontSize: '12px',
    color: '#FFB347',
    padding: '5px 8px',
    backgroundColor: 'rgba(255,179,71,0.08)',
    borderRadius: '4px',
    border: '1px solid rgba(255,179,71,0.15)',
  },
  textarea: {
    width: '100%',
    backgroundColor: '#0D0D0D',
    border: '1px solid #1E1E1E',
    borderRadius: '6px',
    color: '#F5F5F5',
    fontSize: '13px',
    padding: '10px',
    resize: 'vertical',
    minHeight: '70px',
    fontFamily: 'system-ui, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    padding: '16px 20px',
    borderTop: '1px solid #1E1E1E',
  },
  btnConfirm: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#FF3B5C',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.03em',
  },
  btnDismiss: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#1A1A1A',
    color: '#888888',
    border: '1px solid #2A2A2A',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default function CaseModal({ tx, onClose, onUpdate }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!tx) return null;

  const act = async (status) => {
    setLoading(true);
    try {
      await fetch(`/api/transactions/${tx.txId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      onUpdate(tx.txId, status);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setNotes('');
    }
  };

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.header}>
          <span style={S.title}>CASE REVIEW</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>
          <div style={S.row}>
            <span style={S.rowLabel}>Transaction ID</span>
            <span style={{ ...S.rowValue, fontSize: '11px', color: '#888' }}>{tx.txId}</span>
          </div>
          <div style={S.row}>
            <span style={S.rowLabel}>From</span>
            <span style={S.rowValue}>{tx.fromAccount}</span>
          </div>
          <div style={S.row}>
            <span style={S.rowLabel}>To</span>
            <span style={S.rowValue}>{tx.toAccount}</span>
          </div>
          <div style={S.row}>
            <span style={S.rowLabel}>Amount</span>
            <span style={{ ...S.rowValue, color: '#FF6B2B', fontWeight: '700', fontSize: '16px' }}>
              {fmtAmount(tx.amount)}
            </span>
          </div>
          <div style={S.row}>
            <span style={S.rowLabel}>Risk Score</span>
            <span style={{ ...S.rowValue, color: riskColor(tx.riskScore), fontWeight: '700' }}>
              {(tx.riskScore * 100).toFixed(1)}%
            </span>
          </div>
          <div style={S.row}>
            <span style={S.rowLabel}>Status</span>
            <span style={{ ...S.rowValue, color: '#888' }}>{tx.status}</span>
          </div>
          <div style={S.row}>
            <span style={S.rowLabel}>Time</span>
            <span style={{ ...S.rowValue, color: '#888', fontSize: '12px' }}>
              {new Date(tx.timestamp).toLocaleString()}
            </span>
          </div>

          {tx.riskReasons?.length > 0 && (
            <div>
              <div style={S.divider} />
              <div style={{ marginTop: '12px' }}>
                <div style={S.reasonsTitle}>Risk Signals</div>
                <div style={S.reasons}>
                  {tx.riskReasons.map((r, i) => (
                    <div key={i} style={S.reason}>⚠ {r}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={S.divider} />
          <textarea
            style={S.textarea}
            placeholder="Add case notes (optional)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={S.actions}>
          <button style={S.btnConfirm} onClick={() => act('confirmed')} disabled={loading}>
            {loading ? 'Saving…' : '⚑ Confirm Fraud'}
          </button>
          <button style={S.btnDismiss} onClick={() => act('dismissed')} disabled={loading}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
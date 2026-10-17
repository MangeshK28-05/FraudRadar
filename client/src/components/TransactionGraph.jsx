import { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const S = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  header: {
    padding: '10px 16px',
    fontSize: '12px',
    color: '#FF6B2B',
    fontWeight: '600',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #1E1E1E',
    backgroundColor: '#0D0D0D',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  meta: {
    fontSize: '11px',
    color: '#888',
    fontWeight: '400',
  },
  graphWrap: {
    flex: 1,
    minHeight: '450px', // Forces the canvas to actually show up!
    position: 'relative',
    overflow: 'hidden',
  },
  loading: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#444',
    fontSize: '13px',
    fontFamily: 'monospace',
  },
};

export default function TransactionGraph({ transactions }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dims, setDims] = useState({ w: 600, h: 400 });
  const wrapRef = useRef(null);

  // Measure container
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Fetch graph from API
  useEffect(() => {
    fetch('/api/graph')
      .then((r) => r.json())
      .then((data) => {
        // API returns { nodes, edges, clusters }
        const fraudAccounts = new Set();
        (data.clusters || []).forEach((c) => c.forEach((acc) => fraudAccounts.add(acc)));

        const nodes = (data.nodes || []).map((n) => ({
          id: n.id || n,
          isFraud: fraudAccounts.has(n.id || n),
        }));

        const links = (data.edges || []).map((e) => ({
          source: e.source || e.from,
          target: e.target || e.to,
          isFraud: e.isFraud || false,
          value: e.amount || 1,
        }));

        setGraphData({ nodes, links });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);


// Merge live transactions into graph
  useEffect(() => {
    if (!transactions.length) return;

    setGraphData((prev) => {
      const nodeMap = new Map(prev.nodes.map((n) => [n.id, n]));
      const linkMap = new Map(
        prev.links.map((l) => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return [`${sId}-${tId}`, l];
        })
      );
      let changed = false;

      transactions.forEach((tx) => {
        if (!nodeMap.has(tx.fromAccount)) {
          nodeMap.set(tx.fromAccount, { id: tx.fromAccount, isFraud: tx.isFraud });
          changed = true;
        }
        if (!nodeMap.has(tx.toAccount)) {
          nodeMap.set(tx.toAccount, { id: tx.toAccount, isFraud: tx.isFraud });
          changed = true;
        }

        const key = `${tx.fromAccount}-${tx.toAccount}`;
        if (!linkMap.has(key)) {
          linkMap.set(key, {
            source: tx.fromAccount,
            target: tx.toAccount,
            isFraud: tx.isFraud || false,
            value: tx.amount || 1,
          });
          changed = true;
        }
      });

      if (!changed) return prev;

      return {
        nodes: Array.from(nodeMap.values()),
        links: Array.from(linkMap.values()),
      };
    });
  }, [transactions]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const r = 5;
    const color = node.isFraud ? '#FF3B5C' : '#444444';
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    if (globalScale > 1.5) {
      ctx.font = `${10 / globalScale}px monospace`;
      ctx.fillStyle = '#888888';
      ctx.textAlign = 'center';
      ctx.fillText(node.id, node.x, node.y + r + 4 / globalScale);
    }
  }, []);

  const linkColor = useCallback((link) => (link.isFraud ? '#FF3B5C44' : '#2A2A2A'), []);
  const linkWidth = useCallback((link) => (link.isFraud ? 1.5 : 0.5), []);

  return (
    <div style={S.container}>
      <div style={S.header}>
        ACCOUNT GRAPH
        <span style={S.meta}>
          {graphData.nodes.length} nodes · {graphData.links.length} edges
        </span>
      </div>
      <div style={S.graphWrap} ref={wrapRef}>
        {loading ? (
          <div style={S.loading}>Loading graph…</div>
        ) : (
          <ForceGraph2D
            width={dims.w}
            height={dims.h}
            graphData={graphData}
            backgroundColor="#0A0A0A"
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => 'replace'}
            linkColor={linkColor}
            linkWidth={linkWidth}
            enableZoomInteraction
            enablePanInteraction
            cooldownTicks={80}
          />
        )}
      </div>
    </div>
  );
}
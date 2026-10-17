
/**
 * server/graphAnalyzer.js
 *
 * Builds a transaction graph, finds connected components,
 * and flags accounts involved in suspicious activity.
 *
 * @param {Array<{
 *   fromAccount: string,
 *   toAccount: string,
 *   amount: number,
 *   riskScore: number
 * }>} transactions
 *
 * @returns {{
 *   nodes: Array<{id: string, txCount: number, totalAmount: number, flagged: boolean}>,
 *   edges: Array<{from: string, to: string, amount: number, riskScore: number}>,
 *   clusters: string[][]
 * }}
 */
function analyzeGraph(transactions) {
  if (!Array.isArray(transactions)) {
    throw new TypeError("transactions must be an array");
  }

  const adjacencyList = new Map();
  const accountStats = new Map();
  const edges = [];

  function addAccount(accountId) {
    if (!adjacencyList.has(accountId)) {
      adjacencyList.set(accountId, new Set());
      accountStats.set(accountId, {
        txCount: 0,
        totalAmount: 0,
      });
    }
  }

  // 1. Build the graph and collect transaction statistics.
  for (const tx of transactions) {
    const { fromAccount, toAccount, amount, riskScore } = tx;

    addAccount(fromAccount);
    addAccount(toAccount);

    // Treat transfers as undirected links for clustering.
    adjacencyList.get(fromAccount).add(toAccount);
    adjacencyList.get(toAccount).add(fromAccount);

    // Preserve each transaction as a directed edge.
    edges.push({
      from: fromAccount,
      to: toAccount,
      amount,
      riskScore,
    });

    // Count each transaction once for each participating account.
    accountStats.get(fromAccount).txCount += 1;
    accountStats.get(fromAccount).totalAmount += amount;

    accountStats.get(toAccount).txCount += 1;
    accountStats.get(toAccount).totalAmount += amount;
  }

  // 2. Find connected components using BFS.
  const visited = new Set();
  const clusters = [];
  const clusteredAccounts = new Set();

  for (const accountId of adjacencyList.keys()) {
    if (visited.has(accountId)) continue;

    const queue = [accountId];
    const component = [];
    let head = 0;

    visited.add(accountId);

    while (head < queue.length) {
      const current = queue[head++];
      component.push(current);

      for (const neighbor of adjacencyList.get(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // Only retain groups containing at least three accounts.
    if (component.length >= 3) {
      clusters.push(component);

      for (const id of component) {
        clusteredAccounts.add(id);
      }
    }
  }

  // 3. Build the final node list and determine flagged status.
  const nodes = [];

  for (const [id, stats] of accountStats.entries()) {
    nodes.push({
      id,
      txCount: stats.txCount,
      totalAmount: stats.totalAmount,
      flagged:
        stats.txCount > 3 || clusteredAccounts.has(id),
    });
  }

  return {
    nodes,
    edges,
    clusters,
  };
}

module.exports = { analyzeGraph };

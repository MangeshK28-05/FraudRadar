
'use strict';

function scoreTransaction(transaction, recentHistory) {
  const { fromAccount, toAccount, amount, timestamp } = transaction;

  const riskReasons = [];
  let riskScore = 0;

  const addRisk = (score, reason) => {
    riskScore += score;
    riskReasons.push({ score, reason });
  };

  const currentTime = new Date(timestamp).getTime();

  // Rule 1: Compare against the account's historical average.
  const accountTransactions = recentHistory.filter(
    (tx) => tx.fromAccount === fromAccount
  );

  if (accountTransactions.length > 0) {
    const averageAmount =
      accountTransactions.reduce((sum, tx) => sum + tx.amount, 0) /
      accountTransactions.length;

    if (amount > 3 * averageAmount) {
      addRisk(
        0.4,
        'Amount is 3x higher than this account’s average'
      );
    }
  }

  // Rule 2: Flag accounts that appear fewer than three times.
  if (accountTransactions.length < 3) {
    addRisk(0.2, 'Rarely seen account');
  }

  // Rule 3: Count transactions from this account in the last 60 seconds.
  const recentAccountTransactions = accountTransactions.filter((tx) => {
    const txTime = new Date(tx.timestamp).getTime();
    const age = currentTime - txTime;

    return age >= 0 && age <= 60_000;
  });

  if (recentAccountTransactions.length > 4) {
    addRisk(0.35, 'Rapid fire transfers from same account');
  }

  // Rule 4: Flag large transfers.
  if (amount > 5000) {
    addRisk(0.25, 'Large transfer amount');
  }

  // Rule 5: Check whether the destination recently sent another transfer.
  const hasChainTransfer = recentHistory.some((tx) => {
    if (tx.fromAccount !== toAccount) {
      return false;
    }

    const txTime = new Date(tx.timestamp).getTime();
    const age = currentTime - txTime;

    return age >= 0 && age <= 30_000;
  });

  if (hasChainTransfer) {
    addRisk(0.3, 'Linked to a chain transfer');
  }

  // Sort reasons by contribution, highest first.
  riskReasons.sort((a, b) => b.score - a.score);

  return {
    riskScore: Math.min(riskScore, 1.0),
    riskReasons: riskReasons.map((item) => item.reason),
  };
}

module.exports = { scoreTransaction };
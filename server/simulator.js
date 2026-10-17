const { v4: uuidv4 } = require('uuid');

const ACCOUNTS = Array.from({ length: 15 }, (_, i) =>
  `ACC_${String(i + 1).padStart(3, '0')}`
);

const randomAccount = () =>
  ACCOUNTS[Math.floor(Math.random() * ACCOUNTS.length)];

const randomAmount = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function randomDifferentAccount(account) {
  let target;

  do {
    target = randomAccount();
  } while (target === account);

  return target;
}

function createTransaction({
  fromAccount,
  toAccount,
  amount,
  isFraud = false,
  fraudType = null,
}) {
  return {
    txId: uuidv4(),
    fromAccount,
    toAccount,
    amount,
    timestamp: new Date(),
    isFraud,
    fraudType,
  };
}

function startSimulator(emitter) {
  if (!emitter || typeof emitter.emit !== 'function') {
    throw new TypeError('Expected an EventEmitter instance');
  }

  function emitTransaction(transaction) {
    emitter.emit('transaction', transaction);
  }

  function emitNormalTransaction() {
    const fromAccount = randomAccount();

    emitTransaction(
      createTransaction({
        fromAccount,
        toAccount: randomDifferentAccount(fromAccount),
        amount: randomAmount(10, 500),
      })
    );
  }

  function emitLargeTransfer() {
    const fromAccount = randomAccount();

    emitTransaction(
      createTransaction({
        fromAccount,
        toAccount: randomDifferentAccount(fromAccount),
        amount: randomAmount(8000, 50000),
        isFraud: true,
        fraudType: 'large_transfer',
      })
    );
  }

  function emitRapidFire() {
    const fromAccount = randomAccount();

    let count = 0;

    const timer = setInterval(() => {
      emitTransaction(
        createTransaction({
          fromAccount,
          toAccount: randomDifferentAccount(fromAccount),
          amount: randomAmount(1, 50),
          isFraud: true,
          fraudType: 'rapid_fire',
        })
      );

      count++;

      if (count === 6) {
        clearInterval(timer);
      }
    }, 100);
  }

  function emitChainTransfer() {
    const chain = [];

    while (chain.length < 5) {
      const account = randomAccount();

      if (!chain.includes(account)) {
        chain.push(account);
      }
    }

    const amount = randomAmount(500, 2000);

    for (let i = 0; i < 4; i++) {
      emitTransaction(
        createTransaction({
          fromAccount: chain[i],
          toAccount: chain[i + 1],
          amount,
          isFraud: true,
          fraudType: 'chain',
        })
      );
    }
  }

  return setInterval(() => {
    const roll = Math.random();

    if (roll < 0.75) {
      emitNormalTransaction();
    } else if (roll < 0.85) {
      emitLargeTransfer();
    } else if (roll < 0.95) {
      emitRapidFire();
    } else {
      emitChainTransfer();
    }
  }, 20000);
}

module.exports = { startSimulator };

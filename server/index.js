require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const EventEmitter = require('events');
const cors = require('cors');

const { connectDB, Transaction } = require('./db');
const { startSimulator } = require('./simulator');
const { scoreTransaction } = require('./scorer');
const { analyzeGraph } = require('./graphAnalyzer');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.use(cors());
app.use(express.json());

// Keep the newest transactions first, up to 100 entries.
const recentHistory = [];
const MAX_HISTORY = 100;
const ALERT_THRESHOLD = 0.5;

// Basic health check.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/transactions
// Return the latest 50 transactions from MongoDB.
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(transactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/graph
// Analyze the recent in-memory transaction history.
app.get('/api/graph', async (req, res) => {
  try {
    const graph = await analyzeGraph(recentHistory);
    res.json(graph);
  } catch (error) {
    console.error('Failed to analyze transaction graph:', error);
    res.status(500).json({ error: 'Failed to analyze transaction graph' });
  }
});

// GET /api/stats
// Return aggregate fraud detection statistics.
app.get('/api/stats', async (req, res) => {
  try {
    const [
      total,
      flagged,
      confirmed,
      dismissed,
    ] = await Promise.all([
      Transaction.countDocuments({}),
      Transaction.countDocuments({
        riskScore: { $gt: ALERT_THRESHOLD },
      }),
      Transaction.countDocuments({ status: 'confirmed' }),
      Transaction.countDocuments({ status: 'dismissed' }),
    ]);

    const reviewed = confirmed + dismissed;

    const precision =
      reviewed > 0 ? confirmed / reviewed : 0;

    const recall =
      flagged > 0 ? confirmed / flagged : 0;

    res.json({
      total,
      flagged,
      confirmed,
      dismissed,
      precision,
      recall,
    });
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// PATCH /api/transactions/:txId
// Update the status and/or notes of a transaction.
app.patch('/api/transactions/:txId', async (req, res) => {
  try {
    const { txId } = req.params;
    const { status, notes } = req.body;

    const updates = {};

    if (status !== undefined) {
      updates.status = status;
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Provide at least one field: status or notes',
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { txId },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Failed to update transaction:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Invalid transaction update',
        details: error.message,
      });
    }

    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Send the latest 20 in-memory transactions to each new client.
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit('recentTransactions', recentHistory.slice(0, 20));

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Process simulator events in order so concurrent events do not
// cause history ordering issues or overlapping transaction writes.
async function processTransaction(transaction) {
  try {
    if (!transaction || typeof transaction !== 'object') {
      throw new Error('Simulator emitted an invalid transaction');
    }

    // Score against the existing history before adding this transaction.
    const score = await scoreTransaction(transaction, recentHistory);

    transaction.riskScore = score.riskScore;
    transaction.riskReasons = score.riskReasons;

    // Persist before broadcasting the transaction.
    const savedTransaction = await new Transaction(transaction).save();
    const saved = savedTransaction.toObject();

    // Newest transaction first.
    recentHistory.unshift(saved);

    if (recentHistory.length > MAX_HISTORY) {
      recentHistory.length = MAX_HISTORY;
    }

    // Broadcast to every connected client.
    io.emit('newTransaction', saved);

    if (saved.riskScore > ALERT_THRESHOLD) {
      io.emit('newAlert', saved);
    }
  } catch (error) {
    console.error('Failed to process transaction:', error);
  }
}

async function startServer() {
  try {
    // Connect to MongoDB before starting the simulator or listening.
    await connectDB();
    console.log('MongoDB connected');

    const eventEmitter = new EventEmitter();

    // Serialize asynchronous processing of simulator events.
    let processingQueue = Promise.resolve();

    eventEmitter.on('transaction', (transaction) => {
      processingQueue = processingQueue
        .then(() => processTransaction(transaction))
        .catch((error) => {
          // Keep the queue alive if an unexpected error escapes.
          console.error('Transaction processing queue error:', error);
        });
    });

    startSimulator(eventEmitter);

    const port = Number(process.env.PORT) || 3001;

    server.listen(port, () => {
      console.log(`FraudRadar server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start FraudRadar:', error);
    process.exitCode = 1;
  }
}

startServer();

// Gracefully close the HTTP server and MongoDB connection.
async function shutdown(signal) {
  console.log(`${signal} received. Shutting down FraudRadar...`);

  server.close(async () => {
    try {
      const mongoose = require('mongoose');
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = { app, server, io, recentHistory };

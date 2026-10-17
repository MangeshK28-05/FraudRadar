require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
};

const transactionSchema = new mongoose.Schema({
  txId: {
    type: String,
    required: true,
    unique: true,
  },
  fromAccount: {
    type: String,
    required: true,
  },
  toAccount: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  riskReasons: {
    type: [String],
    default: [],
  },
  isFraud: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "dismissed"],
    default: "pending",
  },
  notes: {
    type: String,
    default: "",
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = { connectDB, Transaction };

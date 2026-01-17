const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transaction_type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    maxlength: 200
  },
  category: {
    type: String,
    default: '',
    maxlength: 50
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false, // We're handling timestamps manually
  collection: 'transactions'
});

// Index for faster queries
transactionSchema.index({ date: -1, created_at: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;


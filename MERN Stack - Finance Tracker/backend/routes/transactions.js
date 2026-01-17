const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Get all transactions with summary
router.get('/', async (req, res) => {
  try {
    // Get all transactions, ordered by date (newest first)
    const transactions = await Transaction.find()
      .sort({ date: -1, created_at: -1 })
      .limit(50)
      .lean();

    // Calculate totals
    const allTransactions = await Transaction.find().lean();
    
    const total_income = allTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const total_expense = allTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = total_income - total_expense;

    // Get transactions for this month
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthTransactions = await Transaction.find({
      date: { $gte: monthStart }
    }).lean();
    
    const month_income = monthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const month_expense = monthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        transactions,
        total_income: parseFloat(total_income.toFixed(2)),
        total_expense: parseFloat(total_expense.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        month_income: parseFloat(month_income.toFixed(2)),
        month_expense: parseFloat(month_expense.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add a new transaction
router.post('/', async (req, res) => {
  try {
    const { type, amount, description, category, date, notes } = req.body;

    // Validate required fields
    if (!type || amount === undefined || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, amount, or description'
      });
    }

    // Validate transaction type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type. Must be "income" or "expense"'
      });
    }

    // Parse date
    let transactionDate = new Date();
    if (date) {
      transactionDate = new Date(date);
      if (isNaN(transactionDate.getTime())) {
        transactionDate = new Date();
      }
    }

    const transaction = new Transaction({
      transaction_type: type,
      amount: parseFloat(amount),
      description: description.trim(),
      category: category ? category.trim() : '',
      date: transactionDate,
      notes: notes ? notes.trim() : '',
      created_at: new Date(),
      updated_at: new Date()
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      data: {
        id: transaction._id,
        message: 'Transaction added successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete a transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByIdAndDelete(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


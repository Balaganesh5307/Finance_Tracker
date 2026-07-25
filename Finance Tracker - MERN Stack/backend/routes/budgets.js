const express = require('express');
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const router = express.Router();
router.use(auth);

// GET /api/budgets
router.get('/', async (req, res) => {
    try {
        const budgets = await Budget.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(budgets);
    } catch (err) {
        console.error('Fetch Budgets Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/budgets (Upsert budget limit)
router.post('/', async (req, res) => {
    try {
        const { category, limit, month } = req.body;

        const currentMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM

        const budget = await Budget.findOneAndUpdate(
            { user: req.user.id, category: category.trim(), month: currentMonth },
            { $set: { limit: parseFloat(limit) } },
            { new: true, upsert: true }
        );

        res.status(201).json(budget);
    } catch (err) {
        console.error('Upsert Budget Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
    try {
        const budget = await Budget.findOne({ _id: req.params.id, user: req.user.id });
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        await Budget.findByIdAndDelete(req.params.id);
        res.json({ message: 'Budget limit deleted' });
    } catch (err) {
        console.error('Delete Budget Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/budgets/status (Fetch remaining limit stats)
router.get('/status', async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().slice(0, 7);
        const budgets = await Budget.find({ user: req.user.id, month });

        const startOfMonth = new Date(month + '-01');
        const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

        // Fetch transaction aggregate totals for current month
        const transactions = await Transaction.find({
            user: req.user.id,
            type: 'expense',
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const status = budgets.map(b => {
            const totalSpent = transactions
                .filter(t => t.category.toLowerCase() === b.category.toLowerCase())
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                id: b._id,
                category: b.category,
                limit: b.limit,
                spent: totalSpent,
                remaining: Math.max(0, b.limit - totalSpent),
                percentage: Math.min(100, (totalSpent / b.limit) * 100)
            };
        });

        res.json(status);
    } catch (err) {
        console.error('Budget Status Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

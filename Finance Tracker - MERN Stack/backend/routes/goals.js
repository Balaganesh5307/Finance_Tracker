const express = require('express');
const auth = require('../middleware/auth');
const SavingGoal = require('../models/SavingGoal');

const router = express.Router();
router.use(auth);

// GET /api/goals
router.get('/', async (req, res) => {
    try {
        const goals = await SavingGoal.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(goals);
    } catch (err) {
        console.error('Fetch Goals Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/goals
router.post('/', async (req, res) => {
    try {
        const { name, targetAmount, currentAmount, targetDate } = req.body;

        const goal = new SavingGoal({
            user: req.user.id,
            name,
            targetAmount: parseFloat(targetAmount),
            currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
            targetDate: new Date(targetDate)
        });

        await goal.save();
        res.status(201).json(goal);
    } catch (err) {
        console.error('Create Goal Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/goals/:id (Update saved amount / details)
router.put('/:id', async (req, res) => {
    try {
        const { name, targetAmount, currentAmount, targetDate } = req.body;

        let goal = await SavingGoal.findOne({ _id: req.params.id, user: req.user.id });
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        goal.name = name || goal.name;
        if (targetAmount !== undefined) goal.targetAmount = parseFloat(targetAmount);
        if (currentAmount !== undefined) goal.currentAmount = parseFloat(currentAmount);
        if (targetDate) goal.targetDate = new Date(targetDate);

        await goal.save();
        res.json(goal);
    } catch (err) {
        console.error('Update Goal Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res) => {
    try {
        const goal = await SavingGoal.findOne({ _id: req.params.id, user: req.user.id });
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }
        await SavingGoal.findByIdAndDelete(req.params.id);
        res.json({ message: 'Saving goal deleted' });
    } catch (err) {
        console.error('Delete Goal Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

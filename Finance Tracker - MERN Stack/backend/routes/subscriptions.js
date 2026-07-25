const express = require('express');
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const { processSubscriptions } = require('../services/cronService');

const router = express.Router();
router.use(auth);

// GET /api/subscriptions
router.get('/', async (req, res) => {
    try {
        const subs = await Subscription.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(subs);
    } catch (err) {
        console.error('Fetch Subscriptions Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/subscriptions
router.post('/', async (req, res) => {
    try {
        const { name, amount, type, category, frequency, nextBillingDate } = req.body;

        const sub = new Subscription({
            user: req.user.id,
            name,
            amount,
            type,
            category: category || 'Other',
            frequency,
            nextBillingDate: new Date(nextBillingDate)
        });

        await sub.save();
        res.status(201).json(sub);
    } catch (err) {
        console.error('Create Subscription Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/subscriptions/:id
router.delete('/:id', async (req, res) => {
    try {
        const sub = await Subscription.findOne({ _id: req.params.id, user: req.user.id });
        if (!sub) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        await Subscription.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subscription deleted' });
    } catch (err) {
        console.error('Delete Subscription Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/subscriptions/trigger-cron (Manual trigger for testing)
router.post('/trigger-cron', async (req, res) => {
    try {
        await processSubscriptions();
        res.json({ success: true, message: 'Cron processed successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to trigger cron', error: err.message });
    }
});

module.exports = router;

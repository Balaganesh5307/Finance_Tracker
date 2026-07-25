const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const Budget = require('../models/Budget');
const SavingGoal = require('../models/SavingGoal');
const Config = require('../models/Config');

const router = express.Router();

const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/admin/users
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (err) {
        console.error('Fetch Admin Users Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/stats (Platform Wide Aggregates)
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTransactions = await Transaction.countDocuments();

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({
            lastLogin: { $gte: sevenDaysAgo }
        });

        const startOfMonth = new Date(new Date().setDate(1));
        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        // 1. Total Platform Volume
        const allVolume = await Transaction.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalPlatformVolume = allVolume.length > 0 ? allVolume[0].total : 0;

        // 2. DB Diagnostics Counts
        const dbHealth = {
            users: totalUsers,
            transactions: totalTransactions,
            subscriptions: await Subscription.countDocuments(),
            budgets: await Budget.countDocuments(),
            goals: await SavingGoal.countDocuments()
        };

        const transactionsByType = await Transaction.aggregate([
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            totalUsers,
            totalTransactions,
            activeUsers,
            newUsersThisMonth,
            totalPlatformVolume,
            dbHealth,
            transactionsByType
        });
    } catch (err) {
        console.error('Fetch Stats Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/users/:id/role (Promote/Demote)
router.put('/users/:id/role', auth, adminAuth, async (req, res) => {
    try {
        const { role } = req.body;
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role parameter' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { role } },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Update User Role Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/users/:id/status (Suspend/Reinstate)
router.put('/users/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const { suspended } = req.body;
        if (suspended === undefined) {
            return res.status(400).json({ message: 'Suspended state is required' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { suspended: !!suspended } },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Update User Status Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/users/:id/transactions (Support View)
router.get('/users/:id/transactions', auth, adminAuth, async (req, res) => {
    try {
        const txs = await Transaction.find({ user: req.params.id }).sort({ date: -1 });
        res.json(txs);
    } catch (err) {
        console.error('Fetch Support Transactions Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/configs (Fetch Config Settings)
router.get('/configs', auth, adminAuth, async (req, res) => {
    try {
        const configs = await Config.find({});
        res.json(configs);
    } catch (err) {
        console.error('Fetch Configs Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/configs (Upsert Config)
router.post('/configs', auth, adminAuth, async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) {
            return res.status(400).json({ message: 'Config key is required' });
        }

        const config = await Config.findOneAndUpdate(
            { key: key.trim() },
            { $set: { value: value } },
            { new: true, upsert: true }
        );

        res.json(config);
    } catch (err) {
        console.error('Upsert Config Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await Promise.all([
            Transaction.deleteMany({ user: req.params.id }),
            Subscription.deleteMany({ user: req.params.id }),
            Budget.deleteMany({ user: req.params.id }),
            SavingGoal.deleteMany({ user: req.params.id }),
            User.findByIdAndDelete(req.params.id)
        ]);

        res.json({ message: 'User and all associated data deleted successfully' });
    } catch (err) {
        console.error('Delete User Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

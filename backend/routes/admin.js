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

// GET /api/admin/ai-usage
router.get('/ai-usage', auth, adminAuth, async (req, res) => {
    try {
        const AIUsageLog = require('../models/AIUsageLog');

        // Monthly total usage stats
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);

        const currentMonthUsage = await AIUsageLog.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: '$apiType',
                    totalTokens: { $sum: '$totalTokens' },
                    promptTokens: { $sum: '$promptTokens' },
                    completionTokens: { $sum: '$completionTokens' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalUsage = await AIUsageLog.aggregate([
            {
                $group: {
                    _id: '$apiType',
                    totalTokens: { $sum: '$totalTokens' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // System configuration limits
        const GROQ_LIMIT = 1000000;
        const GEMINI_LIMIT = 500000;

        const monthlyStats = {
            groq: { used: 0, limit: GROQ_LIMIT, left: GROQ_LIMIT, count: 0 },
            gemini: { used: 0, limit: GEMINI_LIMIT, left: GEMINI_LIMIT, count: 0 }
        };

        currentMonthUsage.forEach(usage => {
            if (monthlyStats[usage._id]) {
                monthlyStats[usage._id].used = usage.totalTokens;
                monthlyStats[usage._id].count = usage.count;
                monthlyStats[usage._id].left = Math.max(0, monthlyStats[usage._id].limit - usage.totalTokens);
            }
        });

        // 15 days daily trend for charts
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        fifteenDaysAgo.setHours(0,0,0,0);

        const dailyTrends = await AIUsageLog.aggregate([
            { $match: { createdAt: { $gte: fifteenDaysAgo } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        apiType: "$apiType"
                    },
                    tokens: { $sum: "$totalTokens" }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        // Format dailyTrends into Recharts friendly structure: [{ date: '2026-07-26', groq: 1200, gemini: 800 }]
        const trendMap = {};
        dailyTrends.forEach(item => {
            const date = item._id.date;
            const apiType = item._id.apiType;
            if (!trendMap[date]) {
                trendMap[date] = { date, groq: 0, gemini: 0 };
            }
            trendMap[date][apiType] = item.tokens;
        });
        const chartData = Object.values(trendMap);

        // Fetch detailed logs (recent 50)
        const logs = await AIUsageLog.find({})
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            monthlyStats,
            totalUsage,
            chartData,
            logs
        });
    } catch (err) {
        console.error('Fetch AI Usage Stats Error:', err.message);
        res.status(500).json({ message: 'Server error fetching AI usage stats.' });
    }
});

// POST /api/admin/configs/test - Validate a key in settings
router.post('/configs/test', auth, adminAuth, async (req, res) => {
    const { key, value } = req.body;
    if (!key) {
        return res.status(400).json({ message: 'Key is required to test.' });
    }

    let testValue = value;
    if (!testValue) {
        const Config = require('../models/Config');
        const configObj = await Config.findOne({ key: key.trim() });
        testValue = configObj ? configObj.value : process.env[key];
    }

    if (!testValue) {
        return res.status(400).json({ message: `API Key '${key}' is not configured.` });
    }

    try {
        if (key === 'GROQ_API_KEY') {
            const Groq = require('groq-sdk');
            const groqClient = new Groq({ apiKey: testValue });
            await groqClient.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: 'Respond with OK.' }],
                max_tokens: 3
            });
            return res.json({ success: true, message: 'Groq API Key is valid and working.' });
        } else if (key === 'GEMINI_API_KEY') {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(testValue);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            await model.generateContent("Respond with OK.");
            return res.json({ success: true, message: 'Gemini API Key is valid and working.' });
        } else {
            return res.status(400).json({ message: 'Unsupported key validation.' });
        }
    } catch (err) {
        console.error(`Key test error for ${key}:`, err.message);
        return res.status(400).json({
            success: false,
            message: `Key validation failed: ${err.message}`
        });
    }
});

module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const Budget = require('../models/Budget');
const SavingGoal = require('../models/SavingGoal');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Determine role based on email overrides
        let role = 'user';
        if (
            email.toLowerCase() === 'admin5307@gmail.com' ||
            email.toLowerCase() === 'balaganesh.masterad@gmail.com'
        ) {
            role = 'admin';
        }

        // Create new user (pre-save hook hashes password)
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            role
        });

        await newUser.save();

        const token = jwt.sign(
            {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                country: newUser.country,
                currency: newUser.currency,
                avatar: newUser.avatar
            }
        });
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                country: user.country,
                currency: user.currency,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Google Identity Login Verification
router.post('/google-login', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ success: false, message: 'Google credential is required' });
        }

        // Verify the token with Google
        const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
        const tokenRes = await fetch(tokenInfoUrl);
        if (!tokenRes.ok) {
            return res.status(400).json({ success: false, message: 'Invalid Google credential token' });
        }

        const payload = await tokenRes.json();
        const { email, name, email_verified } = payload;

        if (!email_verified) {
            return res.status(400).json({ success: false, message: 'Google email not verified' });
        }

        // Find or create user
        let user = await User.findOne({ email: email.toLowerCase() });
        let role = 'user';
        if (
            email.toLowerCase() === 'admin5307@gmail.com' ||
            email.toLowerCase() === 'balaganesh.masterad@gmail.com'
        ) {
            role = 'admin';
        }

        if (!user) {
            const randomPassword = require('crypto').randomBytes(16).toString('hex');
            user = new User({
                name: name || 'Google User',
                email: email.toLowerCase(),
                password: randomPassword,
                role: role
            });
        } else {
            if (role === 'admin' && user.role !== 'admin') {
                user.role = 'admin';
            }
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                country: user.country,
                currency: user.currency,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('Google Login Error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/auth/user
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            country: user.country,
            currency: user.currency,
            avatar: user.avatar
        });
    } catch (err) {
        console.error('Get User Error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/auth/profile (Update details)
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, country, currency, avatar } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (country !== undefined) user.country = country;
        if (currency !== undefined) user.currency = currency;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                country: user.country,
                currency: user.currency,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('Update Profile Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current password and new password' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        user.password = newPassword;
        await user.save(); // Password will be hashed by userSchema pre-save hook

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change Password Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/auth/delete-account
router.delete('/delete-account', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        await Promise.all([
            User.findByIdAndDelete(userId),
            Transaction.deleteMany({ user: userId }),
            Subscription.deleteMany({ user: userId }),
            Budget.deleteMany({ user: userId }),
            SavingGoal.deleteMany({ user: userId })
        ]);

        res.json({ success: true, message: 'Account and all associated records deleted successfully.' });
    } catch (err) {
        console.error('Delete Account Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/auth/stats (Personal stats aggregates)
router.get('/stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const txCount = await Transaction.countDocuments({ user: userId });

        const diffTime = Math.abs(new Date() - new Date(user.createdAt));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const transactions = await Transaction.find({ user: userId, type: 'expense' });
        const categories = {};
        transactions.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

        let topCategory = 'None';
        let topSpent = 0;
        Object.entries(categories).forEach(([cat, amt]) => {
            if (amt > topSpent) {
                topSpent = amt;
                topCategory = cat;
            }
        });

        res.json({
            txCount,
            memberDays: diffDays,
            topCategory,
            topSpent
        });
    } catch (err) {
        console.error('Get Stats Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/auth/announcement
router.get('/announcement', async (req, res) => {
    try {
        const doc = await Config.findOne({ key: 'SYSTEM_BROADCAST_MESSAGE' });
        res.json({ message: doc ? doc.value : '' });
    } catch (err) {
        res.json({ message: '' });
    }
});

module.exports = router;

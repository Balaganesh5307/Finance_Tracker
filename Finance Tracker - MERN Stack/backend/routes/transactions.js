const express = require('express');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);

// GET /api/transactions
router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        console.error('Fetch Transactions Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/transactions
router.post('/', async (req, res) => {
    try {
        const { type, amount, category, description, date } = req.body;

        const newTransaction = new Transaction({
            user: req.user.id,
            type,
            amount,
            category,
            description,
            date: date || new Date()
        });

        const savedTransaction = await newTransaction.save();

        // ─── Budget Alert Check ───
        let budgetAlert = null;
        if (type === 'expense') {
            const dateToCheck = date ? new Date(date) : new Date();
            const monthStr = dateToCheck.toISOString().slice(0, 7); // 'YYYY-MM'

            const budget = await Budget.findOne({
                user: req.user.id,
                category: new RegExp(`^${category}$`, 'i'),
                month: monthStr
            });

            if (budget) {
                const startOfMonth = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth(), 1);
                const endOfMonth = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth() + 1, 0, 23, 59, 59, 999);

                const txList = await Transaction.find({
                    user: req.user.id,
                    category: new RegExp(`^${category}$`, 'i'),
                    type: 'expense',
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                });

                const currentTotal = txList.reduce((sum, t) => sum + t.amount, 0);
                const percent = (currentTotal / budget.limit) * 100;

                if (percent >= 100) {
                    budgetAlert = `Budget Exceeded! You have spent ₹${currentTotal.toFixed(2)} of your ₹${budget.limit.toFixed(2)} limit for ${category}.`;
                } else if (percent >= 80) {
                    budgetAlert = `Budget Warning! You have reached ${percent.toFixed(0)}% of your ₹${budget.limit.toFixed(2)} limit for ${category}.`;
                }
            }
        }

        res.status(201).json({
            ...savedTransaction.toObject(),
            budgetAlert
        });
    } catch (err) {
        console.error('Create Transaction Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/transactions/scan (AI Receipt Scanner)
router.post('/scan', upload.single('receipt'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No receipt image uploaded.' });
    }

    const { getConfigValue } = require('../services/configService');
    const geminiKey = await getConfigValue('GEMINI_API_KEY', process.env.GEMINI_API_KEY);

    if (!geminiKey) {
        return res.status(500).json({ message: 'Gemini API Key is not configured in settings or environment.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype
            }
        };

        const prompt = `You are a smart receipt scanner. Parse the uploaded receipt/invoice image and return ONLY a raw JSON string containing transaction fields. Do not wrap the JSON output in markdown block code symbols like \`\`\`json.
Schema:
{
  "amount": number (total amount charged on receipt),
  "category": string (e.g. Food, Travel, Rent, Utilities, Entertainment, Other),
  "description": string (name of merchant or short item details),
  "date": string (ISO date format YYYY-MM-DD from receipt, fallback to "${new Date().toISOString().split('T')[0]}")
}`;

        const result = await model.generateContent([imagePart, prompt]);
        let textResponse = result.response.text().trim();
        console.log('[Receipt Scanner] Gemini parsed raw text:', textResponse);

        // Sanitize markdown wrapping
        if (textResponse.startsWith('```')) {
            textResponse = textResponse.replace(/^```json\s*/, '').replace(/```$/, '');
        }

        const parsedData = JSON.parse(textResponse);
        res.json(parsedData);
    } catch (err) {
        console.error('Receipt Scan Error:', err);
        res.status(500).json({ message: 'Failed to scan receipt image correctly.' });
    }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
    try {
        const { type, amount, category, description, date } = req.body;

        let transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { $set: { type, amount, category, description, date } },
            { new: true }
        );

        res.json(transaction);
    } catch (err) {
        console.error('Update Transaction Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: 'Transaction deleted' });
    } catch (err) {
        console.error('Delete Transaction Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

const express = require('express');
const auth = require('../middleware/auth');
const { runAgent } = require('../services/agentService');

const router = express.Router();

// Apply auth middleware to all AI routes
router.use(auth);

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
    const { message, chatHistory } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Message is required.' });
    }

    try {
        const responseText = await runAgent(req.user.id, message, chatHistory || []);
        res.json({ response: responseText });
    } catch (err) {
        console.error('AI Agent Route Error:', err.message);
        res.status(500).json({ message: err.message || 'Error processing request with AI agent.' });
    }
});

module.exports = router;

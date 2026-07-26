const express = require('express');
const auth = require('../middleware/auth');
const { runAgent } = require('../services/agentService');
const ChatMessage = require('../models/ChatMessage');

const router = express.Router();

// Apply auth middleware to all AI routes
router.use(auth);

// GET /api/ai/history - Retrieve user chat history
router.get('/history', async (req, res) => {
    try {
        const history = await ChatMessage.find({ user: req.user.id }).sort({ createdAt: 1 });
        res.json(history);
    } catch (err) {
        console.error('Fetch Chat History Error:', err.message);
        res.status(500).json({ message: 'Server error fetching chat history.' });
    }
});

// DELETE /api/ai/history - Clear user chat history
router.delete('/history', async (req, res) => {
    try {
        await ChatMessage.deleteMany({ user: req.user.id });
        res.json({ message: 'Chat history cleared successfully.' });
    } catch (err) {
        console.error('Clear Chat History Error:', err.message);
        res.status(500).json({ message: 'Server error clearing chat history.' });
    }
});

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
    const { message, chatHistory } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Message is required.' });
    }

    try {
        // Save user message to database
        const userMsg = new ChatMessage({
            user: req.user.id,
            sender: 'user',
            text: message
        });
        await userMsg.save();

        const responseText = await runAgent(req.user.id, message, chatHistory || []);

        // Save assistant response to database
        const assistantMsg = new ChatMessage({
            user: req.user.id,
            sender: 'assistant',
            text: responseText
        });
        await assistantMsg.save();

        res.json({ response: responseText });
    } catch (err) {
        console.error('AI Agent Route Error:', err.message);
        res.status(500).json({ message: err.message || 'Error processing request with AI agent.' });
    }
});

module.exports = router;


const Groq = require('groq-sdk');
const Transaction = require('../models/Transaction');

// Instantiated dynamically inside runAgent using MongoDB configs

// ─── AGENT TOOLS (Mongoose Database Operations) ───

const getTransactions = async (userId, limit = 20, category = '', type = '') => {
    const query = { user: userId };
    if (category) {
        query.category = new RegExp(category, 'i');
    }
    if (type) {
        query.type = type.toLowerCase();
    }
    const list = await Transaction.find(query).sort({ date: -1 }).limit(limit);
    return list.map(t => ({
        id: t._id,
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description || '',
        date: t.date.toISOString().split('T')[0]
    }));
};

const createTransaction = async (userId, amount, type, category, description = '', date = '') => {
    const newTx = new Transaction({
        user: userId,
        amount: parseFloat(amount),
        type: type.toLowerCase(),
        category: category || 'Other',
        description: description || '',
        date: date ? new Date(date) : new Date()
    });
    const saved = await newTx.save();
    return {
        success: true,
        id: saved._id,
        amount: saved.amount,
        type: saved.type,
        category: saved.category,
        description: saved.description,
        date: saved.date.toISOString().split('T')[0]
    };
};

const getSummary = async (userId) => {
    const list = await Transaction.find({ user: userId });
    let totalIncome = 0;
    let totalExpense = 0;
    list.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
        }
    });
    return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: list.length
    };
};

// ─── TOOL DEFINITIONS FOR GROQ ───

const tools = [
    {
        type: 'function',
        function: {
            name: 'getTransactions',
            description: 'Retrieve a list of transactions for the user. Can be filtered by category or type (income/expense).',
            parameters: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'Max number of transactions to return (default: 20).' },
                    category: { type: 'string', description: 'Filter by category name (e.g., Food, Travel, Rent).' },
                    type: { type: 'string', enum: ['income', 'expense'], description: 'Filter by income or expense.' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'createTransaction',
            description: 'Create a new transaction (income or expense) for the user. Default categories include: Food, Travel, Utilities, Rent, Salary, Entertainment, Other.',
            parameters: {
                type: 'object',
                required: ['amount', 'type', 'category'],
                properties: {
                    amount: { type: 'number', description: 'The numeric amount of the transaction.' },
                    type: { type: 'string', enum: ['income', 'expense'], description: 'Type of transaction.' },
                    category: { type: 'string', description: 'The category (e.g. Food, Travel).' },
                    description: { type: 'string', description: 'A short description of the transaction.' },
                    date: { type: 'string', description: 'ISO date format YYYY-MM-DD if specified, otherwise current date.' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getSummary',
            description: 'Get the overall financial summary showing total income, total expenses, balance, and total transactions count.',
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    }
];

// ─── ADMIN TOOLS (Mongoose Database & Settings Operations) ───

const getAdminStats = async () => {
    const User = require('../models/User');
    const Transaction = require('../models/Transaction');
    const Subscription = require('../models/Subscription');
    const Budget = require('../models/Budget');
    const SavingGoal = require('../models/SavingGoal');

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

    const allVolume = await Transaction.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalPlatformVolume = allVolume.length > 0 ? allVolume[0].total : 0;

    const dbHealth = {
        users: totalUsers,
        transactions: totalTransactions,
        subscriptions: await Subscription.countDocuments(),
        budgets: await Budget.countDocuments(),
        goals: await SavingGoal.countDocuments()
    };

    return {
        totalUsers,
        totalTransactions,
        activeUsers,
        newUsersThisMonth,
        totalPlatformVolume,
        dbHealth
    };
};

const getConfigs = async () => {
    const Config = require('../models/Config');
    const configs = await Config.find({});
    return configs.map(c => {
        let displayValue = c.value;
        // Mask sensitive settings
        if (c.key.includes('KEY') || c.key.includes('SECRET') || c.key.includes('PASSWORD')) {
            if (c.value && c.value.length > 8) {
                displayValue = c.value.substring(0, 6) + '...' + c.value.substring(c.value.length - 4);
            } else if (c.value) {
                displayValue = '********';
            }
        }
        return {
            key: c.key,
            value: displayValue
        };
    });
};

const updateConfig = async (key, value) => {
    const Config = require('../models/Config');
    if (!key) {
        return { success: false, message: 'Config key is required.' };
    }
    const config = await Config.findOneAndUpdate(
        { key: key.trim() },
        { $set: { value: value } },
        { new: true, upsert: true }
    );
    return {
        success: true,
        key: config.key,
        value: (key.includes('KEY') || key.includes('SECRET')) ? '********' : config.value
    };
};

const testGroqKey = async (testKey) => {
    if (!testKey) {
        return { success: false, message: 'No Groq API key provided to test.' };
    }
    try {
        const testGroq = new Groq({ apiKey: testKey });
        const testRes = await testGroq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: 'Respond with only the word OK.' }],
            max_tokens: 5
        });
        const content = testRes.choices[0].message.content.trim();
        return {
            success: true,
            message: 'Groq API Key is valid and working.',
            modelResponse: content
        };
    } catch (err) {
        return {
            success: false,
            message: `Groq API Key validation failed: ${err.message}`
        };
    }
};

// ─── AGENT EXECUTION LOOP ───

const runAgent = async (userId, userMessage, chatHistory = []) => {
    const { getConfigValue } = require('./configService');
    const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY);

    if (!apiKey) {
        throw new Error('Groq API Key is not configured in settings or environment.');
    }

    const User = require('../models/User');
    const user = await User.findById(userId);
    const isAdmin = user && user.role === 'admin';

    const groqClient = new Groq({ apiKey });

    // Format chat history for LLM
    const formattedMessages = [
        {
            role: 'system',
            content: `You are a smart personal finance AI assistant integrated directly into a MERN application (FinanceTracker Pro).
You have tools to view, add, and summarize transactions in the user's database.
Be helpful, concise, and structured. When adding transactions, confirm the details (amount, category, description).
Current date: ${new Date().toISOString().split('T')[0]}.

CRITICAL: The currency of this application is Indian Rupees (INR). You MUST always format currency amounts using the Rupee symbol (₹) (e.g. ₹1,250.50) instead of the Dollar symbol ($).

Here is the structure and features of this website (FinanceTracker Pro) to help you answer questions about the site:
1. Landing Page ('/'): The landing hero page describing what the site does, including feature highlights, stats, and get started calls to action.
2. Dashboard ('/dashboard'): Displays financial cards (Monthly Income, Monthly Expense, Balance) and dynamic charts (spending breakdown pie charts and monthly transaction trends line charts) using Recharts.
3. Transactions Page ('/transactions'): The ledger where users can view all transaction history, search by description, filter by type/category, edit, delete, or add transactions manually.
4. Admin Panel ('/admin'): Restricted dashboard for overall administrators (such as admin5307@gmail.com and balaganesh.masterad@gmail.com) to view site users, manage accounts, and monitor metrics.
5. AI Assistant: That's you! You can run database queries, query logs, add transactions via chat commands, and summarize budgets.
${isAdmin ? `
ADMINISTRATIVE ROLE CONTEXT:
You are chatting with a site administrator. You have additional tools:
- getAdminStats: View total registered users, active users, platform volume, and DB diagnostics. Use this tool if the admin asks about user counts, db metrics, etc.
- getConfigs: View configuration values (masked). Use this to check if API keys or broadcast banners are set.
- updateConfig: Edit configurations (e.g. key: 'SYSTEM_BROADCAST_MESSAGE' to update or publish the live announcement banner). Use this to publish/update banner messages.
- testGroqKey: Validate if the Groq API key works.` : ''}`
        },
        ...chatHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        })),
        { role: 'user', content: userMessage }
    ];

    // Build tools dynamically
    const activeTools = [...tools];
    if (isAdmin) {
        activeTools.push(
            {
                type: 'function',
                function: {
                    name: 'getAdminStats',
                    description: 'Retrieve platform-wide administrative statistics including total user count, active users count, database diagnostics, and general metrics.',
                    parameters: { type: 'object', properties: {} }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'getConfigs',
                    description: 'Retrieve system configurations including keys and masked values. Useful for checking if API keys or settings are configured.',
                    parameters: { type: 'object', properties: {} }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'updateConfig',
                    description: 'Update or set a system configuration value (like SYSTEM_BROADCAST_MESSAGE for announcement banners, or API keys).',
                    parameters: {
                        type: 'object',
                        required: ['key', 'value'],
                        properties: {
                            key: { type: 'string', description: 'The configuration key (e.g. SYSTEM_BROADCAST_MESSAGE, GROQ_API_KEY, GEMINI_API_KEY).' },
                            value: { type: 'string', description: 'The new value to store.' }
                        }
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'testGroqKey',
                    description: 'Test if the saved or a provided Groq API key is valid and working.',
                    parameters: {
                        type: 'object',
                        properties: {
                            apiKey: { type: 'string', description: 'Optional Groq API key to test. If not provided, tests the currently saved one.' }
                        }
                    }
                }
            }
        );
    }

    let accumulatedPromptTokens = 0;
    let accumulatedCompletionTokens = 0;

    try {
        let loopLimit = 5;
        while (loopLimit > 0) {
            loopLimit--;
            console.log(`[Agent Service] Calling Groq API with ${formattedMessages.length} messages...`);
            const response = await groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: formattedMessages,
                tools: activeTools,
                tool_choice: 'auto',
                temperature: 0.2
            });

            if (response.usage) {
                accumulatedPromptTokens += response.usage.prompt_tokens || 0;
                accumulatedCompletionTokens += response.usage.completion_tokens || 0;
            }

            const responseMessage = response.choices[0].message;
            formattedMessages.push(responseMessage);

            // Check if LLM requested a tool execution
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                for (const toolCall of responseMessage.tool_calls) {
                    const { name, arguments: argsString } = toolCall.function;
                    const args = JSON.parse(argsString);
                    console.log(`[Agent Service] Tool Call Requested: ${name} with arguments:`, args);

                    let observation;
                    try {
                        if (name === 'getTransactions') {
                            observation = await getTransactions(userId, args?.limit, args?.category, args?.type);
                        } else if (name === 'createTransaction') {
                            observation = await createTransaction(userId, args?.amount, args?.type, args?.category, args?.description, args?.date);
                        } else if (name === 'getSummary') {
                            observation = await getSummary(userId);
                        } else if (name === 'getAdminStats' && isAdmin) {
                            observation = await getAdminStats();
                        } else if (name === 'getConfigs' && isAdmin) {
                            observation = await getConfigs();
                        } else if (name === 'updateConfig' && isAdmin) {
                            observation = await updateConfig(args?.key, args?.value);
                        } else if (name === 'testGroqKey' && isAdmin) {
                            observation = await testGroqKey(args?.apiKey || apiKey);
                        } else {
                            observation = { error: `Tool ${name} not found or permission denied.` };
                        }
                    } catch (err) {
                        console.error(`Error running tool ${name}:`, err);
                        observation = { error: err.message || 'Tool execution failed' };
                    }

                    console.log(`[Agent Service] Observation from ${name}:`, observation);
                    formattedMessages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: name,
                        content: JSON.stringify(observation)
                    });
                }
            } else {
                // No tool calls, return assistant text response
                return responseMessage.content;
            }
        }

        throw new Error('Agent execution loop limit exceeded.');
    } finally {
        if (accumulatedPromptTokens > 0 || accumulatedCompletionTokens > 0) {
            try {
                const AIUsageLog = require('../models/AIUsageLog');
                await AIUsageLog.create({
                    user: userId,
                    apiType: 'groq',
                    modelName: 'llama-3.3-70b-versatile',
                    action: 'chatbot',
                    promptTokens: accumulatedPromptTokens,
                    completionTokens: accumulatedCompletionTokens,
                    totalTokens: accumulatedPromptTokens + accumulatedCompletionTokens
                });
                console.log(`[Agent Service] Saved AI Usage Log: ${accumulatedPromptTokens + accumulatedCompletionTokens} total tokens`);
            } catch (logErr) {
                console.error('[Agent Service] Failed to save AI usage log:', logErr.message);
            }
        }
    }
};

module.exports = { runAgent };

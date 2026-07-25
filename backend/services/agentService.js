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

// ─── AGENT EXECUTION LOOP ───

const runAgent = async (userId, userMessage, chatHistory = []) => {
    const { getConfigValue } = require('./configService');
    const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY);

    if (!apiKey) {
        throw new Error('Groq API Key is not configured in settings or environment.');
    }

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
5. AI Assistant: That's you! You can run database queries, query logs, add transactions via chat commands, and summarize budgets.`
        },
        ...chatHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        })),
        { role: 'user', content: userMessage }
    ];

    let loopLimit = 5;
    while (loopLimit > 0) {
        loopLimit--;
        console.log(`[Agent Service] Calling Groq API with ${formattedMessages.length} messages...`);
        const response = await groqClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: formattedMessages,
            tools: tools,
            tool_choice: 'auto',
            temperature: 0.2
        });

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
                        observation = await getTransactions(userId, args.limit, args.category, args.type);
                    } else if (name === 'createTransaction') {
                        observation = await createTransaction(userId, args.amount, args.type, args.category, args.description, args.date);
                    } else if (name === 'getSummary') {
                        observation = await getSummary(userId);
                    } else {
                        observation = { error: `Tool ${name} not found.` };
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
};

module.exports = { runAgent };

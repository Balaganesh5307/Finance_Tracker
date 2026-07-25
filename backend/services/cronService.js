const cron = require('node-cron');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Helper to advance dates
const advanceBillingDate = (currentDate, frequency) => {
    const next = new Date(currentDate);
    if (frequency === 'daily') next.setDate(next.getDate() + 1);
    else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
    else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
    else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
    return next;
};

// Process recurring subscriptions
const processSubscriptions = async () => {
    console.log('[Cron Service] Processing recurring subscriptions...');
    try {
        const today = new Date();
        const dueSubs = await Subscription.find({
            active: true,
            nextBillingDate: { $lte: today }
        });

        console.log(`[Cron Service] Found ${dueSubs.length} subscriptions due.`);

        for (const sub of dueSubs) {
            // 1. Create transaction record
            const tx = new Transaction({
                user: sub.user,
                amount: sub.amount,
                type: sub.type,
                category: sub.category,
                description: `Recurring Subscription: ${sub.name}`,
                date: sub.nextBillingDate
            });
            await tx.save();

            // 2. Advance billing date
            sub.nextBillingDate = advanceBillingDate(sub.nextBillingDate, sub.frequency);
            await sub.save();
            console.log(`[Cron Service] Processed subscription: ${sub.name} for user ${sub.user}. Next date: ${sub.nextBillingDate.toISOString().split('T')[0]}`);
        }
    } catch (err) {
        console.error('[Cron Service] Error processing subscriptions:', err);
    }
};

// Generate beautiful PDF report
const generatePdfDigest = (user, summary, transactions) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header Banner
            doc.rect(0, 0, 612, 100).fill('#6c5ce7');
            doc.fontSize(24).fillColor('#ffffff').text('FinanceTracker Pro', 50, 35, { align: 'left' });
            doc.fontSize(12).fillColor('#e1e0ff').text('MONTHLY FINANCIAL DIGEST REPORT', 50, 65, { align: 'left' });
            doc.moveDown(3);

            // User Profile Section
            doc.fillColor('#2d3436').fontSize(14).text('Account Summary', 50, 130, { underline: true });
            doc.fontSize(10).text(`Name: ${user.name}`);
            doc.text(`Email: ${user.email}`);
            doc.text(`Report Period: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`);
            doc.moveDown(2);

            // Summary Grid Card
            doc.rect(50, doc.y, 512, 100).fill('#f1f2f6');
            
            // Text metrics in grid
            doc.fillColor('#2d3436').fontSize(11);
            const currentY = doc.y + 15;
            doc.text(`Total Income: ₹${summary.totalIncome.toFixed(2)}`, 70, currentY);
            doc.text(`Total Expenses: ₹${summary.totalExpense.toFixed(2)}`, 70, currentY + 25);
            
            doc.fillColor(summary.balance >= 0 ? '#2ed573' : '#ff4757');
            doc.text(`Net Balance: ₹${summary.balance.toFixed(2)}`, 320, currentY);
            doc.fillColor('#2d3436');
            doc.text(`Transactions Tracked: ${summary.transactionCount}`, 320, currentY + 25);
            
            doc.y = currentY + 95;
            doc.moveDown(2);

            // Transactions Table List
            doc.fontSize(14).text('Recent Transactions', 50, doc.y, { underline: true });
            doc.moveDown();

            let itemY = doc.y;
            transactions.slice(0, 15).forEach((t, i) => {
                doc.fontSize(9).fillColor('#7f8c8d').text(`${t.date.toISOString().split('T')[0]}`, 50, itemY);
                doc.fillColor('#2d3436').text(`${t.category}`, 130, itemY);
                doc.text(`${t.description || 'No description'}`, 240, itemY, { width: 180, height: 12 });
                
                doc.fillColor(t.type === 'income' ? '#2ed573' : '#ff4757');
                doc.text(`${t.type === 'income' ? '+' : '-'} ₹${t.amount.toFixed(2)}`, 480, itemY, { align: 'right' });
                
                itemY += 22;
            });

            if (transactions.length > 15) {
                doc.fillColor('#7f8c8d').fontSize(8).text(`... and ${transactions.length - 15} more transactions`, 50, itemY + 5);
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

// Dispatch digest emails to all users
const sendMonthlyDigests = async () => {
    console.log('[Cron Service] Starting monthly digest dispatch...');
    try {
        // Setup transport (Nodemailer test client fallback)
        let transporter;
        if (process.env.SMTP_HOST) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            console.log('[Cron Service] SMTP parameters missing. Setting up Ethereal sandbox SMTP...');
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
        }

        const users = await User.find();
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);

        for (const user of users) {
            const list = await Transaction.find({ user: user._id });
            const currentMonthList = list.filter(t => t.date >= startOfMonth);

            let totalIncome = 0;
            let totalExpense = 0;
            list.forEach(t => {
                if (t.type === 'income') totalIncome += t.amount;
                else totalExpense += t.amount;
            });

            const summary = {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense,
                transactionCount: list.length
            };

            if (list.length === 0) continue;

            const pdfBuffer = await generatePdfDigest(user, summary, list);

            const mailOptions = {
                from: '"FinanceTracker Pro" <noreply@fintrackpro.com>',
                to: user.email,
                subject: `Your Finance Digest - ${new Date().toLocaleString('default', { month: 'long' })}`,
                text: `Hi ${user.name},\n\nPlease find attached your Monthly Finance Digest report PDF.`,
                attachments: [
                    {
                        filename: `finance_report_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`,
                        content: pdfBuffer
                    }
                ]
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`[Cron Service] Email sent successfully to ${user.email}`);
            if (!process.env.SMTP_HOST) {
                console.log(`[Ethereal Sandbox] Preview Sent URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
        }
    } catch (err) {
        console.error('[Cron Service] Error sending monthly digests:', err);
    }
};

// Initialize Background Schedules
const initSchedules = () => {
    // 1. Every midnight: Process subscriptions
    cron.schedule('0 0 * * *', processSubscriptions);

    // 2. On 1st of every month at 00:05: Send report digests
    cron.schedule('5 0 1 * *', sendMonthlyDigests);

    console.log('[Cron Service] Background schedules loaded successfully.');
};

module.exports = {
    initSchedules,
    processSubscriptions,
    sendMonthlyDigests
};

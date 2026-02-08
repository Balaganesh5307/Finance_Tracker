import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlus } from 'react-icons/fi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import TransactionItem from '../components/TransactionItem';
import TransactionForm from '../components/TransactionForm';
import SkeletonCard from '../components/SkeletonCard';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTransaction, setEditTransaction] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Force light mode (day mode) for user dashboard
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/api/transactions');
            setTransactions(res.data);
        } catch (err) {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async (data) => {
        try {
            if (editTransaction) {
                await api.put(`/api/transactions/${editTransaction._id}`, data);
                toast.success('Transaction updated!');
            } else {
                await api.post('/api/transactions', data);
                toast.success('Transaction added!');
            }
            fetchTransactions();
            setShowForm(false);
            setEditTransaction(null);
        } catch (err) {
            toast.error('Failed to save transaction');
        }
    };

    const handleEdit = (transaction) => {
        setEditTransaction(transaction);
        setShowForm(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirm(id);
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirm) {
            try {
                await api.delete(`/api/transactions/${deleteConfirm}`);
                toast.success('Transaction deleted!');
                fetchTransactions();
            } catch (err) {
                toast.error('Failed to delete transaction');
            }
            setDeleteConfirm(null);
        }
    };

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const expenseByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({
        name,
        value
    }));

    const barData = [
        { name: 'Income', amount: totalIncome, fill: '#10b981' },
        { name: 'Expenses', amount: totalExpense, fill: '#ef4444' }
    ];

    const getBalanceTrendData = () => {
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                year: date.getFullYear(),
                monthNum: date.getMonth(),
            });
        }

        return months.map(m => {
            const monthTransactions = transactions.filter(t => {
                const tDate = new Date(t.date || t.createdAt);
                return tDate.getMonth() === m.monthNum && tDate.getFullYear() === m.year;
            });

            const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

            return {
                name: m.month,
                income,
                expense,
                balance: income - expense
            };
        });
    };

    const trendData = getBalanceTrendData();

    const getMonthlyComparison = () => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const thisYear = now.getFullYear();
        const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        const thisMonthExpenses = transactions.filter(t => {
            const tDate = new Date(t.date || t.createdAt);
            return t.type === 'expense' && tDate.getMonth() === thisMonth && tDate.getFullYear() === thisYear;
        }).reduce((sum, t) => sum + t.amount, 0);

        const lastMonthExpenses = transactions.filter(t => {
            const tDate = new Date(t.date || t.createdAt);
            return t.type === 'expense' && tDate.getMonth() === lastMonth && tDate.getFullYear() === lastYear;
        }).reduce((sum, t) => sum + t.amount, 0);

        if (lastMonthExpenses === 0) return null;
        const change = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
        return change;
    };

    const monthlyChange = getMonthlyComparison();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const recentTransactions = transactions.slice(0, 5);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="summary-cards">
                    <SkeletonCard type="summary" />
                    <SkeletonCard type="summary" />
                    <SkeletonCard type="summary" />
                </div>
                <div className="charts-grid">
                    <SkeletonCard type="chart" />
                    <SkeletonCard type="chart" />
                </div>
                <div className="card">
                    <SkeletonCard type="transaction" />
                    <SkeletonCard type="transaction" />
                    <SkeletonCard type="transaction" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="dashboard"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="summary-cards">
                <motion.div className="card summary-card balance" variants={itemVariants}>
                    <div className="card-header">
                        <span className="card-title">Total Balance</span>
                        <div className="summary-icon">
                            <FiDollarSign />
                        </div>
                    </div>
                    <div className="summary-amount">{formatCurrency(balance)}</div>
                </motion.div>

                <motion.div className="card summary-card income" variants={itemVariants}>
                    <div className="card-header">
                        <span className="card-title">Total Income</span>
                        <div className="summary-icon">
                            <FiTrendingUp />
                        </div>
                    </div>
                    <div className="summary-amount">{formatCurrency(totalIncome)}</div>
                </motion.div>

                <motion.div className="card summary-card expense" variants={itemVariants}>
                    <div className="card-header">
                        <div>
                            <span className="card-title">Total Expenses</span>
                            {monthlyChange !== null && (
                                <span className={`comparison-badge ${monthlyChange > 0 ? 'negative' : 'positive'}`}>
                                    {monthlyChange > 0 ? '↑' : '↓'} {Math.abs(monthlyChange).toFixed(0)}% vs last month
                                </span>
                            )}
                        </div>
                        <div className="summary-icon">
                            <FiTrendingDown />
                        </div>
                    </div>
                    <div className="summary-amount">{formatCurrency(totalExpense)}</div>
                </motion.div>
            </div>

            {transactions.length > 0 && (
                <div className="charts-grid">
                    <motion.div className="card chart-card" variants={itemVariants}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Balance Trend (6 Months)</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#64748b" />
                                <YAxis stroke="#64748b" tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        boxShadow: 'var(--shadow-md)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {pieData.length > 0 && (
                        <motion.div className="card chart-card" variants={itemVariants}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Expenses by Category</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart margin={{ top: 0, right: 30, bottom: 30, left: 80 }}>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="40%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            boxShadow: 'var(--shadow-md)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}
                </div>
            )}

            <motion.div className="card" variants={itemVariants}>
                <div className="transactions-header">
                    <h2>Recent Transactions</h2>
                    <button className="btn btn-success" onClick={() => setShowForm(true)}>
                        <FiPlus />
                        Add Transaction
                    </button>
                </div>

                {recentTransactions.length === 0 ? (
                    <div className="empty-state">
                        <FiDollarSign />
                        <h3>No transactions yet</h3>
                        <p>Start by adding your first income or expense</p>
                    </div>
                ) : (
                    <div className="transaction-list">
                        {recentTransactions.map(transaction => (
                            <motion.div
                                key={transaction._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <TransactionItem
                                    transaction={transaction}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteClick}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {showForm && (
                <TransactionForm
                    transaction={editTransaction}
                    onSubmit={handleAddTransaction}
                    onClose={() => {
                        setShowForm(false);
                        setEditTransaction(null);
                    }}
                />
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <motion.div
                        className="modal"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '400px' }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="modal-header">
                            <h2>Delete Transaction</h2>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Are you sure you want to delete this transaction? This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button className="btn" onClick={handleDeleteConfirm} style={{ background: 'var(--gradient-red)', color: 'white' }}>
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default Dashboard;

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlus } from 'react-icons/fi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import TransactionItem from '../components/TransactionItem';
import TransactionForm from '../components/TransactionForm';
import SkeletonCard from '../components/SkeletonCard';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const Dashboard = () => {
    const { formatCurrency } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTransaction, setEditTransaction] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showStartingBalanceModal, setShowStartingBalanceModal] = useState(false);
    const [startingBalanceVal, setStartingBalanceVal] = useState('');

    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        fetchTransactions();
        fetchAnnouncement();
    }, []);

    const fetchAnnouncement = async () => {
        try {
            const res = await api.get('/api/auth/announcement');
            setAnnouncement(res.data.message || '');
        } catch (err) {}
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/api/transactions');
            setTransactions(res.data);

            // Check if Starting Balance has been set for the current calendar month
            const now = new Date();
            const startingBalanceTx = res.data.find(t => {
                const tDate = new Date(t.date || t.createdAt);
                return tDate.getMonth() === now.getMonth() &&
                       tDate.getFullYear() === now.getFullYear() &&
                       t.category === 'Starting Balance';
            });
            if (!startingBalanceTx) {
                setShowStartingBalanceModal(true);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStartingBalance = async (e) => {
        e.preventDefault();
        try {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            await api.post('/api/transactions', {
                amount: parseFloat(startingBalanceVal) || 0,
                type: 'income',
                category: 'Starting Balance',
                description: `Initial balance carryover for ${now.toLocaleDateString('en-US', { month: 'long' })}`,
                date: firstDayOfMonth.toISOString()
            });
            toast.success('Starting balance saved!');
            setShowStartingBalanceModal(false);
            fetchTransactions();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save starting balance');
        }
    };

    const handleSkipStartingBalance = async () => {
        try {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            await api.post('/api/transactions', {
                amount: 0,
                type: 'income',
                category: 'Starting Balance',
                description: `Skipped starting balance for ${now.toLocaleDateString('en-US', { month: 'long' })}`,
                date: firstDayOfMonth.toISOString()
            });
            setShowStartingBalanceModal(false);
            fetchTransactions();
        } catch (err) {
            console.error(err);
            toast.error('Failed to skip starting balance');
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
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to save transaction');
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
                console.error(err);
                toast.error('Failed to delete transaction');
            }
            setDeleteConfirm(null);
        }
    };

    const {
        totalIncome,
        totalExpense,
        balance,
        pieData,
        barData,
        trendData,
        monthlyChange,
        recentTransactions
    } = useMemo(() => {
        const now = new Date();
        const currentMonthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date || t.createdAt);
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        });

        const totalIncome = currentMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = currentMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpense;

        const expenseByCategory = currentMonthTransactions
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

        const recentTransactions = transactions.slice(0, 5);

        return {
            totalIncome,
            totalExpense,
            balance,
            pieData,
            barData,
            trendData,
            monthlyChange,
            recentTransactions
        };
    }, [transactions]);

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
            {announcement && (
                <div style={{
                    background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))',
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.5rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 15px rgba(108,92,231,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>📢</span>
                    <span>{announcement}</span>
                </div>
            )}

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
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={3}
                                        dataKey="value"
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
                                        align="center"
                                        iconSize={10}
                                        iconType="circle"
                                        formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>{value}</span>}
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

            {showStartingBalanceModal && (
                <div className="modal-overlay">
                    <motion.div
                        className="modal"
                        style={{ maxWidth: '400px', padding: '2rem', textAlign: 'center' }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: 'rgba(99, 102, 241, 0.12)',
                            color: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            fontSize: '1.5rem'
                        }}>
                            <FiDollarSign />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            Welcome to {new Date().toLocaleDateString('en-US', { month: 'long' })}!
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Please set up your starting balance for this month to ensure accurate savings tracking.
                        </p>
                        <form onSubmit={handleSaveStartingBalance}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Starting Balance"
                                    value={startingBalanceVal}
                                    onChange={(e) => setStartingBalanceVal(e.target.value)}
                                    required
                                    min="0"
                                    style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleSkipStartingBalance}
                                    style={{ flex: 1 }}
                                >
                                    Skip
                                </button>
                                <button
                                    type="submit"
                                    className="btn"
                                    style={{ flex: 1, background: 'var(--gradient-purple)', color: 'white' }}
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default Dashboard;

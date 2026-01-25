import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlus } from 'react-icons/fi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TransactionItem from '../components/TransactionItem';
import TransactionForm from '../components/TransactionForm';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTransaction, setEditTransaction] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await axios.get('/api/transactions');
            setTransactions(res.data);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async (data) => {
        try {
            if (editTransaction) {
                await axios.put(`/api/transactions/${editTransaction._id}`, data);
            } else {
                await axios.post('/api/transactions', data);
            }
            fetchTransactions();
            setShowForm(false);
            setEditTransaction(null);
        } catch (err) {
            console.error('Error saving transaction:', err);
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
                await axios.delete(`/api/transactions/${deleteConfirm}`);
                fetchTransactions();
            } catch (err) {
                console.error('Error deleting transaction:', err);
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const recentTransactions = transactions.slice(0, 5);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="summary-cards">
                <div className="card summary-card balance">
                    <div className="card-header">
                        <span className="card-title">Total Balance</span>
                        <div className="summary-icon">
                            <FiDollarSign />
                        </div>
                    </div>
                    <div className="summary-amount">{formatCurrency(balance)}</div>
                </div>

                <div className="card summary-card income">
                    <div className="card-header">
                        <span className="card-title">Total Income</span>
                        <div className="summary-icon">
                            <FiTrendingUp />
                        </div>
                    </div>
                    <div className="summary-amount">{formatCurrency(totalIncome)}</div>
                </div>

                <div className="card summary-card expense">
                    <div className="card-header">
                        <span className="card-title">Total Expenses</span>
                        <div className="summary-icon">
                            <FiTrendingDown />
                        </div>
                    </div>
                    <div className="summary-amount">{formatCurrency(totalExpense)}</div>
                </div>
            </div>

            {transactions.length > 0 && (
                <div className="charts-grid">
                    <div className="card chart-card">
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Income vs Expenses</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={barData}>
                                <XAxis dataKey="name" stroke="#64748b" />
                                <YAxis stroke="#64748b" tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        color: '#1a1a2e'
                                    }}
                                    labelStyle={{ color: '#1a1a2e', fontWeight: 600 }}
                                    itemStyle={{ color: '#64748b' }}
                                />
                                <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {pieData.length > 0 && (
                        <div className="card chart-card">
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
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            color: '#1a1a2e'
                                        }}
                                        labelStyle={{ color: '#1a1a2e', fontWeight: 600 }}
                                        itemStyle={{ color: '#64748b' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value) => <span style={{ color: '#1a1a2e', fontSize: '0.85rem' }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            <div className="card">
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
                            <TransactionItem
                                key={transaction._id}
                                transaction={transaction}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                )}
            </div>

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
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

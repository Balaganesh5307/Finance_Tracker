import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FiTrendingUp, FiArrowUp, FiArrowDown, FiArrowLeft, FiX, FiCalendar, FiPieChart, FiDollarSign, FiList } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import SkeletonCard from '../components/SkeletonCard';

const COLORS = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

const MonthlySavings = () => {
    const { formatCurrency } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(null);

    // Grouping helper
    const [monthlyData, setMonthlyData] = useState([]);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/api/transactions');
            setTransactions(res.data);
            processMonthlyData(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    };

    const processMonthlyData = (allTxs) => {
        const groups = allTxs.reduce((acc, t) => {
            const date = new Date(t.date || t.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!acc[key]) {
                acc[key] = {
                    key,
                    year: date.getFullYear(),
                    monthNum: date.getMonth(),
                    monthName: date.toLocaleDateString('en-US', { month: 'long' }),
                    income: 0,
                    expense: 0,
                    transactions: [],
                    expenseByCategory: {}
                };
            }
            
            if (t.type === 'income') {
                acc[key].income += t.amount;
            } else {
                acc[key].expense += t.amount;
                acc[key].expenseByCategory[t.category] = (acc[key].expenseByCategory[t.category] || 0) + t.amount;
            }
            acc[key].transactions.push(t);
            return acc;
        }, {});

        // Convert to sorted array descending
        const sortedGroups = Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
        setMonthlyData(sortedGroups);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="monthly-savings container" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <SkeletonCard type="summary" />
                    <SkeletonCard type="summary" />
                    <SkeletonCard type="summary" />
                </div>
            </div>
        );
    }

    // Detail view for a clicked month
    if (selectedMonth) {
        const pieData = Object.entries(selectedMonth.expenseByCategory).map(([name, value]) => ({
            name,
            value
        }));

        const savings = selectedMonth.income - selectedMonth.expense;
        const savingsRate = selectedMonth.income > 0 ? (savings / selectedMonth.income) * 100 : 0;

        return (
            <motion.div
                className="monthly-savings container"
                style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={() => setSelectedMonth(null)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                    >
                        <FiArrowLeft /> Back to Savings Timeline
                    </button>
                </div>

                <div className="admin-header" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <FiCalendar style={{ color: 'var(--accent-purple)' }} />
                        <span>{selectedMonth.monthName} {selectedMonth.year} Details</span>
                    </h1>
                </div>

                {/* Monthly summary cards */}
                <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="card summary-card income">
                        <div className="card-header">
                            <span className="card-title">Income</span>
                            <div className="summary-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-green)' }}>
                                <FiArrowUp />
                            </div>
                        </div>
                        <div className="summary-amount" style={{ color: 'var(--accent-green)', margin: 0 }}>
                            {formatCurrency(selectedMonth.income)}
                        </div>
                    </div>

                    <div className="card summary-card expense">
                        <div className="card-header">
                            <span className="card-title">Expenses</span>
                            <div className="summary-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--accent-red)' }}>
                                <FiArrowDown />
                            </div>
                        </div>
                        <div className="summary-amount" style={{ color: 'var(--accent-red)', margin: 0 }}>
                            {formatCurrency(selectedMonth.expense)}
                        </div>
                    </div>

                    <div className="card summary-card balance">
                        <div className="card-header">
                            <span className="card-title">Savings</span>
                            <div className="summary-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
                                <FiTrendingUp />
                            </div>
                        </div>
                        <div className="summary-amount" style={{ color: savings >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', margin: 0 }}>
                            {formatCurrency(savings)}
                        </div>
                        <div className="comparison-badge positive" style={{ marginTop: '0.4rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                            Savings Rate: {savingsRate.toFixed(0)}%
                        </div>
                    </div>
                </div>

                {/* Detailed Pie Chart and Transactions block */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    
                    {/* Visual Breakdown of Category Expenses */}
                    <div className="card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiPieChart style={{ color: 'var(--accent-blue)' }} />
                            <span>Expenses Breakdown</span>
                        </h3>
                        {pieData.length === 0 ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                No expenses logged for this month.
                            </div>
                        ) : (
                            <div style={{ flex: 1, minHeight: '260px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            align="center"
                                            iconSize={10}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Transactions list */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiList style={{ color: 'var(--accent-purple)' }} />
                            <span>Monthly Ledger Log ({selectedMonth.transactions.length})</span>
                        </h3>
                        <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {selectedMonth.transactions.map((t) => (
                                <div
                                    key={t._id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.85rem 1rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '10px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                                        <div
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: t.type === 'income' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                                color: t.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)',
                                                fontSize: '0.85rem',
                                                flexShrink: 0
                                            }}
                                        >
                                            {t.type === 'income' ? <FiArrowUp /> : <FiArrowDown />}
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>{t.category}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {t.description || new Date(t.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: t.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="monthly-savings container"
            style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="admin-header" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiTrendingUp style={{ fontSize: '2rem', color: 'var(--accent-purple)' }} />
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Monthly Savings Timeline</h1>
            </div>

            {monthlyData.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <FiCalendar style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }} />
                    <h3>No Transactions Logged</h3>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Log transactions on your dashboard to see your savings calculations over previous months.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.25rem' }}>
                    {monthlyData.map(group => {
                        const savings = group.income - group.expense;
                        return (
                            <motion.div
                                key={group.key}
                                className="card"
                                onClick={() => setSelectedMonth(group)}
                                style={{
                                    cursor: 'pointer',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                }}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                                        {group.monthName} {group.year}
                                    </h3>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {group.transactions.length} Logs
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Income</span>
                                        <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{formatCurrency(group.income)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Expenses</span>
                                        <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>{formatCurrency(group.expense)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px dotted var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                                        <span style={{ fontWeight: 600 }}>Net Savings</span>
                                        <span style={{ fontWeight: 700, color: savings >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                            {formatCurrency(savings)}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default MonthlySavings;

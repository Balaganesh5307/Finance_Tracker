import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiTrash2, FiAlertCircle, FiCheck, FiPieChart, FiTrendingUp, FiList, FiRefreshCw } from 'react-icons/fi';

const getCurrencySymbol = (code) => {
    const symbols = { 'INR': '₹', 'USD': '$', 'GBP': '£', 'EUR': '€', 'JPY': '¥', 'CAD': '$', 'AUD': '$' };
    return symbols[code] || '₹';
};

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Rent', 'Salary', 'Other'];

const BudgetsAndGoals = () => {
    const { formatCurrency, user } = useAuth();
    // State lists
    const [subscriptions, setSubscriptions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [subForm, setSubForm] = useState({ name: '', amount: '', type: 'expense', category: 'Bills', frequency: 'monthly', nextBillingDate: '' });
    const [budgetForm, setBudgetForm] = useState({ category: 'Food', limit: '', month: new Date().toISOString().slice(0, 7) });
    const [goalForm, setGoalForm] = useState({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });

    // Triggers
    const [triggeringCron, setTriggeringCron] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [subsRes, budgetsRes, goalsRes] = await Promise.all([
                api.get('/api/subscriptions'),
                api.get('/api/budgets/status'),
                api.get('/api/goals')
            ]);
            setSubscriptions(subsRes.data);
            setBudgets(budgetsRes.data);
            setGoals(goalsRes.data);
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error('Failed to load budgets and goals data.');
        } finally {
            setLoading(false);
        }
    };

    // Subscriptions logic
    const handleCreateSub = async (e) => {
        e.preventDefault();
        if (!subForm.name || !subForm.amount || !subForm.nextBillingDate) {
            toast.error('Please fill in all subscription fields.');
            return;
        }
        try {
            await api.post('/api/subscriptions', subForm);
            toast.success('Subscription tracking added!');
            setSubForm({ name: '', amount: '', type: 'expense', category: 'Bills', frequency: 'monthly', nextBillingDate: '' });
            fetchData();
        } catch (err) {
            toast.error('Failed to add subscription');
        }
    };

    const handleDeleteSub = async (id) => {
        try {
            await api.delete(`/api/subscriptions/${id}`);
            toast.success('Subscription deleted');
            fetchData();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const handleTriggerCron = async () => {
        try {
            setTriggeringCron(true);
            await api.post('/api/subscriptions/trigger-cron');
            toast.success('Subscriptions processed successfully!');
            fetchData();
        } catch (err) {
            toast.error('Failed to process subscriptions');
        } finally {
            setTriggeringCron(false);
        }
    };

    // Budgets logic
    const handleSetBudget = async (e) => {
        e.preventDefault();
        if (!budgetForm.limit) {
            toast.error('Please specify a spending limit.');
            return;
        }
        try {
            await api.post('/api/budgets', budgetForm);
            toast.success('Budget limit set!');
            setBudgetForm(prev => ({ ...prev, limit: '' }));
            fetchData();
        } catch (err) {
            toast.error('Failed to save budget limit.');
        }
    };

    const handleDeleteBudget = async (id) => {
        try {
            await api.delete(`/api/budgets/${id}`);
            toast.success('Budget category deleted');
            fetchData();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    // Goals logic
    const handleCreateGoal = async (e) => {
        e.preventDefault();
        if (!goalForm.name || !goalForm.targetAmount || !goalForm.targetDate) {
            toast.error('Please fill in all goals fields.');
            return;
        }
        try {
            await api.post('/api/goals', goalForm);
            toast.success('Savings Goal created!');
            setGoalForm({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
            fetchData();
        } catch (err) {
            toast.error('Failed to create goal');
        }
    };

    const handleUpdateGoalProgress = async (id, currentVal) => {
        const newValStr = prompt('Enter new total savings amount for this goal:', currentVal);
        if (newValStr === null) return;
        const val = parseFloat(newValStr);
        if (isNaN(val) || val < 0) {
            toast.error('Please enter a valid amount.');
            return;
        }
        try {
            await api.put(`/api/goals/${id}`, { currentAmount: val });
            toast.success('Savings target updated!');
            fetchData();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const handleDeleteGoal = async (id) => {
        try {
            await api.delete(`/api/goals/${id}`);
            toast.success('Goal deleted');
            fetchData();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <FiRefreshCw className="spin" style={{ fontSize: '2rem', color: 'var(--accent-blue)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading your financial goals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Targets & Subscriptions</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Configure monthly budget limits, recurring bills, and saving goals.</p>
                </div>
                <button
                    onClick={handleTriggerCron}
                    disabled={triggeringCron}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(108,92,231,0.1)', borderColor: 'var(--accent-purple)', color: 'var(--text-primary)' }}
                >
                    <FiRefreshCw className={triggeringCron ? 'spin' : ''} />
                    <span>{triggeringCron ? 'Processing...' : 'Run Bill Cron Job'}</span>
                </button>
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                
                {/* ─── BUDGETS SECTION ─── */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <FiPieChart style={{ color: 'var(--accent-blue)', fontSize: '20px' }} />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Monthly Budget Caps</h2>
                    </div>

                    {/* Set Budget Form */}
                    <form onSubmit={handleSetBudget} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ marginBottom: '0.4rem' }}>Category</label>
                            <select
                                value={budgetForm.category}
                                onChange={(e) => setBudgetForm(prev => ({ ...prev, category: e.target.value }))}
                                className="form-input"
                                style={{ width: '100%' }}
                            >
                                {CATEGORIES.filter(c => c !== 'Salary').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ marginBottom: '0.4rem' }}>Limit ({getCurrencySymbol(user?.currency)})</label>
                            <input
                                type="number"
                                placeholder="e.g. 5000"
                                value={budgetForm.limit}
                                onChange={(e) => setBudgetForm(prev => ({ ...prev, limit: e.target.value }))}
                                className="form-input"
                                style={{ width: '100%' }}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <FiPlus />
                            <span>Set Budget</span>
                        </button>
                    </form>

                    {/* Budgets List with Progress Bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {budgets.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>No budgets configured for this month.</p>
                        ) : (
                            budgets.map(b => {
                                const isExceeded = b.percentage >= 100;
                                const barColor = b.percentage >= 100 ? 'var(--accent-red)' : b.percentage >= 80 ? '#fdcb6e' : 'var(--accent-blue)';
                                return (
                                    <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.category}</span>
                                            <button 
                                                onClick={() => handleDeleteBudget(b.id)} 
                                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', margin: '4px 0' }}>
                                            <div style={{ width: `${b.percentage}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            <span>Spent: {formatCurrency(b.spent)} / {formatCurrency(b.limit)}</span>
                                            <span style={{ color: isExceeded ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                                {isExceeded ? 'Exceeded' : `Remaining: ${formatCurrency(b.remaining)}`}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ─── SAVINGS GOALS SECTION ─── */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <FiTrendingUp style={{ color: 'var(--accent-green)', fontSize: '20px' }} />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Savings Milestones</h2>
                    </div>

                    {/* Set Goal Form */}
                    <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ marginBottom: '0.4rem' }}>Goal Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Savings for Laptop"
                                value={goalForm.name}
                                onChange={(e) => setGoalForm(prev => ({ ...prev, name: e.target.value }))}
                                className="form-input"
                                style={{ width: '100%' }}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ marginBottom: '0.4rem' }}>Target Amount ({getCurrencySymbol(user?.currency)})</label>
                            <input
                                type="number"
                                placeholder="e.g. 50000"
                                value={goalForm.targetAmount}
                                onChange={(e) => setGoalForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                                className="form-input"
                                style={{ width: '100%' }}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ marginBottom: '0.4rem' }}>Saved Initial ({getCurrencySymbol(user?.currency)})</label>
                            <input
                                type="number"
                                placeholder="e.g. 10000"
                                value={goalForm.currentAmount}
                                onChange={(e) => setGoalForm(prev => ({ ...prev, currentAmount: e.target.value }))}
                                className="form-input"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ marginBottom: '0.4rem' }}>Target Date</label>
                            <input
                                type="date"
                                value={goalForm.targetDate}
                                onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                                className="form-input"
                                style={{ width: '100%' }}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <FiPlus />
                            <span>Create Savings Goal</span>
                        </button>
                    </form>

                    {/* Goals List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {goals.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>No savings milestones created yet.</p>
                        ) : (
                            goals.map(g => {
                                const percent = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
                                return (
                                    <div key={g._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>{g.name}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Target Date: {new Date(g.targetDate).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleUpdateGoalProgress(g._id, g.currentAmount)}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', height: '26px' }}
                                                >
                                                    Add Savings
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGoal(g._id)}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', margin: '4px 0' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-green)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            <span>Saved: {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{percent.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ─── RECURRING BILLS SECTION ─── */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <FiList style={{ color: 'var(--accent-purple)', fontSize: '20px' }} />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Recurring Subscriptions</h2>
                    </div>

                    {/* Add Subscription Form */}
                    <form onSubmit={handleCreateSub} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ marginBottom: '0.4rem' }}>Service Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Netflix, Rent"
                                value={subForm.name}
                                onChange={(e) => setSubForm(prev => ({ ...prev, name: e.target.value }))}
                                className="form-input"
                                style={{ width: '100%' }}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ marginBottom: '0.4rem' }}>Amount ({getCurrencySymbol(user?.currency)})</label>
                            <input
                                type="number"
                                placeholder="e.g. 199"
                                value={subForm.amount}
                                onChange={(e) => setSubForm(prev => ({ ...prev, amount: e.target.value }))}
                                className="form-input"
                                style={{ width: '100%' }}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ marginBottom: '0.4rem' }}>Frequency</label>
                            <select
                                value={subForm.frequency}
                                onChange={(e) => setSubForm(prev => ({ ...prev, frequency: e.target.value }))}
                                className="form-input"
                                style={{ width: '100%' }}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ marginBottom: '0.4rem' }}>Next Billing Date</label>
                            <input
                                type="date"
                                value={subForm.nextBillingDate}
                                onChange={(e) => setSubForm(prev => ({ ...prev, nextBillingDate: e.target.value }))}
                                className="form-input"
                                style={{ width: '100%' }}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <FiPlus />
                            <span>Add Auto-Billing</span>
                        </button>
                    </form>

                    {/* Subscriptions List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {subscriptions.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>No recurring bills logged yet.</p>
                        ) : (
                            subscriptions.map(s => (
                                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>{s.name}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {formatCurrency(s.amount)} • {s.frequency.toUpperCase()} • Next: {new Date(s.nextBillingDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSub(s._id)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BudgetsAndGoals;

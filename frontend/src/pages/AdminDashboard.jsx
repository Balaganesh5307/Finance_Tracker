import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { FiUsers, FiDollarSign, FiActivity, FiUserPlus, FiTrash2, FiShield, FiAlertOctagon, FiDatabase, FiHelpCircle, FiKey, FiBell, FiX, FiCheck, FiRefreshCw, FiCpu, FiClock } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import SkeletonCard from '../components/SkeletonCard';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Configurations state
    const [geminiKey, setGeminiKey] = useState('');
    const [groqKey, setGroqKey] = useState('');
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [savingSettings, setSavingSettings] = useState(false);

    // Customer support state
    const [selectedUser, setSelectedUser] = useState(null);
    const [supportTxs, setSupportTxs] = useState([]);
    const [supportLoading, setSupportLoading] = useState(false);

    // AI usage tab state
    const [activeTab, setActiveTab] = useState('overview');
    const [aiStats, setAiStats] = useState(null);
    const [aiLoading, setAiLoading] = useState(true);
    const [testingKey, setTestingKey] = useState(null);
    const [apiFilter, setApiFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');

    const fetchAIUsage = async () => {
        try {
            setAiLoading(true);
            const res = await api.get('/api/admin/ai-usage');
            setAiStats(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load AI usage details.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleTestKey = async (key) => {
        try {
            setTestingKey(key);
            const res = await api.post('/api/admin/configs/test', { key });
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'API connection test failed.');
        } finally {
            setTestingKey(null);
        }
    };

    useEffect(() => {
        if (activeTab === 'ai-usage') {
            fetchAIUsage();
        }
    }, [activeTab]);

    // Force dark mode (night mode) for admin dashboard
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    useEffect(() => {
        fetchData();
        fetchConfigs();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                api.get('/api/admin/users'),
                api.get('/api/admin/stats')
            ]);
            setUsers(usersRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load admin stats');
        } finally {
            setLoading(false);
        }
    };

    const fetchConfigs = async () => {
        try {
            const res = await api.get('/api/admin/configs');
            const gemini = res.data.find(c => c.key === 'GEMINI_API_KEY');
            const groq = res.data.find(c => c.key === 'GROQ_API_KEY');
            const broadcast = res.data.find(c => c.key === 'SYSTEM_BROADCAST_MESSAGE');
            if (gemini) setGeminiKey(gemini.value);
            if (groq) setGroqKey(groq.value);
            if (broadcast) setBroadcastMsg(broadcast.value);
        } catch (err) {
            console.error('Failed to load admin settings:', err);
        }
    };

    const handleSaveConfig = async (key, value) => {
        try {
            setSavingSettings(true);
            await api.post('/api/admin/configs', { key, value });
            toast.success(`Platform setting '${key}' saved!`);
            fetchConfigs();
        } catch (err) {
            toast.error('Failed to save setting.');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await api.delete(`/api/admin/users/${userId}`);
            toast.success('User deleted successfully');
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete user');
        }
        setDeleteConfirm(null);
    };

    const handleToggleRole = async (userId, currentRole) => {
        const nextRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await api.put(`/api/admin/users/${userId}/role`, { role: nextRole });
            toast.success(`User role set to ${nextRole}`);
            fetchData();
        } catch (err) {
            toast.error('Failed to change role.');
        }
    };

    const handleToggleStatus = async (userId, currentSuspended) => {
        const nextStatus = !currentSuspended;
        const confirmMsg = nextStatus 
            ? 'Suspend this user account? They will be blocked from API access immediately.'
            : 'Reinstate this user account?';
        if (!window.confirm(confirmMsg)) return;

        try {
            await api.put(`/api/admin/users/${userId}/status`, { suspended: nextStatus });
            toast.success(nextStatus ? 'User account suspended' : 'User account reinstated');
            fetchData();
        } catch (err) {
            toast.error('Failed to update user status.');
        }
    };

    const handleOpenSupport = async (userObj) => {
        setSelectedUser(userObj);
        setSupportLoading(true);
        setSupportTxs([]);
        try {
            const res = await api.get(`/api/admin/users/${userObj._id}/transactions`);
            setSupportTxs(res.data);
        } catch (err) {
            toast.error('Failed to fetch user ledger.');
        } finally {
            setSupportLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
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
            <div className="admin-dashboard container" style={{ padding: '2rem' }}>
                <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <SkeletonCard type="summary" />
                    <SkeletonCard type="summary" />
                    <SkeletonCard type="summary" />
                    <SkeletonCard type="summary" />
                </div>
                <div className="card">
                    <SkeletonCard type="transaction" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="admin-dashboard container"
            style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="admin-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiShield style={{ fontSize: '2rem', color: 'var(--accent-purple)' }} />
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Admin Platform Controls</h1>
            </div>

            {/* Tabs Header Navigation */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                <button 
                    onClick={() => setActiveTab('overview')} 
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'overview' ? '2px solid var(--accent-purple)' : '2px solid transparent',
                        color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.9rem'
                    }}
                >
                    Overview & Settings
                </button>
                <button 
                    onClick={() => setActiveTab('ai-usage')} 
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'ai-usage' ? '2px solid var(--accent-purple)' : '2px solid transparent',
                        color: activeTab === 'ai-usage' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.9rem'
                    }}
                >
                    AI Usage & Quotas
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Platform KPI Summary Cards */}
                    <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <motion.div className="card summary-card" variants={itemVariants}>
                            <div className="card-header">
                                <span className="card-title">Total Users</span>
                                <div className="summary-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                                    <FiUsers />
                                </div>
                            </div>
                            <div className="summary-amount" style={{ color: '#3b82f6' }}>{stats?.totalUsers || 0}</div>
                        </motion.div>

                        <motion.div className="card summary-card" variants={itemVariants}>
                            <div className="card-header">
                                <span className="card-title">New Registrations</span>
                                <div className="summary-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                                    <FiUserPlus />
                                </div>
                            </div>
                            <div className="summary-amount" style={{ color: '#8b5cf6' }}>{stats?.newUsersThisMonth || 0}</div>
                        </motion.div>

                        <motion.div className="card summary-card" variants={itemVariants}>
                            <div className="card-header">
                                <span className="card-title">Platform Transactions</span>
                                <div className="summary-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
                                    <FiActivity />
                                </div>
                            </div>
                            <div className="summary-amount" style={{ color: '#06b6d4' }}>{stats?.totalTransactions || 0}</div>
                        </motion.div>

                        <motion.div className="card summary-card" variants={itemVariants}>
                            <div className="card-header">
                                <span className="card-title">Global Ledger Volume</span>
                                <div className="summary-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                                    <FiDollarSign />
                                </div>
                            </div>
                            <div className="summary-amount" style={{ color: '#10b981' }}>
                                {formatCurrency(stats?.totalPlatformVolume || 0)}
                            </div>
                        </motion.div>
                    </div>

                    {/* Admin Utility Blocks Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                        
                        {/* 🎨 Chatbot API Key Config Manager */}
                        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiKey style={{ color: 'var(--accent-blue)' }} />
                                <span>Dynamic API Key Settings</span>
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ marginBottom: '0.4rem' }}>Gemini Vision Key (Receipt Scanner)</label>
                                    <input
                                        type="password"
                                        value={geminiKey}
                                        placeholder="Enter Gemini API Key"
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                        className="form-input"
                                        style={{ width: '100%', marginBottom: '0.5rem' }}
                                    />
                                    <button onClick={() => handleSaveConfig('GEMINI_API_KEY', geminiKey)} className="btn btn-primary" style={{ width: '100%' }}>
                                        Save Gemini Key
                                    </button>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ marginBottom: '0.4rem' }}>Groq Llama Key (Finance Agent)</label>
                                    <input
                                        type="password"
                                        value={groqKey}
                                        placeholder="Enter Groq API Key"
                                        onChange={(e) => setGroqKey(e.target.value)}
                                        className="form-input"
                                        style={{ width: '100%', marginBottom: '0.5rem' }}
                                    />
                                    <button onClick={() => handleSaveConfig('GROQ_API_KEY', groqKey)} className="btn btn-primary" style={{ width: '100%' }}>
                                        Save Groq Key
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 📢 Broadcast Message Announcements */}
                        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiBell style={{ color: 'var(--accent-purple)' }} />
                                <span>System-Wide Broadcast Message</span>
                            </h3>
                            
                            <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', justifyContent: 'space-between' }}>
                                <textarea
                                    value={broadcastMsg}
                                    placeholder="Write an announcement to show on all user dashboards (e.g. Server updates scheduled...)"
                                    onChange={(e) => setBroadcastMsg(e.target.value)}
                                    className="form-input"
                                    style={{ width: '100%', height: '80px', resize: 'none', padding: '10px' }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleSaveConfig('SYSTEM_BROADCAST_MESSAGE', broadcastMsg)} className="btn btn-primary" style={{ flex: 2 }}>
                                        Publish Banner
                                    </button>
                                    <button onClick={() => { setBroadcastMsg(''); handleSaveConfig('SYSTEM_BROADCAST_MESSAGE', ''); }} className="btn btn-secondary" style={{ flex: 1 }}>
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 🗄️ Database Diagnostic Health */}
                        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiDatabase style={{ color: '#10b981' }} />
                                <span>Database Diagnostics</span>
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>User Profiles Document count</span>
                                    <span style={{ fontWeight: 600 }}>{stats?.dbHealth?.users || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Transactions Logged</span>
                                    <span style={{ fontWeight: 600 }}>{stats?.dbHealth?.transactions || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Active Billing Subscriptions</span>
                                    <span style={{ fontWeight: 600 }}>{stats?.dbHealth?.subscriptions || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Active Category Budgets</span>
                                    <span style={{ fontWeight: 600 }}>{stats?.dbHealth?.budgets || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Savings Milestones Targets</span>
                                    <span style={{ fontWeight: 600 }}>{stats?.dbHealth?.goals || 0}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* User List & Controls Section */}
                    <motion.div className="card" variants={itemVariants} style={{ padding: '1.5rem' }}>
                        <div className="transactions-header" style={{ marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Registered User Base ({users.length})</h2>
                        </div>

                        <div className="user-table" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr 1.5fr', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <div>Name</div>
                                <div>Email</div>
                                <div>Role</div>
                                <div>Status</div>
                                <div>Joined Date</div>
                                <div style={{ textAlign: 'right' }}>Actions</div>
                            </div>
                            
                            {users.map(user => (
                                <motion.div
                                    key={user._id}
                                    className="table-row"
                                    style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr 1.5fr', padding: '0.75rem 1rem', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div><strong>{user.name}</strong></div>
                                    <div style={{ wordBreak: 'break-all' }}>{user.email}</div>
                                    <div>
                                        <button
                                            onClick={() => handleToggleRole(user._id, user.role)}
                                            style={{
                                                border: 'none',
                                                background: user.role === 'admin' ? 'rgba(108, 92, 231, 0.12)' : 'rgba(255,255,255,0.05)',
                                                color: user.role === 'admin' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {user.role.toUpperCase()}
                                        </button>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => handleToggleStatus(user._id, user.suspended)}
                                            style={{
                                                border: 'none',
                                                background: user.suspended ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                                color: user.suspended ? 'var(--accent-red)' : 'var(--accent-green)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {user.suspended ? 'SUSPENDED' : 'ACTIVE'}
                                        </button>
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)' }}>{formatDate(user.createdAt).split(',')[0]}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleOpenSupport(user)}
                                            className="btn btn-secondary"
                                            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '26px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            title="View support user ledger"
                                        >
                                            <FiHelpCircle />
                                            <span>Support</span>
                                        </button>
                                        {user.role !== 'admin' && (
                                            <button
                                                className="btn-icon delete"
                                                onClick={() => setDeleteConfirm(user._id)}
                                                title="Delete user profile"
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px' }}
                                            >
                                                <FiTrash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* API Key Quota Tracker Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        
                        {/* Groq Quota Card */}
                        <motion.div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} variants={itemVariants}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Groq API (Llama 3.3)</span>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-green)', fontWeight: 600 }}>Active</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                                    {aiStats?.monthlyStats?.groq?.left?.toLocaleString() || 0}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tokens remaining in monthly quota</span>
                            </div>
                            
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    <span>Used: {aiStats?.monthlyStats?.groq?.used?.toLocaleString() || 0}</span>
                                    <span>Limit: {aiStats?.monthlyStats?.groq?.limit?.toLocaleString() || 0}</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                                    <div 
                                        style={{ 
                                            background: 'var(--accent-purple)', 
                                            width: `${Math.min(100, aiStats?.monthlyStats?.groq ? (aiStats.monthlyStats.groq.used / aiStats.monthlyStats.groq.limit) * 100 : 0)}%`, 
                                            height: '100%', 
                                            borderRadius: '10px',
                                            transition: 'width 0.5s ease'
                                        }}
                                    ></div>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => handleTestKey('GROQ_API_KEY')}
                                disabled={testingKey === 'GROQ_API_KEY'}
                                className="btn btn-secondary"
                                style={{ width: '100%', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '0.25rem' }}
                            >
                                {testingKey === 'GROQ_API_KEY' ? <FiRefreshCw className="spin" /> : <FiKey />}
                                <span>Test Connection</span>
                            </button>
                        </motion.div>

                        {/* Gemini Quota Card */}
                        <motion.div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} variants={itemVariants}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Gemini API (1.5 Flash)</span>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-green)', fontWeight: 600 }}>Active</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                                    {aiStats?.monthlyStats?.gemini?.left?.toLocaleString() || 0}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tokens remaining in monthly quota</span>
                            </div>
                            
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    <span>Used: {aiStats?.monthlyStats?.gemini?.used?.toLocaleString() || 0}</span>
                                    <span>Limit: {aiStats?.monthlyStats?.gemini?.limit?.toLocaleString() || 0}</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                                    <div 
                                        style={{ 
                                            background: 'var(--accent-blue)', 
                                            width: `${Math.min(100, aiStats?.monthlyStats?.gemini ? (aiStats.monthlyStats.gemini.used / aiStats.monthlyStats.gemini.limit) * 100 : 0)}%`, 
                                            height: '100%', 
                                            borderRadius: '10px',
                                            transition: 'width 0.5s ease'
                                        }}
                                    ></div>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => handleTestKey('GEMINI_API_KEY')}
                                disabled={testingKey === 'GEMINI_API_KEY'}
                                className="btn btn-secondary"
                                style={{ width: '100%', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '0.25rem' }}
                            >
                                {testingKey === 'GEMINI_API_KEY' ? <FiRefreshCw className="spin" /> : <FiKey />}
                                <span>Test Connection</span>
                            </button>
                        </motion.div>

                        {/* Summary Invocations Count */}
                        <motion.div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} variants={itemVariants}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiActivity style={{ color: 'var(--accent-purple)' }} />
                                <span>Total API Invocations (Month)</span>
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Groq Requests:</span>
                                    <span style={{ fontWeight: 600 }}>{aiStats?.monthlyStats?.groq?.count || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Gemini Requests:</span>
                                    <span style={{ fontWeight: 600 }}>{aiStats?.monthlyStats?.gemini?.count || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Aggregate Count:</span>
                                    <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>
                                        {(aiStats?.monthlyStats?.groq?.count || 0) + (aiStats?.monthlyStats?.gemini?.count || 0)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Usage Trends Chart */}
                    <motion.div className="card" style={{ padding: '1.5rem' }} variants={itemVariants}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiActivity style={{ color: 'var(--accent-purple)' }} />
                            <span>AI Token Usage Trends (Last 15 Days)</span>
                        </h2>
                        {aiLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                <FiRefreshCw className="spin" style={{ color: 'var(--accent-blue)', fontSize: '1.5rem' }} />
                            </div>
                        ) : !aiStats?.chartData || aiStats.chartData.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No token usage logs recorded in the last 15 days.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={aiStats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={11} />
                                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
                                    <Legend />
                                    <Bar dataKey="groq" name="Groq (Llama Chat)" fill="var(--accent-purple)" stackId="a" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="gemini" name="Gemini (Receipt Scanner)" fill="var(--accent-blue)" stackId="a" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>

                    {/* Auditing Log Table */}
                    <motion.div className="card" style={{ padding: '1.5rem' }} variants={itemVariants}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiDatabase style={{ color: '#10b981' }} />
                                <span>AI API Request Audit Log</span>
                            </h2>
                            
                            {/* Filters */}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <select 
                                    value={apiFilter} 
                                    onChange={(e) => setApiFilter(e.target.value)}
                                    style={{ background: 'rgba(26, 32, 44, 0.6)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '0.8rem', outline: 'none' }}
                                >
                                    <option value="all">All APIs</option>
                                    <option value="groq">Groq Only</option>
                                    <option value="gemini">Gemini Only</option>
                                </select>
                                <select 
                                    value={actionFilter} 
                                    onChange={(e) => setActionFilter(e.target.value)}
                                    style={{ background: 'rgba(26, 32, 44, 0.6)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '0.8rem', outline: 'none' }}
                                >
                                    <option value="all">All Actions</option>
                                    <option value="chatbot">Chatbot</option>
                                    <option value="receipt_scan">Receipt Scan</option>
                                </select>
                            </div>
                        </div>

                        {aiLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                <FiRefreshCw className="spin" style={{ color: 'var(--accent-blue)', fontSize: '1.5rem' }} />
                            </div>
                        ) : !aiStats?.logs || aiStats.logs.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No AI usage records found.</p>
                        ) : (
                            <div className="user-table" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowX: 'auto' }}>
                                <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 2.5fr 1fr 1.5fr 1.5fr 1fr', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', minWidth: '700px' }}>
                                    <div>Timestamp</div>
                                    <div>User</div>
                                    <div>API</div>
                                    <div>Action</div>
                                    <div>Model</div>
                                    <div style={{ textAlign: 'right' }}>Tokens</div>
                                </div>
                                
                                {aiStats.logs
                                    .filter(log => apiFilter === 'all' || log.apiType === apiFilter)
                                    .filter(log => actionFilter === 'all' || log.action === actionFilter)
                                    .map(log => (
                                        <div 
                                            key={log._id} 
                                            className="table-row" 
                                            style={{ display: 'grid', gridTemplateColumns: '2fr 2.5fr 1fr 1.5fr 1.5fr 1fr', padding: '0.75rem 1rem', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.82rem', minWidth: '700px' }}
                                        >
                                            <div style={{ color: 'var(--text-secondary)' }}>{formatDate(log.createdAt)}</div>
                                            <div>
                                                <strong>{log.user?.name || 'System / Guest'}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{log.user?.email || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span style={{ padding: '2px 6px', borderRadius: '4px', background: log.apiType === 'groq' ? 'rgba(108, 92, 231, 0.12)' : 'rgba(9, 132, 227, 0.12)', color: log.apiType === 'groq' ? 'var(--accent-purple)' : 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    {log.apiType.toUpperCase()}
                                                </span>
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)' }}>
                                                {log.action === 'chatbot' ? 'Chatbot Assist' : 'Receipt Scan'}
                                            </div>
                                            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.modelName}</div>
                                            <div style={{ textAlign: 'right', fontWeight: 600 }}>{log.totalTokens?.toLocaleString()}</div>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* 👤 support User Ledger Modal view */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)} style={{ zIndex: 9999 }}>
                    <motion.div
                        className="modal"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '800px', width: '95%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Support Ledger View</h2>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Viewing transactions for {selectedUser.name} ({selectedUser.email})</p>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedUser(null)} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <FiX size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1rem 0' }}>
                            {supportLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                    <FiRefreshCw className="spin" style={{ color: 'var(--accent-blue)', fontSize: '1.5rem' }} />
                                </div>
                            ) : supportTxs.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>No transactions logged in this user ledger.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr 1.2fr', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                        <div>Date</div>
                                        <div>Category</div>
                                        <div>Description</div>
                                        <div style={{ textAlign: 'right' }}>Amount</div>
                                    </div>
                                    {supportTxs.map(t => (
                                        <div key={t._id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr 1.2fr', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.8rem', alignItems: 'center' }}>
                                            <div style={{ color: 'var(--text-secondary)' }}>{new Date(t.date).toLocaleDateString()}</div>
                                            <div><strong>{t.category}</strong></div>
                                            <div style={{ color: 'var(--text-secondary)' }}>{t.description || '-'}</div>
                                            <div style={{ textAlign: 'right', fontWeight: 600, color: t.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                                {t.type === 'income' ? '+' : '-'} ₹{t.amount}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ⚠️ Delete User confirmation modal */}
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
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)' }}>
                                <FiAlertOctagon />
                                <span>Delete User Account</span>
                            </h2>
                        </div>
                        <div className="modal-body" style={{ padding: '1rem 0' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                                Are you absolutely sure you want to delete this user profile? All transactions history, budget limits, subscriptions, and safety rules will be permanently purged.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn"
                                onClick={() => handleDeleteUser(deleteConfirm)}
                                style={{ background: 'var(--accent-red)', color: 'white', border: 'none', fontWeight: 600 }}
                            >
                                Delete User
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminDashboard;

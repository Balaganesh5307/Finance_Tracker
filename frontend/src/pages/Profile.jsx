import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiAlertTriangle, FiDownload, FiCheck, FiRefreshCw } from 'react-icons/fi';

const COUNTRIES = [
    { name: 'India', flag: '🇮🇳', currency: 'INR', label: 'INR (₹)' },
    { name: 'United States', flag: '🇺🇸', currency: 'USD', label: 'USD ($)' },
    { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', label: 'GBP (£)' },
    { name: 'Europe', flag: '🇪🇺', currency: 'EUR', label: 'EUR (€)' },
    { name: 'Japan', flag: '🇯🇵', currency: 'JPY', label: 'JPY (¥)' },
    { name: 'Canada', flag: '🇨🇦', currency: 'CAD', label: 'CAD ($)' },
    { name: 'Australia', flag: '🇦🇺', currency: 'AUD', label: 'AUD ($)' }
];

const AVATARS = [
    { id: 'avatar1', color: 'linear-gradient(135deg, #a8c0ff, #3f2b96)', label: 'Ocean Twilight' },
    { id: 'avatar2', color: 'linear-gradient(135deg, #11998e, #38ef7d)', label: 'Emerald Spring' },
    { id: 'avatar3', color: 'linear-gradient(135deg, #ff9966, #ff5e62)', label: 'Sunset Glow' },
    { id: 'avatar4', color: 'linear-gradient(135deg, #f857a6, #ff5858)', label: 'Rose Quartz' },
    { id: 'avatar5', color: 'linear-gradient(135deg, #00c6ff, #0072ff)', label: 'Neon Cobalt' },
    { id: 'avatar6', color: 'linear-gradient(135deg, #7f00ff, #e100ff)', label: 'Electric Orchid' }
];

const Profile = () => {
    const { user, updateProfile, logout } = useAuth();

    // Stats state
    const [stats, setStats] = useState({ txCount: 0, memberDays: 1, topCategory: 'None', topSpent: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    // Form states
    const [name, setName] = useState(user?.name || '');
    const [country, setCountry] = useState(user?.country || 'India');
    const [avatar, setAvatar] = useState(user?.avatar || 'avatar1');
    const [savingProfile, setSavingProfile] = useState(false);

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const res = await api.get('/api/auth/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to load profile stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            setSavingProfile(true);
            const selectedCountry = COUNTRIES.find(c => c.name === country) || COUNTRIES[0];
            await updateProfile({
                name,
                country: selectedCountry.name,
                currency: selectedCountry.currency,
                avatar
            });
            toast.success('Profile settings updated successfully!');
        } catch (err) {
            toast.error('Failed to save profile modifications.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            toast.error('New passwords do not match!');
            return;
        }
        try {
            setChangingPassword(true);
            await api.put('/api/auth/change-password', { currentPassword, newPassword });
            toast.success('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Password update failed.');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            toast.loading('Exporting history...', { id: 'csv-export' });
            const res = await api.get('/api/transactions');
            const list = res.data;

            if (list.length === 0) {
                toast.error('No transactions available to export.', { id: 'csv-export' });
                return;
            }

            // Generate CSV content
            const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
            const rows = list.map(t => [
                new Date(t.date).toISOString().split('T')[0],
                t.type,
                t.category,
                t.description || '',
                t.amount
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(r => r.map(val => `"${val}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `finance_tracker_export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Transactions history exported successfully!', { id: 'csv-export' });
        } catch (err) {
            toast.error('Export failed. Please check connection.', { id: 'csv-export' });
        }
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm(
            '⚠️ WARNING: Are you absolutely sure you want to delete your account? This action will permanently erase your profile and delete all transactions, budgets, recurring bills, and savings milestones. This action CANNOT be undone.'
        );
        if (!confirmDelete) return;

        try {
            toast.loading('Purging your database record...', { id: 'delete-acc' });
            await api.delete('/api/auth/delete-account');
            toast.success('Your account has been deleted. We are sorry to see you go!', { id: 'delete-acc' });
            logout();
        } catch (err) {
            toast.error('Purge request failed. Please contact admin.', { id: 'delete-acc' });
        }
    };

    const activeAvatarObj = AVATARS.find(a => a.id === avatar) || AVATARS[0];

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="dashboard-header" style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Profile & Settings</h1>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Configure personal details, security credentials, and export data summaries.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {/* COLUMN 1: Personal Card + Statistics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* User Badge Profile Summary */}
                    <div className="card" style={{ padding: '2rem', textAlign: 'center', position: 'relative' }}>
                        <div style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '50%',
                            background: activeAvatarObj.color,
                            margin: '0 auto 1.25rem auto',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            border: '3px solid var(--border-color)'
                        }} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>{user?.name}</h2>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '1rem' }}>{user?.email}</span>
                        
                        <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: 'var(--accent-blue)', 
                            background: 'rgba(9, 132, 227, 0.08)', 
                            padding: '4px 10px', 
                            borderRadius: '12px',
                            textTransform: 'uppercase'
                        }}>
                            {user?.role || 'Client'}
                        </span>
                    </div>

                    {/* Personal Aggregates Card */}
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                            📊 Account Insights
                        </h3>
                        {statsLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                                <FiRefreshCw className="spin" style={{ color: 'var(--accent-blue)' }} />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Member Duration</span>
                                    <span style={{ fontWeight: 600 }}>{stats.memberDays} days</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Transactions Logged</span>
                                    <span style={{ fontWeight: 600 }}>{stats.txCount} records</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Top Expense Category</span>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>{stats.topCategory}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMN 2: Configuration Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Profile Information Settings */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiUser />
                            <span>Edit Profile Details</span>
                        </h3>

                        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ marginBottom: '0.4rem' }}>Display Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ marginBottom: '0.4rem' }}>Base Country</label>
                                <select
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="form-input"
                                >
                                    {COUNTRIES.map((c) => (
                                        <option key={c.name} value={c.name}>
                                            {c.flag} {c.name} ({c.currency})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Preset Avatar Selection Grid */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ marginBottom: '0.6rem' }}>Select Profile Theme Theme</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                                    {AVATARS.map((av) => (
                                        <button
                                            key={av.id}
                                            type="button"
                                            onClick={() => setAvatar(av.id)}
                                            style={{
                                                aspectRatio: '1',
                                                borderRadius: '50%',
                                                background: av.color,
                                                border: avatar === av.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                boxShadow: avatar === av.id ? '0 0 10px rgba(9, 132, 227, 0.4)' : 'none',
                                                transition: 'border 0.2s, transform 0.1s'
                                            }}
                                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            {avatar === av.id && (
                                                <FiCheck style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    color: '#fff',
                                                    fontSize: '12px'
                                                }} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" disabled={savingProfile} className="btn btn-primary" style={{ width: '100%' }}>
                                {savingProfile ? <FiRefreshCw className="spin" /> : 'Save Modifications'}
                            </button>
                        </form>
                    </div>

                    {/* Change Password Panel */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiLock />
                            <span>Update Password Settings</span>
                        </h3>

                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ marginBottom: '0.4rem' }}>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ marginBottom: '0.4rem' }}>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ marginBottom: '0.4rem' }}>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={changingPassword} className="btn btn-secondary" style={{ width: '100%' }}>
                                {changingPassword ? <FiRefreshCw className="spin" /> : 'Update Password'}
                            </button>
                        </form>
                    </div>

                    {/* Danger Administration / Export Panel */}
                    <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.01)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-red)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiAlertTriangle />
                            <span>System Settings & Data Tools</span>
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                                    Export your transaction records locally as a CSV sheet for external spreadsheets.
                                </p>
                                <button onClick={handleExportCSV} className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <FiDownload />
                                    <span>Export Transactions Ledger</span>
                                </button>
                            </div>

                            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '4px 0' }} />

                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                                    Permanently wipe your dashboard profile and delete all historical finance records.
                                </p>
                                <button 
                                    onClick={handleDeleteAccount} 
                                    className="btn" 
                                    style={{ width: '100%', background: 'var(--accent-red)', color: '#fff', border: 'none', padding: '10px', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Purge Account Database
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;

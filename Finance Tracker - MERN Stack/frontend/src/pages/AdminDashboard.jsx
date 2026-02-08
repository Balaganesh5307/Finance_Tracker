import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { FiUsers, FiDollarSign, FiActivity, FiUserPlus, FiTrash2, FiShield } from 'react-icons/fi';
import SkeletonCard from '../components/SkeletonCard';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Force dark mode (night mode) for admin dashboard
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    useEffect(() => {
        fetchData();
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
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await api.delete(`/api/admin/users/${userId}`);
            toast.success('User deleted successfully');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete user');
        }
        setDeleteConfirm(null);
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
            <div className="admin-dashboard">
                <div className="summary-cards">
                    <SkeletonCard type="summary" />
                    <SkeletonCard type="summary" />
                    <SkeletonCard type="summary" />
                    <SkeletonCard type="summary" />
                </div>
                <div className="card">
                    <SkeletonCard type="transaction" />
                    <SkeletonCard type="transaction" />
                    <SkeletonCard type="transaction" />
                </div>
            </div>
        );
    }

    const incomeStats = stats?.transactionsByType?.find(t => t._id === 'income') || { total: 0, count: 0 };
    const expenseStats = stats?.transactionsByType?.find(t => t._id === 'expense') || { total: 0, count: 0 };

    return (
        <motion.div
            className="admin-dashboard"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="admin-header">
                <h1><FiShield /> Admin Dashboard</h1>
            </div>

            <div className="summary-cards">
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
                        <span className="card-title">New This Month</span>
                        <div className="summary-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                            <FiUserPlus />
                        </div>
                    </div>
                    <div className="summary-amount" style={{ color: '#8b5cf6' }}>{stats?.newUsersThisMonth || 0}</div>
                </motion.div>

                <motion.div className="card summary-card" variants={itemVariants}>
                    <div className="card-header">
                        <span className="card-title">Total Transactions</span>
                        <div className="summary-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
                            <FiActivity />
                        </div>
                    </div>
                    <div className="summary-amount" style={{ color: '#06b6d4' }}>{stats?.totalTransactions || 0}</div>
                </motion.div>

                <motion.div className="card summary-card" variants={itemVariants}>
                    <div className="card-header">
                        <span className="card-title">Platform Volume</span>
                        <div className="summary-icon" style={{ background: 'var(--accent-green-glow)', color: 'var(--accent-green)' }}>
                            <FiDollarSign />
                        </div>
                    </div>
                    <div className="summary-amount" style={{ color: 'var(--accent-green)' }}>
                        {formatCurrency((incomeStats.total || 0) + (expenseStats.total || 0))}
                    </div>
                </motion.div>
            </div>

            <motion.div className="card" variants={itemVariants}>
                <div className="transactions-header">
                    <h2>All Users ({users.length})</h2>
                </div>

                <div className="user-table">
                    <div className="table-header">
                        <div className="table-cell">Name</div>
                        <div className="table-cell">Email</div>
                        <div className="table-cell">Role</div>
                        <div className="table-cell">Joined</div>
                        <div className="table-cell">Last Login</div>
                        <div className="table-cell">Actions</div>
                    </div>
                    {users.map(user => (
                        <motion.div
                            key={user._id}
                            className="table-row"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="table-cell">
                                <strong>{user.name}</strong>
                            </div>
                            <div className="table-cell">{user.email}</div>
                            <div className="table-cell">
                                <span className={`role-badge ${user.role}`}>
                                    {user.role}
                                </span>
                            </div>
                            <div className="table-cell">{formatDate(user.createdAt)}</div>
                            <div className="table-cell">{formatDate(user.lastLogin)}</div>
                            <div className="table-cell">
                                {user.role !== 'admin' && (
                                    <button
                                        className="btn-icon delete"
                                        onClick={() => setDeleteConfirm(user._id)}
                                        title="Delete user"
                                    >
                                        <FiTrash2 />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

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
                            <h2>Delete User</h2>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Are you sure you want to delete this user? All their data will be permanently removed.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn"
                                onClick={() => handleDeleteUser(deleteConfirm)}
                                style={{ background: 'var(--gradient-red)', color: 'white' }}
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

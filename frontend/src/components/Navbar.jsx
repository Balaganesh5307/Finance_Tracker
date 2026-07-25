import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiPieChart, FiList, FiLogOut, FiDollarSign, FiShield, FiTrendingUp, FiCalendar, FiSun, FiMoon } from 'react-icons/fi';

const getAvatarColor = (avatarId) => {
    const AVATARS = {
        'avatar1': 'linear-gradient(135deg, #a8c0ff, #3f2b96)',
        'avatar2': 'linear-gradient(135deg, #11998e, #38ef7d)',
        'avatar3': 'linear-gradient(135deg, #ff9966, #ff5e62)',
        'avatar4': 'linear-gradient(135deg, #f857a6, #ff5858)',
        'avatar5': 'linear-gradient(135deg, #00c6ff, #0072ff)',
        'avatar6': 'linear-gradient(135deg, #7f00ff, #e100ff)'
    };
    return AVATARS[avatarId] || AVATARS['avatar1'];
};

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const isAdmin = user?.role === 'admin';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <FiDollarSign size={24} />
                    <span>FinanceTracker Pro</span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="btn-icon theme-toggle"
                        style={{
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            padding: 0
                        }}
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    >
                        {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
                    </button>

                {isAuthenticated ? (
                    <>
                        <div className="navbar-links">
                            {isAdmin ? (
                                <Link
                                    to="/admin"
                                    className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
                                >
                                    <FiShield />
                                    <span>Admin Panel</span>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                                    >
                                        <FiPieChart />
                                        <span>Dashboard</span>
                                    </Link>
                                    <Link
                                        to="/transactions"
                                        className={`navbar-link ${location.pathname === '/transactions' ? 'active' : ''}`}
                                    >
                                        <FiList />
                                        <span>Transactions</span>
                                    </Link>
                                    <Link
                                        to="/budgets-goals"
                                        className={`navbar-link ${location.pathname === '/budgets-goals' ? 'active' : ''}`}
                                    >
                                        <FiTrendingUp />
                                        <span>Targets</span>
                                    </Link>
                                    <Link
                                        to="/savings"
                                        className={`navbar-link ${location.pathname === '/savings' ? 'active' : ''}`}
                                    >
                                        <FiCalendar />
                                        <span>Savings</span>
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Link to="/profile" className="navbar-user-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
                                <div style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    background: getAvatarColor(user?.avatar),
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    border: '2px solid rgba(255,255,255,0.08)'
                                }} />
                                <span className="user-name" style={{ fontWeight: 600 }}>
                                    {user?.name}
                                    {isAdmin && <span className="admin-badge" style={{ marginLeft: '4px' }}>ADMIN</span>}
                                </span>
                            </Link>
                            <button onClick={logout} className="btn-logout" style={{ marginLeft: 0 }}>
                                <FiLogOut />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="navbar-auth">
                        <Link to="/login" className="btn-nav-login">Sign In</Link>
                        <Link to="/register" className="btn-nav-register">Get Started</Link>
                    </div>
                )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

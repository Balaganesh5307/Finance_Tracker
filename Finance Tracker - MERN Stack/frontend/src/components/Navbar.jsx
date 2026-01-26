import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiPieChart, FiList, FiLogOut, FiDollarSign, FiSun, FiMoon, FiShield } from 'react-icons/fi';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const location = useLocation();

    const isAdmin = user?.role === 'admin';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <FiDollarSign size={24} />
                    <span>FinanceTracker</span>
                </Link>

                {isAuthenticated && (
                    <>
                        <div className="navbar-links">
                            {isAdmin ? (
                                <Link
                                    to="/admin"
                                    className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
                                >
                                    <FiShield />
                                    <span>Admin</span>
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
                                </>
                            )}
                        </div>

                        <div className="navbar-user">
                            <button onClick={toggleTheme} className="btn-theme" title={isDark ? 'Light mode' : 'Dark mode'}>
                                {isDark ? <FiSun /> : <FiMoon />}
                            </button>
                            <span className="user-name">
                                Hello, {user?.name}
                                {isAdmin && <span className="admin-badge">Admin</span>}
                            </span>
                            <button onClick={logout} className="btn-logout">
                                <FiLogOut />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

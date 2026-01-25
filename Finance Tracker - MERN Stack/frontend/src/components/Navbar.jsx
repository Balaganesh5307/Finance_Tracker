import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiPieChart, FiList, FiLogOut, FiDollarSign } from 'react-icons/fi';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const location = useLocation();

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
                        </div>

                        <div className="navbar-user">
                            <span className="user-name">Hello, {user?.name}</span>
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

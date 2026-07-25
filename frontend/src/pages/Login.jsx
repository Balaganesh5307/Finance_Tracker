import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogIn } from 'react-icons/fi';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(email, password);
            if (data.user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleCallback = async (response) => {
        try {
            setError('');
            setLoading(true);
            const data = await loginWithGoogle(response.credential);
            if (data.user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Google Auth UI Error:', err);
            setError(err.response?.data?.message || 'Google Sign-In failed.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const renderGoogleButton = () => {
            /* global google */
            if (window.google) {
                try {
                    google.accounts.id.initialize({
                        client_id: '902740568589-qaad58841ctllqdo5ku3rgkh1aq23leg.apps.googleusercontent.com',
                        callback: handleGoogleCallback
                    });
                    google.accounts.id.renderButton(
                        document.getElementById('google-btn-container'),
                        { theme: 'outline', size: 'large', width: '340px' }
                    );
                    return true;
                } catch (err) {
                    console.error('Error rendering Google button:', err);
                }
            }
            return false;
        };

        // Try to render immediately
        if (!renderGoogleButton()) {
            // Check every 100ms if not loaded yet
            const interval = setInterval(() => {
                if (renderGoogleButton()) {
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    return (
        <div className="auth-container">
            <div className="card auth-card">
                <div className="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Sign in to manage your finances</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Signing in...' : (
                            <>
                                <FiLogIn />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '40px' }}>
                    <div id="google-btn-container"></div>
                </div>

                <p className="auth-link" style={{ marginTop: '1.5rem' }}>
                    Don't have an account? <Link to="/register">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;

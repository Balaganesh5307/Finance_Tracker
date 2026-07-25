import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUserPlus } from 'react-icons/fi';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
                    <h1>Create Account</h1>
                    <p>Start tracking your finances today</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating account...' : (
                            <>
                                <FiUserPlus />
                                Create Account
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
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;

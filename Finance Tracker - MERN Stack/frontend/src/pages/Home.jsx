import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    FiDollarSign,
    FiPieChart,
    FiShield,
    FiTrendingUp,
    FiList,
    FiLock,
    FiArrowRight,
    FiCheckCircle,
    FiUsers,
    FiActivity,
    FiGlobe
} from 'react-icons/fi';

const Home = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const fadeUp = {
        hidden: { opacity: 0, y: 40 },
        visible: (i = 0) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: i * 0.15, ease: 'easeOut' }
        })
    };

    const scaleIn = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: (i = 0) => ({
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' }
        })
    };

    const features = [
        {
            icon: <FiPieChart />,
            title: 'Real-time Dashboard',
            desc: 'Beautiful charts and insights that update instantly as you track your income and expenses.',
            color: 'var(--accent-blue)'
        },
        {
            icon: <FiList />,
            title: 'Smart Transactions',
            desc: 'Categorize, filter, and search through all your transactions with powerful tools.',
            color: 'var(--accent-green)'
        },
        {
            icon: <FiLock />,
            title: 'Secure & Private',
            desc: 'Bank-level encryption keeps your financial data safe. Your privacy is our priority.',
            color: 'var(--accent-purple)'
        }
    ];

    const stats = [
        { icon: <FiUsers />, value: '10K+', label: 'Active Users' },
        { icon: <FiTrendingUp />, value: '₹50Cr+', label: 'Tracked' },
        { icon: <FiActivity />, value: '99.9%', label: 'Uptime' },
        { icon: <FiGlobe />, value: '50+', label: 'Countries' }
    ];

    const steps = [
        { num: '01', title: 'Create Account', desc: 'Sign up in seconds with just your email.' },
        { num: '02', title: 'Add Transactions', desc: 'Log your income and expenses effortlessly.' },
        { num: '03', title: 'Get Insights', desc: 'Visualize your spending patterns and save more.' }
    ];

    if (isAuthenticated) return null;

    return (
        <div className="landing-page">
            {/* ─── HERO ─── */}
            <section className="landing-hero">
                <div className="hero-glow hero-glow-1" />
                <div className="hero-glow hero-glow-2" />
                <div className="hero-glow hero-glow-3" />

                <motion.div
                    className="hero-content"
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                >
                    <motion.div className="hero-badge" variants={fadeUp} custom={0}>
                        <FiDollarSign />
                        <span>FinanceTracker Pro</span>
                    </motion.div>

                    <motion.h1 className="hero-title" variants={fadeUp} custom={1}>
                        Take Control of
                        <span className="hero-gradient-text"> Your Finances</span>
                    </motion.h1>

                    <motion.p className="hero-subtitle" variants={fadeUp} custom={2}>
                        Track expenses, visualize spending patterns, and achieve your financial
                        goals — all in one beautiful, intuitive dashboard.
                    </motion.p>

                    <motion.div className="hero-actions" variants={fadeUp} custom={3}>
                        <Link to="/register" className="btn-hero-primary">
                            Get Started Free
                            <FiArrowRight />
                        </Link>
                        <Link to="/login" className="btn-hero-secondary">
                            Sign In
                        </Link>
                    </motion.div>

                    <motion.div className="hero-trust" variants={fadeUp} custom={4}>
                        <FiCheckCircle />
                        <span>Free forever · No credit card required</span>
                    </motion.div>
                </motion.div>
            </section>

            {/* ─── FEATURES ─── */}
            <section className="landing-features">
                <motion.div
                    className="section-header"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeUp}
                >
                    <span className="section-label">Features</span>
                    <h2>Everything you need to manage money</h2>
                    <p>Powerful tools designed to make personal finance simple and beautiful.</p>
                </motion.div>

                <div className="features-grid">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            className="feature-card"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={scaleIn}
                            custom={i}
                        >
                            <div className="feature-icon" style={{ color: f.color, background: `${f.color}15` }}>
                                {f.icon}
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── STATS ─── */}
            <section className="landing-stats">
                <div className="stats-grid">
                    {stats.map((s, i) => (
                        <motion.div
                            key={i}
                            className="stat-item"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            variants={scaleIn}
                            custom={i}
                        >
                            <div className="stat-icon">{s.icon}</div>
                            <div className="stat-value">{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className="landing-steps">
                <motion.div
                    className="section-header"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeUp}
                >
                    <span className="section-label">How it works</span>
                    <h2>Get started in 3 simple steps</h2>
                </motion.div>

                <div className="steps-grid">
                    {steps.map((s, i) => (
                        <motion.div
                            key={i}
                            className="step-card"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={fadeUp}
                            custom={i}
                        >
                            <span className="step-num">{s.num}</span>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── CTA BANNER ─── */}
            <section className="landing-cta">
                <motion.div
                    className="cta-content"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeUp}
                >
                    <h2>Ready to take control?</h2>
                    <p>Join thousands of users who already manage their finances smarter.</p>
                    <Link to="/register" className="btn-hero-primary">
                        Create Free Account
                        <FiArrowRight />
                    </Link>
                </motion.div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <FiDollarSign />
                        <span>FinanceTracker Pro</span>
                    </div>
                    <p>&copy; {new Date().getFullYear()} FinanceTracker Pro. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;

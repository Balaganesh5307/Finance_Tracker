import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COUNTRIES = [
    { name: 'India', flag: '🇮🇳', currency: 'INR', label: 'INR (₹)' },
    { name: 'United States', flag: '🇺🇸', currency: 'USD', label: 'USD ($)' },
    { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', label: 'GBP (£)' },
    { name: 'Europe', flag: '🇪🇺', currency: 'EUR', label: 'EUR (€)' },
    { name: 'Japan', flag: '🇯🇵', currency: 'JPY', label: 'JPY (¥)' },
    { name: 'Canada', flag: '🇨🇦', currency: 'CAD', label: 'CAD ($)' },
    { name: 'Australia', flag: '🇦🇺', currency: 'AUD', label: 'AUD ($)' }
];

const CountrySelectModal = () => {
    const { user, updateProfile, isAuthenticated } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    // Render nothing if user is not authenticated, is an admin, or already has a country set
    if (!isAuthenticated || !user || user.role === 'admin' || user.country) {
        return null;
    }

    const handleSelectCountry = async (countryObj) => {
        try {
            setSubmitting(true);
            await updateProfile({
                country: countryObj.name,
                currency: countryObj.currency
            });
            toast.success(`Country set to ${countryObj.name}! Currency: ${countryObj.currency}`);
        } catch (err) {
            console.error('Set country error:', err);
            toast.error('Failed to save country choice. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999 }}>
            <div className="modal" style={{ maxWidth: '480px', width: '90%', padding: '2rem', textAlign: 'center', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)' }}>
                <h2 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>🌍 Choose Your Country</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Please select your country to set up the default currency format for your account logs.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                    {COUNTRIES.map((c) => (
                        <button
                            key={c.name}
                            onClick={() => handleSelectCountry(c)}
                            disabled={submitting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.75rem 1rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(9, 132, 227, 0.08)';
                                e.currentTarget.style.borderColor = 'var(--accent-blue)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>{c.flag}</span>
                            <span style={{ flex: 1 }}>{c.name}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                {c.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CountrySelectModal;

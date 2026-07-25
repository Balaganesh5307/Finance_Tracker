import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const getStoredUser = () => {
    try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const storedToken = localStorage.getItem('token');
    const storedUser = getStoredUser();

    const [user, setUser] = useState(storedUser);
    const [token, setToken] = useState(storedToken);
    const [loading, setLoading] = useState(!!storedToken && !storedUser);

    useEffect(() => {
        if (token && !user) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const loadUser = async () => {
        try {
            const res = await api.get('/api/auth/user');
            const userData = {
                id: res.data.id || res.data._id,
                name: res.data.name,
                email: res.data.email,
                role: res.data.role,
                country: res.data.country || null,
                currency: res.data.currency || 'INR',
                avatar: res.data.avatar || 'avatar1'
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (err) {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const res = await api.post('/api/auth/login', { email, password });
        const { token: newToken, user: userData } = res.data;

        const userWithRole = {
            id: userData.id || userData._id,
            name: userData.name,
            email: userData.email || email,
            role: userData.role || 'user',
            country: userData.country || null,
            currency: userData.currency || 'INR',
            avatar: userData.avatar || 'avatar1'
        };

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userWithRole));

        setToken(newToken);
        setUser(userWithRole);

        return res.data;
    };

    const register = async (name, email, password) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const res = await api.post('/api/auth/register', { name, email, password });
        const { token: newToken, user: userData } = res.data;

        const userWithRole = {
            id: userData.id || userData._id,
            name: userData.name,
            email: userData.email || email,
            role: userData.role || 'user',
            country: userData.country || null,
            currency: userData.currency || 'INR',
            avatar: userData.avatar || 'avatar1'
        };

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userWithRole));

        setToken(newToken);
        setUser(userWithRole);

        return res.data;
    };

    const loginWithGoogle = async (credential) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const res = await api.post('/api/auth/google-login', { credential });
        const { token: newToken, user: userData } = res.data;

        const userWithRole = {
            id: userData.id || userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role || 'user',
            country: userData.country || null,
            currency: userData.currency || 'INR',
            avatar: userData.avatar || 'avatar1'
        };

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userWithRole));

        setToken(newToken);
        setUser(userWithRole);

        return res.data;
    };

    const updateProfile = async (profileData) => {
        const res = await api.put('/api/auth/profile', profileData);
        const { user: userData } = res.data;
        const updatedUser = {
            id: userData.id || userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            country: userData.country || null,
            currency: userData.currency || 'INR',
            avatar: userData.avatar || 'avatar1'
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return updatedUser;
    };

    const formatCurrency = (amount) => {
        const COUNTRY_CURRENCY_MAP = {
            'India': { code: 'INR', locale: 'en-IN' },
            'United States': { code: 'USD', locale: 'en-US' },
            'United Kingdom': { code: 'GBP', locale: 'en-GB' },
            'Europe': { code: 'EUR', locale: 'de-DE' },
            'Japan': { code: 'JPY', locale: 'ja-JP' },
            'Canada': { code: 'CAD', locale: 'en-CA' },
            'Australia': { code: 'AUD', locale: 'en-AU' }
        };

        const code = user?.currency || 'INR';
        const localeMap = Object.values(COUNTRY_CURRENCY_MAP).find(c => c.code === code);
        const locale = localeMap ? localeMap.locale : 'en-IN';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        updateProfile,
        formatCurrency,
        logout,
        isAuthenticated: !!token && !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

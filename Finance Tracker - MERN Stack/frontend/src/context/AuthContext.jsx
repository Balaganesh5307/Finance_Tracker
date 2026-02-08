import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api';

const AuthContext = createContext(null);

const ADMIN_EMAILS = ['admin5307@gmail.com'];

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

const getRoleFromToken = (token) => {
    try {
        const decoded = jwtDecode(token);
        return decoded.role || null;
    } catch {
        return null;
    }
};

const determineRole = (email, tokenRole, apiRole) => {
    if (ADMIN_EMAILS.includes(email?.toLowerCase())) {
        return 'admin';
    }
    return apiRole || tokenRole || 'user';
};

export const AuthProvider = ({ children }) => {
    const storedToken = localStorage.getItem('token');
    const storedUser = getStoredUser();

    const [user, setUser] = useState(() => {
        if (storedUser) {
            const role = determineRole(storedUser.email, null, storedUser.role);
            return { ...storedUser, role };
        }
        return null;
    });
    const [token, setToken] = useState(storedToken);
    const [loading, setLoading] = useState(!!storedToken && !storedUser);

    useEffect(() => {
        if (token && !user) {
            loadUser();
        } else if (token && user) {
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [token]);

    const loadUser = async () => {
        try {
            const res = await api.get('/api/auth/user');
            const tokenRole = getRoleFromToken(token);
            const role = determineRole(res.data.email, tokenRole, res.data.role);
            const userData = {
                id: res.data.id || res.data._id,
                name: res.data.name,
                email: res.data.email,
                role: role
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

        const tokenRole = getRoleFromToken(newToken);
        const role = determineRole(userData.email || email, tokenRole, userData.role);

        const userWithRole = {
            id: userData.id,
            name: userData.name,
            email: userData.email || email,
            role: role
        };

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userWithRole));

        setToken(newToken);
        setUser(userWithRole);

        return { ...res.data, user: userWithRole };
    };

    const register = async (name, email, password) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const res = await api.post('/api/auth/register', { name, email, password });
        const { token: newToken, user: userData } = res.data;

        const role = determineRole(userData.email || email, null, userData.role);
        const userWithRole = { ...userData, role };

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userWithRole));

        setToken(newToken);
        setUser(userWithRole);

        return res.data;
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
        logout,
        isAuthenticated: !!token && !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
